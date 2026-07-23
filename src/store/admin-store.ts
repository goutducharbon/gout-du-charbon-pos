import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MENU, type MenuCategory, type MenuItem } from "@/data/menu";

const ADMIN_EMAIL = "goutducharbon@gmail.com";
const ADMIN_PASSWORD = "Vendredi94.";

export type ItemOverride = {
  name?: string;
  price?: number;
  desc?: string;
  img?: string;
  outOfStock?: boolean;
  hidden?: boolean;
};

export type CategoryOverride = {
  label?: string;
  icon?: string;
  hidden?: boolean;
};

export type CustomItem = MenuItem & { categoryId: string };

export type EmployeeRole = "admin" | "manager" | "caissier";

export type Employee = {
  id: string;
  name: string;
  role: EmployeeRole;
  pin?: string; // 4 digits
  phone?: string;
  hourlyRate?: number;
  active: boolean;
  createdAt: number;
};

export type Client = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  ice?: string;
  note?: string;
  createdAt: number;
  // Fidélité — alimenté automatiquement à chaque encaissement lié à ce client
  visits?: number;
  totalSpent?: number;
  lastVisitAt?: number;
};

export type CustomCategory = {
  id: string;
  label: string;
  icon?: string; // emoji
};

export type AdminRole = "owner" | "manager";

export type StockMovement = {
  id: string;
  itemId: string;
  itemName: string;
  delta: number; // + = entrée, - = sortie
  reason: string;
  by?: string;
  at: number;
};

export type InvoiceKind = "devis" | "facture";

export type InvoiceLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type Invoice = {
  id: string;
  number: string;
  kind: InvoiceKind;
  createdAt: number;
  client: { name: string; address?: string; phone?: string; ice?: string };
  lines: InvoiceLine[];
  discount: number;
  vatRate: number;
  notes?: string;
  paid?: boolean;
  fromOrderId?: string;
};

type AdminState = {
  authed: boolean;
  role: AdminRole | null;
  roleName?: string; // nom de la personne connectée (manager) — vide pour le compte propriétaire
  overrides: Record<string, ItemOverride>;
  categoryOverrides: Record<string, CategoryOverride>;
  disabledCategories: string[];
  customCategories: CustomCategory[];
  categoryOrder: string[];
  categoryVatRates: Record<string, number>;
  customItems: CustomItem[];
  caissiers: string[]; // legacy
  employees: Employee[];
  clients: Client[];
  stockThresholds: Record<string, number>;
  stockMovements: StockMovement[];
  invoices: Invoice[];
  invoiceCounters: { devis: number; facture: number };
};

type AdminActions = {
  login: (email: string, password: string) => boolean;
  /** Connexion restreinte (manager) par code PIN — nécessite un employé actif rôle manager ou admin. */
  loginWithPin: (pin: string) => boolean;
  logout: () => void;
  setOverride: (itemId: string, patch: ItemOverride) => void;
  clearOverride: (itemId: string) => void;
  toggleOutOfStock: (itemId: string) => void;
  toggleHidden: (itemId: string) => void;
  toggleCategory: (catId: string) => void;
  setCategoryOverride: (catId: string, patch: CategoryOverride) => void;
  addCategory: (label: string, icon?: string) => CustomCategory;
  removeCategory: (catId: string) => void;
  moveCategory: (catId: string, direction: "up" | "down", orderedIds: string[]) => void;
  setCategoryVatRate: (catId: string, rate: number | undefined) => void;
  addCustomItem: (item: CustomItem) => void;
  removeCustomItem: (itemId: string) => void;
  addCaissier: (name: string) => void;
  removeCaissier: (name: string) => void;
  addEmployee: (e: Omit<Employee, "id" | "createdAt">) => Employee;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  addClient: (c: Omit<Client, "id" | "createdAt">) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  removeClient: (id: string) => void;
  recordClientVisit: (clientId: string, amount: number) => void;
  setStockThreshold: (itemId: string, threshold: number) => void;
  addStockMovement: (m: Omit<StockMovement, "id" | "at">) => void;
  createInvoice: (input: Omit<Invoice, "id" | "number" | "createdAt">) => Invoice;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  convertToFacture: (id: string) => Invoice | null;
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const useAdmin = create<AdminState & AdminActions>()(
  persist(
    (set, get) => ({
      authed: false,
      role: null,
      roleName: undefined,
      overrides: {},
      categoryOverrides: {},
      disabledCategories: [],
      customCategories: [],
      categoryOrder: [],
      categoryVatRates: {},
      customItems: [],
      caissiers: [],
      employees: [],
      clients: [],
      stockThresholds: {},
      stockMovements: [],
      invoices: [],
      invoiceCounters: { devis: 0, facture: 0 },

      login: (email, password) => {
        const ok =
          email.trim().toLowerCase() === ADMIN_EMAIL &&
          password === ADMIN_PASSWORD;
        if (ok) set({ authed: true, role: "owner", roleName: undefined });
        return ok;
      },
      loginWithPin: (pin) => {
        const p = pin.trim();
        if (!/^\d{4}$/.test(p)) return false;
        const emp = get().employees.find(
          (e) => e.active && e.pin === p && (e.role === "manager" || e.role === "admin"),
        );
        if (!emp) return false;
        set({ authed: true, role: "manager", roleName: emp.name });
        return true;
      },
      logout: () => set({ authed: false, role: null, roleName: undefined }),

      setOverride: (itemId, patch) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            [itemId]: { ...s.overrides[itemId], ...patch },
          },
        })),
      clearOverride: (itemId) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[itemId];
          return { overrides: next };
        }),
      toggleOutOfStock: (itemId) => {
        const cur = get().overrides[itemId]?.outOfStock ?? false;
        get().setOverride(itemId, { outOfStock: !cur });
      },
      toggleHidden: (itemId) => {
        const cur = get().overrides[itemId]?.hidden ?? false;
        get().setOverride(itemId, { hidden: !cur });
      },
      toggleCategory: (catId) =>
        set((s) => ({
          disabledCategories: s.disabledCategories.includes(catId)
            ? s.disabledCategories.filter((x) => x !== catId)
            : [...s.disabledCategories, catId],
        })),
      setCategoryOverride: (catId, patch) =>
        set((s) => ({
          categoryOverrides: {
            ...s.categoryOverrides,
            [catId]: { ...s.categoryOverrides[catId], ...patch },
          },
        })),

      addCategory: (label, icon) => {
        const cat: CustomCategory = {
          id: `cat-${Date.now()}`,
          label: label.trim() || "Nouvelle catégorie",
          icon: icon?.trim() || undefined,
        };
        set((s) => ({
          customCategories: [...s.customCategories, cat],
          categoryOrder: [...s.categoryOrder, cat.id],
        }));
        return cat;
      },
      removeCategory: (catId) =>
        set((s) => ({
          customCategories: s.customCategories.filter((c) => c.id !== catId),
          customItems: s.customItems.filter((i) => i.categoryId !== catId),
          categoryOrder: s.categoryOrder.filter((id) => id !== catId),
          categoryOverrides: Object.fromEntries(
            Object.entries(s.categoryOverrides).filter(([id]) => id !== catId),
          ),
          categoryVatRates: Object.fromEntries(
            Object.entries(s.categoryVatRates).filter(([id]) => id !== catId),
          ),
        })),
      moveCategory: (catId, direction, orderedIds) => {
        const idx = orderedIds.indexOf(catId);
        if (idx === -1) return;
        const swapWith = direction === "up" ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= orderedIds.length) return;
        const next = [...orderedIds];
        [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
        set({ categoryOrder: next });
      },
      setCategoryVatRate: (catId, rate) =>
        set((s) => {
          const next = { ...s.categoryVatRates };
          if (rate === undefined || Number.isNaN(rate)) {
            delete next[catId];
          } else {
            next[catId] = Math.max(0, rate);
          }
          return { categoryVatRates: next };
        }),

      addCustomItem: (item) =>
        set((s) => ({ customItems: [...s.customItems, item] })),
      removeCustomItem: (itemId) =>
        set((s) => ({
          customItems: s.customItems.filter((i) => i.id !== itemId),
        })),

      addCaissier: (name) =>
        set((s) => {
          const t = name.trim();
          if (!t || s.caissiers.includes(t)) return s;
          return { caissiers: [...s.caissiers, t] };
        }),
      removeCaissier: (name) =>
        set((s) => ({ caissiers: s.caissiers.filter((n) => n !== name) })),

      addEmployee: (e) => {
        const emp: Employee = { ...e, id: uid(), createdAt: Date.now() };
        set((s) => ({
          employees: [emp, ...s.employees],
          caissiers: s.caissiers.includes(emp.name)
            ? s.caissiers
            : [...s.caissiers, emp.name],
        }));
        return emp;
      },
      updateEmployee: (id, patch) =>
        set((s) => ({
          employees: s.employees.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        })),
      removeEmployee: (id) =>
        set((s) => {
          const emp = s.employees.find((e) => e.id === id);
          return {
            employees: s.employees.filter((e) => e.id !== id),
            caissiers: emp ? s.caissiers.filter((n) => n !== emp.name) : s.caissiers,
          };
        }),

      addClient: (c) => {
        const cli: Client = { ...c, id: uid(), createdAt: Date.now() };
        set((s) => ({ clients: [cli, ...s.clients] }));
        return cli;
      },
      updateClient: (id, patch) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeClient: (id) =>
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),
      recordClientVisit: (clientId, amount) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  visits: (c.visits ?? 0) + 1,
                  totalSpent: (c.totalSpent ?? 0) + Math.max(0, amount),
                  lastVisitAt: Date.now(),
                }
              : c,
          ),
        })),

      setStockThreshold: (itemId, threshold) =>
        set((s) => ({
          stockThresholds: {
            ...s.stockThresholds,
            [itemId]: Math.max(0, threshold),
          },
        })),
      addStockMovement: (m) =>
        set((s) => ({
          stockMovements: [
            { ...m, id: uid(), at: Date.now() },
            ...s.stockMovements,
          ].slice(0, 500),
        })),

      createInvoice: (input) => {
        const year = new Date().getFullYear();
        const counters = { ...get().invoiceCounters };
        counters[input.kind] += 1;
        const prefix = input.kind === "devis" ? "DEV" : "FAC";
        const number = `${prefix}-${year}-${String(counters[input.kind]).padStart(4, "0")}`;
        const inv: Invoice = {
          ...input,
          id: uid(),
          number,
          createdAt: Date.now(),
        };
        set((s) => ({
          invoices: [inv, ...s.invoices],
          invoiceCounters: counters,
        }));
        return inv;
      },
      updateInvoice: (id, patch) =>
        set((s) => ({
          invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      deleteInvoice: (id) =>
        set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) })),
      convertToFacture: (id) => {
        const src = get().invoices.find((i) => i.id === id);
        if (!src || src.kind !== "devis") return null;
        return get().createInvoice({
          kind: "facture",
          client: src.client,
          lines: src.lines,
          discount: src.discount,
          vatRate: src.vatRate,
          notes: src.notes,
          fromOrderId: src.fromOrderId,
        });
      },
    }),
    { name: "gdc-admin-store-v2" },
  ),
);

/** Applique overrides + custom items + catégories personnalisées + ordre + labels/icônes sur le MENU statique. */
export function getEffectiveMenu(
  overrides: Record<string, ItemOverride>,
  disabledCategories: string[],
  customItems: CustomItem[],
  categoryOverrides: Record<string, CategoryOverride> = {},
  opts: { includeHidden?: boolean; customCategories?: CustomCategory[]; categoryOrder?: string[] } = {},
): (MenuCategory & { icon?: string })[] {
  const { includeHidden = false, customCategories = [], categoryOrder = [] } = opts;

  const applyOverride = (it: MenuItem): MenuItem => {
    const o = overrides[it.id];
    if (!o) return it;
    return {
      ...it,
      name: o.name ?? it.name,
      price: o.price ?? it.price,
      desc: o.desc ?? it.desc,
      img: o.img ?? it.img,
    };
  };

  const allCategories: MenuCategory[] = [
    ...MENU,
    ...customCategories.map((c) => ({ id: c.id, label: c.label, items: [] as MenuItem[] })),
  ];

  const built = allCategories
    .filter((c) => !disabledCategories.includes(c.id))
    .filter((c) => includeHidden || !categoryOverrides[c.id]?.hidden)
    .map((c) => {
      const custom = customItems.filter((i) => i.categoryId === c.id);
      const items = [...c.items, ...custom]
        .filter((i) => includeHidden || !overrides[i.id]?.hidden)
        .map(applyOverride);
      const co = categoryOverrides[c.id];
      const customCat = customCategories.find((cc) => cc.id === c.id);
      return {
        ...c,
        label: co?.label ?? c.label,
        icon: co?.icon ?? customCat?.icon,
        items,
      };
    })
    .filter((c) => c.items.length > 0 || includeHidden);

  if (categoryOrder.length === 0) return built;

  const rank = (id: string) => {
    const idx = categoryOrder.indexOf(id);
    return idx === -1 ? categoryOrder.length + 1 : idx;
  };
  return [...built].sort((a, b) => rank(a.id) - rank(b.id));
}

export const isOutOfStock = (
  overrides: Record<string, ItemOverride>,
  itemId: string,
) => !!overrides[itemId]?.outOfStock;

/** Hook: menu effectif réactif basé sur les overrides admin. */
export function useEffectiveMenu(includeHidden = false): (MenuCategory & { icon?: string })[] {
  const overrides = useAdmin((s) => s.overrides);
  const disabled = useAdmin((s) => s.disabledCategories);
  const custom = useAdmin((s) => s.customItems);
  const catOverrides = useAdmin((s) => s.categoryOverrides);
  const customCategories = useAdmin((s) => s.customCategories);
  const categoryOrder = useAdmin((s) => s.categoryOrder);
  return useMemo(
    () =>
      getEffectiveMenu(overrides, disabled, custom, catOverrides, {
        includeHidden,
        customCategories,
        categoryOrder,
      }),
    [overrides, disabled, custom, catOverrides, includeHidden, customCategories, categoryOrder],
  );
}

/** Retrouve la catégorie d'un article (menu statique + catégories/articles personnalisés). */
export function findItemCategoryId(
  itemId: string,
  customItems: CustomItem[],
  customCategories: CustomCategory[] = [],
): string | undefined {
  for (const c of MENU) {
    if (c.items.some((i) => i.id === itemId)) return c.id;
  }
  const ci = customItems.find((i) => i.id === itemId);
  if (ci) return ci.categoryId;
  return undefined;
}

/** Taux de TVA effectif d'un article : override catégorie sinon taux global. */
export function getItemVatRate(
  itemId: string,
  customItems: CustomItem[],
  categoryVatRates: Record<string, number>,
  globalRate: number,
): number {
  const catId = findItemCategoryId(itemId, customItems);
  if (catId && categoryVatRates[catId] !== undefined) return categoryVatRates[catId];
  return globalRate;
}
