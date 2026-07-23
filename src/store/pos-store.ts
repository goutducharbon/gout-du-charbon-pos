import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cuisson } from "@/data/menu";
import { useAdmin } from "@/store/admin-store";

export type OrderType = "sur-place" | "emporter" | "livrer" | "glovo";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  "sur-place": "Sur place",
  emporter: "À emporter",
  livrer: "Livraison",
  glovo: "Glovo",
};

export type CartLine = {
  lineId: string;
  itemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  extras: { id: string; name: string; price: number }[];
  cuisson?: Cuisson;
  note?: string;
  offered?: boolean; // article offert (gratuit)
};

export type PaymentMethod = "especes" | "carte" | "virement" | "glovo" | "autre";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  especes: "Espèces",
  carte: "Carte bancaire",
  virement: "Virement",
  glovo: "Glovo",
  autre: "Autre",
};

export type DiscountType = "dh" | "percent";

export type Payment = {
  method: PaymentMethod;
  amount: number;
  cashReceived?: number;
  change?: number;
};

export type OrderStatus = "en-cuisine" | "encaissee" | "annulee" | "remboursee";

export type Order = {
  id: string;
  ticketNo: number;
  type: OrderType;
  tableNo?: string;
  clientName?: string;
  clientId?: string; // lien vers la fiche client (Admin → Clients), pour la fidélité
  lines: CartLine[];
  subtotal: number;
  discount: number;
  discountType: DiscountType;
  discountValue: number; // valeur saisie (DH ou %)
  discountReason?: string;
  total: number;
  status: OrderStatus;
  createdAt: number;
  sentToKitchenAt?: number;
  paidAt?: number;
  payments: Payment[];
  // legacy fields kept for compat
  paymentMethod?: PaymentMethod;
  cashReceived?: number;
  change?: number;
  sessionId: string;
  cashierName?: string;
  cancelledBy?: string;
  refundedBy?: string;
};

export type CashSession = {
  id: string;
  openedAt: number;
  openingCash: number;
  closedAt?: number;
  closingCash?: number;
  cashierName?: string;
  note?: string;
};

export type RestaurantSettings = {
  name: string;
  address: string;
  phone: string;
  ice: string;
  footer: string;
};

type State = {
  cart: CartLine[];
  currentType: OrderType;
  currentTable: string;
  currentClient: string;
  currentClientId?: string;
  currentDiscountType: DiscountType;
  currentDiscountValue: number;
  currentDiscountReason: string;
  activeSession: CashSession | null;
  sessions: CashSession[];
  orders: Order[];
  ticketCounter: number;
  cashierName: string;
  vatRate: number;
  settings: RestaurantSettings;
  stocks: Record<string, number>; // id -> quantité disponible
};

type Actions = {
  addLine: (line: Omit<CartLine, "lineId">) => void;
  updateLine: (lineId: string, patch: Partial<CartLine>) => void;
  removeLine: (lineId: string) => void;
  toggleOffered: (lineId: string) => void;
  clearCart: () => void;
  setType: (t: OrderType) => void;
  setTable: (t: string) => void;
  setClient: (c: string, clientId?: string) => void;
  setDiscount: (type: DiscountType, value: number, reason?: string) => void;
  openSession: (openingCash: number, cashierName?: string) => void;
  closeSession: (closingCash: number, note?: string) => void;
  /** Rouvre une session déjà clôturée (uniquement si aucune session n'est active). */
  reopenSession: (sessionId: string) => boolean;
  sendToKitchen: () => Order | null;
  cashOut: (
    payments: Payment[],
    existingOrderId?: string,
  ) => Order | null;
  cancelOrder: (id: string, by?: string) => void;
  refundOrder: (id: string, by?: string) => void;
  setCashierName: (n: string) => void;
  updateSettings: (patch: Partial<RestaurantSettings>) => void;
  setStock: (itemId: string, quantity: number) => void;
  decrementStock: (itemId: string, quantity: number) => boolean;
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const lineUnitPrice = (l: CartLine) =>
  l.basePrice + l.extras.reduce((s, e) => s + e.price, 0);

const computeLineTotal = (l: CartLine) =>
  l.offered ? 0 : lineUnitPrice(l) * l.quantity;

export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((s, l) => s + computeLineTotal(l), 0);

export const computeVatAmount = (total: number, rate: number) => {
  if (rate <= 0) return 0;
  // Le total est TTC, on calcule la TVA comprise dedans
  // TVA = Total - (Total / (1 + taux/100))
  return total - total / (1 + rate / 100);
};

export const computeDiscountAmount = (
  subtotal: number,
  type: DiscountType,
  value: number,
) => {
  if (value <= 0) return 0;
  if (type === "percent") return Math.min(subtotal, (subtotal * value) / 100);
  return Math.min(subtotal, value);
};

const DEFAULT_SETTINGS: RestaurantSettings = {
  name: "Le Goût du Charbon",
  address: "Témara — Maroc",
  phone: "",
  ice: "",
  footer: "Merci pour votre visite ! 🔥",
};

export const usePos = create<State & Actions>()(
  persist(
    (set, get) => ({
      cart: [],
      currentType: "sur-place",
      currentTable: "",
      currentClient: "",
      currentClientId: undefined,
      currentDiscountType: "dh",
      currentDiscountValue: 0,
      currentDiscountReason: "",
      activeSession: null,
      sessions: [],
      orders: [],
      ticketCounter: 1,
      cashierName: "",
      vatRate: 20, // TVA par défaut à 20%
      settings: DEFAULT_SETTINGS,
      stocks: {},

      addLine: (line) =>
        set((s) => {
          // On ne regroupe que si l'article est strictement identique (mêmes extras, cuisson, note, offert)
          const idx = s.cart.findIndex(
            (l) =>
              l.itemId === line.itemId &&
              l.cuisson === line.cuisson &&
              l.note === line.note &&
              l.offered === line.offered &&
              l.extras.length === line.extras.length &&
              l.extras.every((e, i) => e.id === line.extras[i]?.id),
          );
          if (idx !== -1) {
            const next = [...s.cart];
            next[idx] = { ...next[idx], quantity: next[idx].quantity + line.quantity };
            return { cart: next };
          }
          return { cart: [...s.cart, { ...line, lineId: uid() }] };
        }),

      updateLine: (lineId, patch) =>
        set((s) => ({
          cart: s.cart.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)),
        })),

      removeLine: (lineId) =>
        set((s) => ({ cart: s.cart.filter((l) => l.lineId !== lineId) })),

      toggleOffered: (lineId) =>
        set((s) => ({
          cart: s.cart.map((l) =>
            l.lineId === lineId ? { ...l, offered: !l.offered } : l,
          ),
        })),

      clearCart: () =>
        set({
          cart: [],
          currentTable: "",
          currentClient: "",
          currentClientId: undefined,
          currentDiscountType: "dh",
          currentDiscountValue: 0,
          currentDiscountReason: "",
        }),

      setType: (currentType) => set({ currentType }),
      setTable: (currentTable) => set({ currentTable }),
      setClient: (currentClient, clientId) =>
        set({ currentClient, currentClientId: clientId }),
      setDiscount: (type, value, reason) =>
        set({
          currentDiscountType: type,
          currentDiscountValue: Math.max(0, value),
          currentDiscountReason: reason ?? "",
        }),

      openSession: (openingCash, cashierName) =>
        set((s) => {
          if (s.activeSession) return s;
          const session: CashSession = {
            id: uid(),
            openedAt: Date.now(),
            openingCash,
            cashierName: cashierName || s.cashierName || undefined,
          };
          return {
            activeSession: session,
            sessions: [session, ...s.sessions],
            cashierName: cashierName || s.cashierName,
          };
        }),

      closeSession: (closingCash, note) =>
        set((s) => {
          if (!s.activeSession) return s;
          const closed: CashSession = {
            ...s.activeSession,
            closedAt: Date.now(),
            closingCash,
            note,
          };
          return {
            activeSession: null,
            sessions: s.sessions.map((x) => (x.id === closed.id ? closed : x)),
          };
        }),

      reopenSession: (sessionId) => {
        const s = get();
        if (s.activeSession) return false;
        const target = s.sessions.find((x) => x.id === sessionId);
        if (!target || !target.closedAt) return false;
        const reopened: CashSession = { ...target, closedAt: undefined, closingCash: undefined };
        set({
          activeSession: reopened,
          sessions: s.sessions.map((x) => (x.id === sessionId ? reopened : x)),
          cashierName: reopened.cashierName || s.cashierName,
        });
        return true;
      },

      sendToKitchen: () => {
        const s = get();
        if (!s.activeSession || s.cart.length === 0) return null;
        const subtotal = cartSubtotal(s.cart);
        const discount = computeDiscountAmount(
          subtotal,
          s.currentDiscountType,
          s.currentDiscountValue,
        );
        const total = Math.max(0, subtotal - discount);
        const order: Order = {
          id: uid(),
          ticketNo: s.ticketCounter,
          type: s.currentType,
          tableNo: s.currentTable || undefined,
          clientName: s.currentClient || undefined,
          clientId: s.currentClientId,
          lines: s.cart,
          subtotal,
          discount,
          discountType: s.currentDiscountType,
          discountValue: s.currentDiscountValue,
          discountReason: s.currentDiscountReason || undefined,
          total,
          status: "en-cuisine",
          createdAt: Date.now(),
          sentToKitchenAt: Date.now(),
          payments: [],
          sessionId: s.activeSession.id,
          cashierName: s.cashierName || undefined,
        };
        set({
          orders: [order, ...s.orders],
          ticketCounter: s.ticketCounter + 1,
          cart: [],
          currentTable: "",
          currentClient: "",
          currentClientId: undefined,
          currentDiscountType: "dh",
          currentDiscountValue: 0,
          currentDiscountReason: "",
        });
        return order;
      },

      cashOut: (payments, existingOrderId) => {
        const s = get();
        if (!s.activeSession) return null;

        if (existingOrderId) {
          const found = s.orders.find((o) => o.id === existingOrderId);
          if (!found) return null;
          const primary = payments[0];
          const updated: Order = {
            ...found,
            status: "encaissee",
            paidAt: Date.now(),
            payments,
            paymentMethod: primary?.method,
            cashReceived: primary?.cashReceived,
            change: primary?.change,
          };
          set({ orders: s.orders.map((o) => (o.id === existingOrderId ? updated : o)) });
          if (updated.clientId) {
            useAdmin.getState().recordClientVisit(updated.clientId, updated.total);
          }
          return updated;
        }

        if (s.cart.length === 0) return null;
        const subtotal = cartSubtotal(s.cart);
        const discount = computeDiscountAmount(
          subtotal,
          s.currentDiscountType,
          s.currentDiscountValue,
        );
        const total = Math.max(0, subtotal - discount);
        const primary = payments[0];
        const order: Order = {
          id: uid(),
          ticketNo: s.ticketCounter,
          type: s.currentType,
          tableNo: s.currentTable || undefined,
          clientName: s.currentClient || undefined,
          clientId: s.currentClientId,
          lines: s.cart,
          subtotal,
          discount,
          discountType: s.currentDiscountType,
          discountValue: s.currentDiscountValue,
          discountReason: s.currentDiscountReason || undefined,
          total,
          status: "encaissee",
          createdAt: Date.now(),
          paidAt: Date.now(),
          payments,
          paymentMethod: primary?.method,
          cashReceived: primary?.cashReceived,
          change: primary?.change,
          sessionId: s.activeSession.id,
          cashierName: s.cashierName || undefined,
        };
        if (order.clientId) {
          useAdmin.getState().recordClientVisit(order.clientId, order.total);
        }
        set({
          orders: [order, ...s.orders],
          ticketCounter: s.ticketCounter + 1,
          cart: [],
          currentTable: "",
          currentClient: "",
          currentClientId: undefined,
          currentDiscountType: "dh",
          currentDiscountValue: 0,
          currentDiscountReason: "",
        });
        return order;
      },

      cancelOrder: (id, by) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status: "annulee", cancelledBy: by || s.cashierName || undefined } : o,
          ),
        })),

      refundOrder: (id, by) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status: "remboursee", refundedBy: by || s.cashierName || undefined } : o,
          ),
        })),

      setCashierName: (n) => set({ cashierName: n }),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setStock: (itemId, quantity) =>
        set((s) => ({
          stocks: { ...s.stocks, [itemId]: Math.max(0, quantity) },
        })),

      decrementStock: (itemId, quantity) => {
        const s = usePos.getState();
        const current = s.stocks[itemId] ?? Infinity;
        if (current === Infinity) return true;
        if (current >= quantity) {
          usePos.setState({
            stocks: { ...s.stocks, [itemId]: current - quantity },
          });
          return true;
        }
        return false;
      },
    }),
    {
      name: "gdc-pos-store-v2",
      version: 2,
      migrate: (state: any, version: number) => {
        if (version < 2) {
          return undefined;
        }
        return state;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("Erreur lors du chargement du store, réinitialisation...", error);
          localStorage.removeItem("gdc-pos-store-v2");
        }
      },
    },
  ),
);

export const fmt = (n: number) => `${n.toLocaleString("fr-FR")} DH`;

// Theme store
export type ThemeMode = "dark" | "light";

type ThemeState = {
  mode: ThemeMode;
  brightness: number; // 0.5 à 1.5
  setMode: (mode: ThemeMode) => void;
  setBrightness: (brightness: number) => void;
};

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "dark",
      brightness: 1,
      setMode: (mode) => {
        set({ mode });
        if (typeof document !== "undefined") {
          document.documentElement.classList.remove("dark", "light");
          document.documentElement.classList.add(mode);
        }
      },
      setBrightness: (brightness) => {
        set({ brightness });
        if (typeof document !== "undefined") {
          const root = document.documentElement;
          root.style.filter = brightness !== 1 ? `brightness(${brightness})` : "";
        }
      },
    }),
    {
      name: "gdc-theme-store",
    },
  ),
);
