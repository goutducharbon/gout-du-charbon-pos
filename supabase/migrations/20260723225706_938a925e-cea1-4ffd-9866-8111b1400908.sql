
-- =========================================================================
-- Le Goût du Charbon — Schéma initial du système de caisse
-- =========================================================================

-- 1) TYPES ----------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'cashier');
CREATE TYPE public.employee_role AS ENUM ('admin', 'manager', 'caissier');
CREATE TYPE public.order_type AS ENUM ('sur-place', 'emporter', 'livrer', 'glovo');
CREATE TYPE public.order_status AS ENUM ('en-cuisine', 'encaissee', 'annulee', 'remboursee');
CREATE TYPE public.payment_method AS ENUM ('especes', 'carte', 'virement', 'glovo', 'autre');
CREATE TYPE public.discount_type AS ENUM ('dh', 'percent');
CREATE TYPE public.invoice_kind AS ENUM ('devis', 'facture');

-- 2) TRIGGER updated_at partagé ------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3) PROFILES + ROLES -----------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: read own or authed" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles: update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles: read own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fonction sécurisée pour vérifier un rôle (évite la récursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

-- Trigger auto-création profil à la création d'un user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) RESTAURANT SETTINGS (singleton) --------------------------------------
CREATE TABLE public.restaurant_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT 'Le Goût du Charbon',
  address text NOT NULL DEFAULT 'Témara — Maroc',
  phone text DEFAULT '',
  ice text DEFAULT '',
  footer text DEFAULT 'Merci pour votre visite ! 🔥',
  vat_rate numeric NOT NULL DEFAULT 20,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.restaurant_settings (id) VALUES (1);
GRANT SELECT ON public.restaurant_settings TO authenticated, anon;
GRANT UPDATE ON public.restaurant_settings TO authenticated;
GRANT ALL ON public.restaurant_settings TO service_role;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings: read all" ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "settings: owner update" ON public.restaurant_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.restaurant_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5) CATEGORIES -----------------------------------------------------------
CREATE TABLE public.categories (
  id text PRIMARY KEY,
  label text NOT NULL,
  icon text,
  vat_rate numeric,
  hidden boolean NOT NULL DEFAULT false,
  disabled boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories: read all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories: staff write" ON public.categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 6) MENU ITEMS -----------------------------------------------------------
CREATE TABLE public.menu_items (
  id text PRIMARY KEY,
  category_id text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  img text,
  has_extras boolean NOT NULL DEFAULT false,
  has_cuisson boolean NOT NULL DEFAULT false,
  has_sauces boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  out_of_stock boolean NOT NULL DEFAULT false,
  stock integer,               -- NULL = illimité
  stock_threshold integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);
GRANT SELECT ON public.menu_items TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_items: read all" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "menu_items: staff write" ON public.menu_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_menu_items_updated BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 7) MENU EXTRAS (toppings, sauces) --------------------------------------
CREATE TABLE public.menu_extras (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  img text,
  group_name text,  -- 'topping' | 'sauce'
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_extras TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.menu_extras TO authenticated;
GRANT ALL ON public.menu_extras TO service_role;
ALTER TABLE public.menu_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_extras: read all" ON public.menu_extras FOR SELECT USING (true);
CREATE POLICY "menu_extras: staff write" ON public.menu_extras FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 8) EMPLOYEES ------------------------------------------------------------
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  role public.employee_role NOT NULL DEFAULT 'caissier',
  pin_hash text,           -- hash bcrypt du PIN (jamais le PIN en clair)
  phone text,
  hourly_rate numeric,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
-- Lecture par tout staff (nécessaire pour l'affichage du caissier actif)
-- MAIS pas le champ pin_hash : on utilisera une vue publique.
CREATE POLICY "employees: staff read" ON public.employees FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "employees: owner write" ON public.employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'manager'));
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 9) PIN ATTEMPTS (anti brute-force) --------------------------------------
CREATE TABLE public.pin_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text,
  ip text,
  success boolean NOT NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pin_attempts_device_at ON public.pin_attempts(device_id, at DESC);
GRANT SELECT, INSERT ON public.pin_attempts TO authenticated, anon;
GRANT ALL ON public.pin_attempts TO service_role;
ALTER TABLE public.pin_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pin_attempts: insert" ON public.pin_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "pin_attempts: staff read" ON public.pin_attempts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- 10) CLIENTS + FIDÉLITÉ --------------------------------------------------
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  ice text,
  note text,
  visits integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  last_visit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients: staff all" ON public.clients FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 11) CASH SESSIONS -------------------------------------------------------
CREATE TABLE public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at timestamptz NOT NULL DEFAULT now(),
  opening_cash numeric NOT NULL DEFAULT 0,
  closed_at timestamptz,
  closing_cash numeric,
  cashier_name text,
  cashier_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  opened_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cash_sessions_opened ON public.cash_sessions(opened_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.cash_sessions TO authenticated;
GRANT ALL ON public.cash_sessions TO service_role;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_sessions: staff read" ON public.cash_sessions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "cash_sessions: staff write" ON public.cash_sessions FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "cash_sessions: staff update" ON public.cash_sessions FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 12) ORDERS --------------------------------------------------------------
CREATE SEQUENCE public.ticket_seq START 1;
GRANT USAGE, SELECT ON SEQUENCE public.ticket_seq TO authenticated, service_role;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no bigint NOT NULL DEFAULT nextval('public.ticket_seq'),
  type public.order_type NOT NULL,
  table_no text,
  client_name text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  discount_type public.discount_type NOT NULL DEFAULT 'dh',
  discount_value numeric NOT NULL DEFAULT 0,
  discount_reason text,
  total numeric NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'en-cuisine',
  payments jsonb NOT NULL DEFAULT '[]'::jsonb,
  session_id uuid REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
  cashier_name text,
  cashier_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  cancelled_by text,
  refunded_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_to_kitchen_at timestamptz,
  paid_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_session ON public.orders(session_id);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders: staff all" ON public.orders FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Trigger fidélité automatique quand une commande passe à 'encaissee'
CREATE OR REPLACE FUNCTION public.tg_record_client_visit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'encaissee' AND (OLD.status IS DISTINCT FROM 'encaissee') AND NEW.client_id IS NOT NULL THEN
    UPDATE public.clients
       SET visits = visits + 1,
           total_spent = total_spent + GREATEST(0, NEW.total),
           last_visit_at = now()
     WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_orders_client_visit AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_record_client_visit();

-- 13) STOCK MOVEMENTS -----------------------------------------------------
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text,
  item_name text NOT NULL,
  delta integer NOT NULL,
  reason text,
  by_name text,
  by_user uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_movements_at ON public.stock_movements(at DESC);
CREATE INDEX idx_stock_movements_item ON public.stock_movements(item_id);
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_movements: staff all" ON public.stock_movements FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 14) INVOICES (devis / factures) ----------------------------------------
CREATE SEQUENCE public.devis_seq START 1;
CREATE SEQUENCE public.facture_seq START 1;
GRANT USAGE, SELECT ON SEQUENCE public.devis_seq, public.facture_seq TO authenticated, service_role;

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  kind public.invoice_kind NOT NULL,
  client_name text NOT NULL,
  client_address text,
  client_phone text,
  client_ice text,
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  discount numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 20,
  notes text,
  paid boolean NOT NULL DEFAULT false,
  from_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_kind ON public.invoices(kind);
CREATE INDEX idx_invoices_created ON public.invoices(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices: staff all" ON public.invoices FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 15) AUDIT LOG (journal WORM) -------------------------------------------
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  action text NOT NULL,
  entity text NOT NULL,       -- ex 'order', 'employee', 'menu_item'
  entity_id text,
  details jsonb,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_at ON public.audit_log(at DESC);
CREATE INDEX idx_audit_entity ON public.audit_log(entity, entity_id);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log: staff insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "audit_log: owner read" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));
-- Pas d'UPDATE ni DELETE : WORM (write once, read many)
