
-- 1) profiles: restrict SELECT to own row
DROP POLICY IF EXISTS "profiles: read own or authed" ON public.profiles;
CREATE POLICY "profiles: read own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2) pin_attempts: require authenticated for insert
DROP POLICY IF EXISTS "pin_attempts: insert limited" ON public.pin_attempts;
CREATE POLICY "pin_attempts: insert authed"
  ON public.pin_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    device_id IS NOT NULL
    AND length(device_id) BETWEEN 8 AND 128
  );

-- 3) Switch has_role / is_staff to SECURITY INVOKER.
-- user_roles has an "authenticated: read own" policy scoped to auth.uid() = user_id,
-- and both functions are only ever called with auth.uid() as _user_id, so RLS still
-- resolves correctly under the caller's identity. This removes the elevated-privilege
-- surface flagged by the linter.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  );
$$;
