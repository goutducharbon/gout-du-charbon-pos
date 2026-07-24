import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  usePos,
  fmt,
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  type Order,
  type OrderStatus,
} from "@/store/pos-store";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, Receipt, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePinReverify } from "@/components/pin-reverify-dialog";

export function HistoryDialog({
  open,
  onOpenChange,
  onShowReceipt,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onShowReceipt?: (o: Order) => void;
}) {
  const orders = usePos((s) => s.orders);
  const sessions = usePos((s) => s.sessions);
  const refundOrder = usePos((s) => s.refundOrder);
  const currentCashierName = usePos((s) => s.cashierName);
  const [q, setQ] = useState("");
  const [refunding, setRefunding] = useState<Order | null>(null);
  const requirePin = usePinReverify();

  const paidToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return orders.filter(
      (o) => o.status === "encaissee" && (o.paidAt ?? 0) >= start.getTime(),
    );
  }, [orders]);

  const stats = useMemo(() => {
    const totalCA = paidToday.reduce((s, o) => s + o.total, 0);
    const byMethod: Record<string, number> = {};
    for (const o of paidToday) {
      if (o.payments && o.payments.length) {
        for (const p of o.payments) byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount;
      } else if (o.paymentMethod) {
        byMethod[o.paymentMethod] = (byMethod[o.paymentMethod] ?? 0) + o.total;
      }
    }
    const totalDiscount = paidToday.reduce((s, o) => s + (o.discount ?? 0), 0);
    const offered = paidToday.reduce(
      (s, o) => s + o.lines.filter((l) => l.offered).length,
      0,
    );
    return { totalCA, count: paidToday.length, byMethod, totalDiscount, offered };
  }, [paidToday]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter(
      (o) =>
        String(o.ticketNo).includes(s) ||
        (o.tableNo ?? "").toLowerCase().includes(s) ||
        (o.clientName ?? "").toLowerCase().includes(s),
    );
  }, [orders, q]);

  const exportCSV = () => {
    const header = [
      "ticket",
      "date",
      "mode",
      "table_client",
      "paiements",
      "statut",
      "sous_total",
      "remise",
      "total",
    ];
    const rows = orders.map((o) => [
      o.ticketNo,
      format(o.createdAt, "yyyy-MM-dd HH:mm"),
      ORDER_TYPE_LABELS[o.type],
      o.tableNo ? `Table ${o.tableNo}` : o.clientName ?? "",
      (o.payments && o.payments.length
        ? o.payments.map((p) => `${PAYMENT_LABELS[p.method]}:${p.amount}`).join(" + ")
        : o.paymentMethod
          ? PAYMENT_LABELS[o.paymentMethod]
          : ""),
      o.status,
      o.subtotal,
      o.discount,
      o.total,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historique-caisse-${format(Date.now(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-panel">
        <DialogHeader>
          <DialogTitle>Historique & rapports</DialogTitle>
          <DialogDescription>Ventes, tickets et sessions de caisse.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="today">
          <TabsList className="bg-card">
            <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Chiffre d'affaires" value={fmt(stats.totalCA)} accent />
              <StatCard label="Tickets encaissés" value={String(stats.count)} />
              <StatCard label="Remises accordées" value={fmt(stats.totalDiscount)} />
              <StatCard label="Articles offerts" value={String(stats.offered)} />
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ventes par mode de paiement
              </h4>
              <div className="space-y-1 text-sm">
                {Object.entries(stats.byMethod).length === 0 ? (
                  <p className="text-muted-foreground">Aucune vente aujourd'hui.</p>
                ) : (
                  Object.entries(stats.byMethod).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span>{PAYMENT_LABELS[k as keyof typeof PAYMENT_LABELS] ?? k}</span>
                      <span className="font-semibold">{fmt(v)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Rechercher (n° ticket, table, client)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1 bg-card"
              />
              <Button variant="secondary" size="sm" onClick={exportCSV} className="gap-1.5">
                <Download className="size-4" />
                Export CSV
              </Button>
            </div>
            <div className="scrollbar-thin max-h-[55vh] overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-card text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Mode</th>
                    <th className="p-2">Table/Client</th>
                    <th className="p-2">Paiement</th>
                    <th className="p-2">Statut</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted-foreground">
                        Aucun ticket.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => (
                      <tr key={o.id} className="border-t border-border">
                        <td className="p-2 font-semibold">{o.ticketNo}</td>
                        <td className="p-2 text-muted-foreground">
                          {format(o.createdAt, "d MMM HH:mm", { locale: fr })}
                        </td>
                        <td className="p-2">{ORDER_TYPE_LABELS[o.type]}</td>
                        <td className="p-2">
                          {o.tableNo ? `Table ${o.tableNo}` : o.clientName ?? "—"}
                        </td>
                        <td className="p-2 text-xs">
                          {o.payments && o.payments.length
                            ? o.payments
                                .map((p) => `${PAYMENT_LABELS[p.method]} ${fmt(p.amount)}`)
                                .join(" + ")
                            : o.paymentMethod
                              ? PAYMENT_LABELS[o.paymentMethod]
                              : "—"}
                        </td>
                        <td className="p-2">
                          <StatusBadge status={o.status} />
                          {o.status === "annulee" && o.cancelledBy && (
                            <div className="mt-0.5 text-[10px] text-muted-foreground">
                              par {o.cancelledBy}
                            </div>
                          )}
                          {o.status === "remboursee" && o.refundedBy && (
                            <div className="mt-0.5 text-[10px] text-muted-foreground">
                              par {o.refundedBy}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-right font-bold text-primary">
                          {fmt(o.total)}
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 px-2"
                              onClick={() => onShowReceipt?.(o)}
                              title="Voir le ticket"
                            >
                              <Receipt className="size-3.5" />
                            </Button>
                            {o.status === "encaissee" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 px-2 text-destructive hover:text-destructive"
                                onClick={() => setRefunding(o)}
                                title="Rembourser"
                              >
                                <RotateCcw className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-2">
            <div className="scrollbar-thin max-h-[55vh] overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-card text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2">Ouverte</th>
                    <th className="p-2">Fermée</th>
                    <th className="p-2">Caissier</th>
                    <th className="p-2 text-right">Fond</th>
                    <th className="p-2 text-right">Clôture</th>
                    <th className="p-2 text-right">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        Aucune session.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => {
                      const paidCash = orders
                        .filter(
                          (o) =>
                            o.sessionId === s.id &&
                            o.status === "encaissee",
                        )
                        .reduce((a, o) => {
                          if (o.payments && o.payments.length) {
                            return (
                              a +
                              o.payments
                                .filter((p) => p.method === "especes")
                                .reduce((x, p) => x + p.amount, 0)
                            );
                          }
                          return a + (o.paymentMethod === "especes" ? o.total : 0);
                        }, 0);
                      const expected = s.openingCash + paidCash;
                      const diff =
                        s.closingCash !== undefined ? s.closingCash - expected : null;
                      return (
                        <tr key={s.id} className="border-t border-border">
                          <td className="p-2">
                            {format(s.openedAt, "d MMM HH:mm", { locale: fr })}
                          </td>
                          <td className="p-2">
                            {s.closedAt
                              ? format(s.closedAt, "d MMM HH:mm", { locale: fr })
                              : "En cours"}
                          </td>
                          <td className="p-2">{s.cashierName ?? "—"}</td>
                          <td className="p-2 text-right">{fmt(s.openingCash)}</td>
                          <td className="p-2 text-right">
                            {s.closingCash !== undefined ? fmt(s.closingCash) : "—"}
                          </td>
                          <td
                            className={`p-2 text-right font-semibold ${
                              diff === null
                                ? ""
                                : diff === 0
                                  ? "text-success"
                                  : diff > 0
                                    ? "text-primary"
                                    : "text-destructive"
                            }`}
                          >
                            {diff === null ? "—" : `${diff > 0 ? "+" : ""}${fmt(diff)}`}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <AlertDialog open={!!refunding} onOpenChange={(v) => !v && setRefunding(null)}>
        <AlertDialogContent className="bg-panel">
          <AlertDialogHeader>
            <AlertDialogTitle>Rembourser le ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment rembourser le ticket #{refunding?.ticketNo} ({refunding && fmt(refunding.total)}) ?
              Cette action marquera la commande comme remboursée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (refunding) {
                  refundOrder(refunding.id, currentCashierName || undefined);
                  setRefunding(null);
                }
              }}
            >
              Confirmer le remboursement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-bold ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; cls: string }> = {
    "en-cuisine": { label: "En cuisine", cls: "border-warning/40 text-warning" },
    encaissee: { label: "Encaissée", cls: "border-success/40 text-success" },
    annulee: { label: "Annulée", cls: "border-destructive/40 text-destructive" },
    remboursee: { label: "Remboursée", cls: "border-destructive/40 text-destructive" },
  };
  const m = map[status];
  return (
    <Badge variant="outline" className={m.cls}>
      {m.label}
    </Badge>
  );
}
