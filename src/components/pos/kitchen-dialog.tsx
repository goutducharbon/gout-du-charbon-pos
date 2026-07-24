import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  usePos,
  fmt,
  ORDER_TYPE_LABELS,
  type Order,
} from "@/store/pos-store";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Ban, Banknote, ChefHat } from "lucide-react";
import { PaymentDialog } from "./payment-dialog";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { usePinReverify } from "@/components/pin-reverify-dialog";

export function KitchenDialog({
  open,
  onOpenChange,
  onShowReceipt,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onShowReceipt?: (o: Order) => void;
}) {
  const orders = usePos((s) => s.orders);
  const activeOrders = orders.filter((o) => o.status === "en-cuisine");
  const cancelOrder = usePos((s) => s.cancelOrder);
  const cashierName = usePos((s) => s.cashierName);
  const [paying, setPaying] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState<Order | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl bg-panel">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="size-5 text-primary" />
              Commandes en cuisine
              <InfoTooltip text="Ces commandes ont été envoyées en préparation mais pas encore encaissées. Encaissez-les ici une fois servies, ou annulez si la commande est abandonnée." />
            </DialogTitle>
            <DialogDescription>
              Tickets envoyés en préparation à régler.
            </DialogDescription>
          </DialogHeader>

          {activeOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune commande en cuisine.
            </p>
          ) : (
            <div className="scrollbar-thin grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2">
              {activeOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col rounded-lg border border-border bg-card p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Ticket #{o.ticketNo}
                      </div>
                      <div className="text-sm font-bold">
                        {ORDER_TYPE_LABELS[o.type]}
                        {o.tableNo ? ` · Table ${o.tableNo}` : ""}
                        {o.clientName ? ` · ${o.clientName}` : ""}
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      {format(o.createdAt, "HH:mm", { locale: fr })}
                    </Badge>
                  </div>
                  <ul className="mb-2 flex-1 space-y-0.5 text-xs text-foreground">
                    {o.lines.map((l) => (
                      <li key={l.lineId}>
                        <span className="font-semibold">{l.quantity}×</span> {l.name}
                        {l.cuisson ? ` — ${l.cuisson}` : ""}
                        {l.extras.length > 0 &&
                          ` (+ ${l.extras.map((e) => e.name).join(", ")})`}
                      </li>
                    ))}
                  </ul>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">{fmt(o.total)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => setCancelling(o)}
                    >
                      <Ban className="size-3.5" />
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => setPaying(o)}
                    >
                      <Banknote className="size-3.5" />
                      Encaisser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PaymentDialog
        open={!!paying}
        onOpenChange={(v) => !v && setPaying(null)}
        existingOrder={paying}
        onPaid={(o) => {
          setPaying(null);
          onShowReceipt?.(o);
        }}
      />

      <AlertDialog open={!!cancelling} onOpenChange={(v) => !v && setCancelling(null)}>
        <AlertDialogContent className="bg-panel">
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la commande</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment annuler le ticket #{cancelling?.ticketNo} ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (cancelling) {
                  cancelOrder(cancelling.id, cashierName || undefined);
                  setCancelling(null);
                }
              }}
            >
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
