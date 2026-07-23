import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  TrendingUp,
  Receipt,
  Wallet,
  AlertTriangle,
  ChefHat,
  RotateCcw,
  XCircle,
  Package,
} from "lucide-react";
import { usePos, fmt } from "@/store/pos-store";
import { useAdmin, getEffectiveMenu, isOutOfStock } from "@/store/admin-store";
import { MENU } from "@/data/menu";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};
const startOfWeek = () => startOfDay() - 6 * 86400000;
const startOfMonth = () => {
  const x = new Date();
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

function DashboardPage() {
  const orders = usePos((s) => s.orders);
  const activeSession = usePos((s) => s.activeSession);
  const overrides = useAdmin((s) => s.overrides);
  const disabledCategories = useAdmin((s) => s.disabledCategories);
  const customItems = useAdmin((s) => s.customItems);
  const customCategories = useAdmin((s) => s.customCategories);
  const categoryOrder = useAdmin((s) => s.categoryOrder);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status === "encaissee");
    const today = paid.filter((o) => (o.paidAt ?? o.createdAt) >= startOfDay());
    const week = paid.filter((o) => (o.paidAt ?? o.createdAt) >= startOfWeek());
    const month = paid.filter((o) => (o.paidAt ?? o.createdAt) >= startOfMonth());
    const sum = (arr: typeof orders) => arr.reduce((s, o) => s + o.total, 0);

    const inKitchen = orders.filter((o) => o.status === "en-cuisine").length;
    const refunded = orders.filter(
      (o) => o.status === "remboursee" && (o.paidAt ?? o.createdAt) >= startOfDay(),
    ).length;
    const cancelled = orders.filter(
      (o) => o.status === "annulee" && o.createdAt >= startOfDay(),
    ).length;

    const counter: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of paid) {
      for (const l of o.lines) {
        counter[l.itemId] ??= { name: l.name, qty: 0, revenue: 0 };
        counter[l.itemId].qty += l.quantity;
        counter[l.itemId].revenue += l.offered ? 0 : l.basePrice * l.quantity;
      }
    }
    const top = Object.values(counter)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const payMix: Record<string, number> = {};
    for (const o of today) {
      for (const p of o.payments) {
        payMix[p.method] = (payMix[p.method] ?? 0) + p.amount;
      }
    }

    // 7-day series
    const days: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const from = d.getTime();
      const to = from + 86400000;
      const total = paid
        .filter((o) => {
          const t = o.paidAt ?? o.createdAt;
          return t >= from && t < to;
        })
        .reduce((s, o) => s + o.total, 0);
      days.push({
        label: d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" }),
        total,
      });
    }

    // Hourly today
    const hours: number[] = Array(24).fill(0);
    for (const o of today) {
      const h = new Date(o.paidAt ?? o.createdAt).getHours();
      hours[h] += o.total;
    }

    return {
      todayCA: sum(today),
      todayCount: today.length,
      avg: today.length ? sum(today) / today.length : 0,
      weekCA: sum(week),
      monthCA: sum(month),
      inKitchen,
      refunded,
      cancelled,
      top,
      payMix,
      days,
      hours,
    };
  }, [orders]);

  const effective = useMemo(
    () =>
      getEffectiveMenu(overrides, disabledCategories, customItems, {}, {
        includeHidden: true,
        customCategories,
        categoryOrder,
      }),
    [overrides, disabledCategories, customItems, customCategories, categoryOrder],
  );
  const ruptures = effective.flatMap((c) =>
    c.items.filter((i) => isOutOfStock(overrides, i.id)).map((i) => ({ ...i, cat: c.label })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tableau de bord</h2>
        <p className="text-sm text-muted-foreground">
          Vue temps réel sur l'activité et la caisse.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="CA aujourd'hui" value={fmt(stats.todayCA)} icon={TrendingUp} />
        <Kpi label="Tickets du jour" value={String(stats.todayCount)} icon={Receipt} />
        <Kpi label="Ticket moyen" value={fmt(stats.avg)} icon={Wallet} />
        <Kpi label="En cuisine" value={String(stats.inKitchen)} icon={ChefHat} />
        <Kpi label="CA 7 jours" value={fmt(stats.weekCA)} icon={TrendingUp} />
        <Kpi label="CA du mois" value={fmt(stats.monthCA)} icon={TrendingUp} />
        <Kpi label="Remboursements (j)" value={String(stats.refunded)} icon={RotateCcw} />
        <Kpi label="Annulations (j)" value={String(stats.cancelled)} icon={XCircle} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChartCard title="CA — 7 derniers jours" data={stats.days} />
        <BarChartCard
          title="CA par heure — aujourd'hui"
          data={stats.hours.map((v, h) => ({ label: `${h}h`, total: v }))}
          compact
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-panel p-4 lg:col-span-2">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Package className="size-4" /> Top 10 produits (tout historique)
          </h3>
          {stats.top.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune vente pour l'instant.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-1 text-left">Produit</th>
                  <th className="py-1 text-right">Qté</th>
                  <th className="py-1 text-right">CA</th>
                </tr>
              </thead>
              <tbody>
                {stats.top.map((t) => (
                  <tr key={t.name} className="border-t border-border">
                    <td className="py-1.5">{t.name}</td>
                    <td className="py-1.5 text-right font-semibold">{t.qty}</td>
                    <td className="py-1.5 text-right">{fmt(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-panel p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <AlertTriangle className="size-4" /> Ruptures ({ruptures.length})
            </h3>
            {ruptures.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun produit en rupture.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {ruptures.slice(0, 10).map((r) => (
                  <li key={r.id} className="flex justify-between">
                    <span>{r.name}</span>
                    <span className="text-xs text-muted-foreground">{r.cat}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-panel p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Session en cours
            </h3>
            {activeSession ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fond</span>
                  <span>{fmt(activeSession.openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Caissier</span>
                  <span>{activeSession.cashierName ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CA session</span>
                  <span className="font-semibold text-primary">
                    {fmt(
                      orders
                        .filter(
                          (o) =>
                            o.sessionId === activeSession.id && o.status === "encaissee",
                        )
                        .reduce((s, o) => s + o.total, 0),
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Aucune session ouverte.</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-panel p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Paiements du jour
            </h3>
            {Object.keys(stats.payMix).length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun encaissement.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {Object.entries(stats.payMix).map(([m, v]) => (
                  <li key={m} className="flex justify-between">
                    <span className="capitalize text-muted-foreground">{m}</span>
                    <span>{fmt(v)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Catégories disponibles : {effective.length - disabledCategories.length}/{effective.length}
      </p>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4" />
      </div>
      <div className="mt-1 text-xl font-bold text-primary">{value}</div>
    </div>
  );
}

function BarChartCard({
  title,
  data,
  compact,
}: {
  title: string;
  data: { label: string; total: number }[];
  compact?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {data.every((d) => d.total === 0) ? (
        <p className="text-sm text-muted-foreground">Aucune donnée.</p>
      ) : (
        <div className={`flex items-end gap-1 ${compact ? "h-24" : "h-36"}`}>
          {data.map((d, i) => {
            const h = Math.max(2, (d.total / max) * 100);
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                  style={{ height: `${h}%` }}
                  title={fmt(d.total)}
                />
                <span className="text-[9px] text-muted-foreground">{d.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
