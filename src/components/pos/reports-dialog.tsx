import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { usePos, fmt, PAYMENT_LABELS, type Order } from "@/store/pos-store";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Download } from "lucide-react";

type PeriodType = "today" | "week" | "month" | "custom";

export function ReportsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const orders = usePos((s) => s.orders);
  const [period, setPeriod] = useState<PeriodType>("today");
  const [customDays, setCustomDays] = useState(7);

  const getDateRange = (p: PeriodType): [number, number] => {
    const now = new Date();
    switch (p) {
      case "today": {
        const start = startOfDay(now);
        const end = endOfDay(now);
        return [start.getTime(), end.getTime()];
      }
      case "week": {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        return [start.getTime(), end.getTime()];
      }
      case "month": {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        return [start.getTime(), end.getTime()];
      }
      case "custom": {
        const start = subDays(now, customDays);
        const end = endOfDay(now);
        return [start.getTime(), end.getTime()];
      }
    }
  };

  const [startDate, endDate] = getDateRange(period);

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === "encaissee" && (o.paidAt ?? 0) >= startDate && (o.paidAt ?? 0) <= endDate,
    );
  }, [orders, startDate, endDate]);

  const stats = useMemo(() => {
    const totalCA = filteredOrders.reduce((s, o) => s + o.total, 0);
    const byMethod: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    for (const o of filteredOrders) {
      if (o.payments && o.payments.length) {
        for (const p of o.payments) byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount;
      } else if (o.paymentMethod) {
        byMethod[o.paymentMethod] = (byMethod[o.paymentMethod] ?? 0) + o.total;
      }

      const day = format(o.paidAt ?? 0, "yyyy-MM-dd");
      byDay[day] = (byDay[day] ?? 0) + o.total;
    }

    const totalDiscount = filteredOrders.reduce((s, o) => s + (o.discount ?? 0), 0);
    const offered = filteredOrders.reduce(
      (s, o) => s + o.lines.filter((l) => l.offered).length,
      0,
    );

    return {
      totalCA,
      count: filteredOrders.length,
      byMethod,
      byDay,
      totalDiscount,
      offered,
    };
  }, [filteredOrders]);

  const chartDataPayment = Object.entries(stats.byMethod).map(([method, amount]) => ({
    name: PAYMENT_LABELS[method as keyof typeof PAYMENT_LABELS] ?? method,
    value: amount,
  }));

  const chartDataDaily = Object.entries(stats.byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, amount]) => ({
      date: format(new Date(day), "d MMM", { locale: fr }),
      amount,
    }));

  const COLORS = ["#ff8c42", "#06d6a0", "#3a86ff", "#fb5607", "#ffbe0b"];

  const exportPDF = () => {
    const content = `
Rapport de Caisse — ${format(new Date(startDate), "d MMM yyyy", { locale: fr })} au ${format(new Date(endDate), "d MMM yyyy", { locale: fr })}

RÉSUMÉ
------
Chiffre d'affaires: ${fmt(stats.totalCA)}
Nombre de tickets: ${stats.count}
Remises accordées: ${fmt(stats.totalDiscount)}
Articles offerts: ${stats.offered}

VENTES PAR MODE DE PAIEMENT
---------------------------
${Object.entries(stats.byMethod)
  .map(([method, amount]) => `${PAYMENT_LABELS[method as keyof typeof PAYMENT_LABELS] ?? method}: ${fmt(amount)}`)
  .join("\n")}

VENTES PAR JOUR
---------------
${Object.entries(stats.byDay)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([day, amount]) => `${format(new Date(day), "d MMM yyyy", { locale: fr })}: ${fmt(amount)}`)
  .join("\n")}
    `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-caisse-${format(new Date(), "yyyyMMdd-HHmm")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-panel max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rapports & Statistiques</DialogTitle>
          <DialogDescription>Analyse des ventes par période.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Period selector */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-semibold">Période</label>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-panel">
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === "custom" && (
              <div className="flex-1">
                <label className="text-sm font-semibold">Derniers N jours</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm"
                />
              </div>
            )}
            <Button onClick={exportPDF} className="gap-2">
              <Download className="size-4" />
              Export
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Chiffre d'affaires" value={fmt(stats.totalCA)} accent />
            <StatCard label="Tickets" value={String(stats.count)} />
            <StatCard label="Remises" value={fmt(stats.totalDiscount)} />
            <StatCard label="Offerts" value={String(stats.offered)} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Daily sales chart */}
            {chartDataDaily.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-3">
                <h3 className="mb-2 text-sm font-semibold">Ventes par jour</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartDataDaily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => fmt(v as number)} />
                    <Bar dataKey="amount" fill="var(--color-primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Payment method pie chart */}
            {chartDataPayment.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-3">
                <h3 className="mb-2 text-sm font-semibold">Modes de paiement</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartDataPayment}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartDataPayment.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Payment methods detail */}
          {Object.entries(stats.byMethod).length > 0 && (
            <div className="rounded-lg border border-border bg-card p-3">
              <h3 className="mb-2 text-sm font-semibold">Détail des paiements</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(stats.byMethod).map(([method, amount]) => (
                  <div key={method} className="flex justify-between">
                    <span>{PAYMENT_LABELS[method as keyof typeof PAYMENT_LABELS] ?? method}</span>
                    <span className="font-semibold">{fmt(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-lg font-bold ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
