import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { usePos, fmt } from "@/store/pos-store";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const sessions = usePos((s) => s.sessions);
  const orders = usePos((s) => s.orders);
  const closeSession = usePos((s) => s.closeSession);
  const activeSession = usePos((s) => s.activeSession);
  const reopenSession = usePos((s) => s.reopenSession);

  const handleReopen = (sessionId: string) => {
    if (activeSession) {
      toast.error("Clôturez d'abord la session en cours avant d'en rouvrir une autre.");
      return;
    }
    if (!confirm("Rouvrir cette session clôturée ? Elle redeviendra la session active.")) return;
    if (reopenSession(sessionId)) {
      toast.success("Session rouverte.");
    } else {
      toast.error("Impossible de rouvrir cette session.");
    }
  };

  const forceClose = () => {
    if (!activeSession) return;
    if (!confirm("Forcer la clôture de la session en cours ?")) return;
    const cash = orders
      .filter((o) => o.sessionId === activeSession.id && o.status === "encaissee")
      .reduce(
        (sum, o) =>
          sum +
          o.payments
            .filter((p) => p.method === "especes")
            .reduce((x, p) => x + p.amount, 0),
        0,
      );
    closeSession(activeSession.openingCash + cash, "Clôture forcée depuis Admin");
    toast.success("Session clôturée");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Sessions de caisse</h2>
          <p className="text-sm text-muted-foreground">
            Historique des ouvertures / clôtures avec écart de caisse.
          </p>
        </div>
        {activeSession && (
          <Button variant="destructive" size="sm" onClick={forceClose}>
            Forcer la clôture (session en cours)
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-panel">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Ouverture</th>
              <th className="p-2 text-left">Clôture</th>
              <th className="p-2 text-left">Caissier</th>
              <th className="p-2 text-right">Fond</th>
              <th className="p-2 text-right">Espèces vendues</th>
              <th className="p-2 text-right">Théorique</th>
              <th className="p-2 text-right">Compté</th>
              <th className="p-2 text-right">Écart</th>
              <th className="p-2 text-right">CA session</th>
              <th className="p-2 text-right">
                <span className="inline-flex items-center gap-1">
                  Actions
                  <InfoTooltip text="« Réouvrir » remet cette session en tant que session active si elle a été clôturée par erreur. Uniquement possible si aucune session n'est actuellement ouverte." />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan={10} className="p-6 text-center text-muted-foreground">
                  Aucune session.
                </td>
              </tr>
            )}
            {sessions.map((s) => {
              const sOrders = orders.filter(
                (o) => o.sessionId === s.id && o.status === "encaissee",
              );
              const cash = sOrders.reduce(
                (sum, o) =>
                  sum +
                  o.payments
                    .filter((p) => p.method === "especes")
                    .reduce((x, p) => x + p.amount, 0),
                0,
              );
              const ca = sOrders.reduce((x, o) => x + o.total, 0);
              const theoretical = s.openingCash + cash;
              const diff =
                s.closingCash !== undefined ? s.closingCash - theoretical : null;
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-2">
                    {format(s.openedAt, "d MMM HH:mm", { locale: fr })}
                  </td>
                  <td className="p-2">
                    {s.closedAt
                      ? format(s.closedAt, "d MMM HH:mm", { locale: fr })
                      : <span className="text-success">En cours</span>}
                  </td>
                  <td className="p-2">{s.cashierName ?? "—"}</td>
                  <td className="p-2 text-right">{fmt(s.openingCash)}</td>
                  <td className="p-2 text-right">{fmt(cash)}</td>
                  <td className="p-2 text-right">{fmt(theoretical)}</td>
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
                    {diff === null ? "—" : fmt(diff)}
                  </td>
                  <td className="p-2 text-right">{fmt(ca)}</td>
                  <td className="p-2 text-right">
                    {s.closedAt && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        onClick={() => handleReopen(s.id)}
                      >
                        Réouvrir
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
