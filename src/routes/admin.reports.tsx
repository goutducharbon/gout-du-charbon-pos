import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, FileText } from "lucide-react";
import { usePos, fmt, PAYMENT_LABELS, ORDER_TYPE_LABELS } from "@/store/pos-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

type Preset = "today" | "yesterday" | "week" | "month" | "custom";

function ReportsPage() {
  const orders = usePos((s) => s.orders);
  const [preset, setPreset] = useState<Preset>("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cashier, setCashier] = useState<string>("__all");

  const cashiers = useMemo(
    () =>
      Array.from(
        new Set(orders.map((o) => o.cashierName).filter(Boolean) as string[]),
      ),
    [orders],
  );

  const range = useMemo(() => {
    const now = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (preset === "today") return { from: start.getTime(), to: Date.now() };
    if (preset === "yesterday") {
      const s = start.getTime() - 86400000;
      return { from: s, to: start.getTime() };
    }
    if (preset === "week") return { from: start.getTime() - 6 * 86400000, to: Date.now() };
    if (preset === "month") {
      const s = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return { from: s, to: Date.now() };
    }
    return {
      from: from ? new Date(from).getTime() : 0,
      to: to ? new Date(to).getTime() + 86399999 : Date.now(),
    };
  }, [preset, from, to]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const t = o.paidAt ?? o.createdAt;
      if (t < range.from || t > range.to) return false;
      if (cashier !== "__all" && o.cashierName !== cashier) return false;
      return true;
    });
  }, [orders, range, cashier]);

  const paid = filtered.filter((o) => o.status === "encaissee");
  const totalCA = paid.reduce((s, o) => s + o.total, 0);
  const totalDiscount = paid.reduce((s, o) => s + o.discount, 0);

  const payMix: Record<string, number> = {};
  for (const o of paid) {
    for (const p of o.payments) {
      payMix[p.method] = (payMix[p.method] ?? 0) + p.amount;
    }
  }

  const typeMix: Record<string, { count: number; total: number }> = {};
  for (const o of paid) {
    typeMix[o.type] ??= { count: 0, total: 0 };
    typeMix[o.type].count++;
    typeMix[o.type].total += o.total;
  }

  const itemsMix = new Map<string, { name: string; qty: number; total: number }>();
  for (const o of paid) {
    for (const l of o.lines) {
      const cur = itemsMix.get(l.itemId) ?? { name: l.name, qty: 0, total: 0 };
      cur.qty += l.quantity;
      cur.total += l.offered ? 0 : l.basePrice * l.quantity;
      itemsMix.set(l.itemId, cur);
    }
  }
  const topItems = Array.from(itemsMix.values()).sort((a, b) => b.qty - a.qty);

  const exportCSV = () => {
    const rows = [
      [
        "Ticket",
        "Date",
        "Type",
        "Table",
        "Client",
        "Caissier",
        "Sous-total",
        "Remise",
        "Total",
        "Statut",
        "Paiements",
      ],
      ...filtered.map((o) => [
        String(o.ticketNo),
        format(o.paidAt ?? o.createdAt, "dd/MM/yyyy HH:mm"),
        ORDER_TYPE_LABELS[o.type],
        o.tableNo ?? "",
        o.clientName ?? "",
        o.cashierName ?? "",
        String(o.subtotal),
        String(o.discount),
        String(o.total),
        o.status,
        o.payments
          .map((p) => `${PAYMENT_LABELS[p.method]}:${p.amount}`)
          .join(" | "),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-ventes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportItemsCSV = () => {
    const rows = [
      ["Produit", "Quantité vendue", "CA (DH)"],
      ...topItems.map((i) => [i.name, String(i.qty), String(i.total)]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventaire-ventes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Rapports</h2>
        <p className="text-sm text-muted-foreground">
          Journalier, mensuel, par caissier — export CSV et impression.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-panel p-4 md:grid-cols-5">
        <div>
          <Label>Période</Label>
          <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="yesterday">Hier</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">Mois en cours</SelectItem>
              <SelectItem value="custom">Personnalisée</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Du</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPreset("custom");
            }}
          />
        </div>
        <div>
          <Label>Au</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPreset("custom");
            }}
          />
        </div>
        <div>
          <Label>Caissier</Label>
          <Select value={cashier} onValueChange={setCashier}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Tous</SelectItem>
              {cashiers.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button className="gap-2" onClick={exportCSV}>
            <Download className="size-4" /> Ventes CSV
          </Button>
          <Button variant="secondary" className="gap-2" onClick={exportItemsCSV}>
            <Download className="size-4" /> Inventaire
          </Button>
          <Button variant="ghost" className="gap-2" onClick={printReport}>
            <FileText className="size-4" /> Imprimer / Enregistrer en PDF
          </Button>
          <InfoTooltip text="CSV = fichier tableur (Excel/Google Sheets) à ouvrir ou envoyer à un comptable. « Imprimer / Enregistrer en PDF » ouvre la boîte d'impression du navigateur : choisissez « Enregistrer en PDF » comme imprimante pour obtenir un fichier PDF." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Tickets" value={String(paid.length)} />
        <Kpi label="CA total" value={fmt(totalCA)} />
        <Kpi label="Remises" value={fmt(totalDiscount)} />
        <Kpi
          label="Ticket moyen"
          value={fmt(paid.length ? totalCA / paid.length : 0)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-panel p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Répartition paiements
          </h3>
          {Object.keys(payMix).length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun paiement.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {Object.entries(payMix).map(([m, v]) => (
                <li key={m} className="flex justify-between">
                  <span>{PAYMENT_LABELS[m as keyof typeof PAYMENT_LABELS] ?? m}</span>
                  <span className="font-semibold">{fmt(v)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border bg-panel p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Par type de commande
          </h3>
          <ul className="space-y-1 text-sm">
            {Object.entries(typeMix).map(([t, v]) => (
              <li key={t} className="flex justify-between">
                <span>
                  {ORDER_TYPE_LABELS[t as keyof typeof ORDER_TYPE_LABELS] ?? t}{" "}
                  <span className="text-xs text-muted-foreground">({v.count})</span>
                </span>
                <span className="font-semibold">{fmt(v.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-panel p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Détail des plats vendus
        </h3>
        {topItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune vente sur la période.</p>
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
              {topItems.map((t) => (
                <tr key={t.name} className="border-t border-border">
                  <td className="py-1.5">{t.name}</td>
                  <td className="py-1.5 text-right font-semibold">{t.qty}</td>
                  <td className="py-1.5 text-right">{fmt(t.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Période : {format(range.from, "d MMM yyyy HH:mm", { locale: fr })} →{" "}
        {format(range.to, "d MMM yyyy HH:mm", { locale: fr })} · {filtered.length}{" "}
        commandes
      </p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-primary">{value}</div>
    </div>
  );
}
