import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  usePos,
  fmt,
  cartSubtotal,
  computeDiscountAmount,
  PAYMENT_LABELS,
  type PaymentMethod,
  type Payment,
  type Order,
} from "@/store/pos-store";
import { Banknote, CreditCard, Send, Wallet, Plus, Trash2 } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const METHODS: { id: PaymentMethod; icon: React.ReactNode }[] = [
  { id: "especes", icon: <Banknote className="size-4" /> },
  { id: "carte", icon: <CreditCard className="size-4" /> },
  { id: "glovo", icon: <Send className="size-4" /> },
  { id: "virement", icon: <Wallet className="size-4" /> },
];

const QUICK = [50, 100, 200, 500];

type Draft = { method: PaymentMethod; amount: string; received: string };

export function PaymentDialog({
  open,
  onOpenChange,
  existingOrder,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingOrder?: Order | null;
  onPaid?: (order: Order) => void;
}) {
  const cart = usePos((s) => s.cart);
  const dType = usePos((s) => s.currentDiscountType);
  const dValue = usePos((s) => s.currentDiscountValue);
  const cashOut = usePos((s) => s.cashOut);

  const total = useMemo(() => {
    if (existingOrder) return existingOrder.total;
    const sub = cartSubtotal(cart);
    return Math.max(0, sub - computeDiscountAmount(sub, dType, dValue));
  }, [cart, dType, dValue, existingOrder]);

  const [drafts, setDrafts] = useState<Draft[]>([
    { method: "especes", amount: "", received: "" },
  ]);

  useEffect(() => {
    if (open) {
      setDrafts([{ method: "especes", amount: "", received: "" }]);
    }
  }, [open]);

  const paidSum = drafts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const remaining = Math.max(0, total - paidSum);
  const overpay = paidSum > total;

  const setDraft = (i: number, patch: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const removeDraft = (i: number) =>
    setDrafts((prev) => prev.filter((_, idx) => idx !== i));

  const isMulti = drafts.length > 1;

  const singleAmount = (d: Draft) => (isMulti ? Number(d.amount) || 0 : total);

  const canValidate = isMulti ? paidSum >= total && !overpay : true;

  // For single-mode espèces, ensure received >= total
  const singleEsp = !isMulti && drafts[0].method === "especes";
  const singleReceived = singleEsp ? Number(drafts[0].received) || 0 : 0;
  const singleInsufficient =
    singleEsp && drafts[0].received !== "" && singleReceived < total;
  const singleChange =
    singleEsp && singleReceived >= total ? singleReceived - total : 0;

  const submit = () => {
    const payments: Payment[] = drafts.map((d) => {
      const amount = singleAmount(d);
      if (d.method === "especes") {
        const received = Number(d.received) || amount;
        return {
          method: d.method,
          amount,
          cashReceived: received,
          change: Math.max(0, received - amount),
        };
      }
      return { method: d.method, amount };
    });
    const result = cashOut(payments, existingOrder?.id);
    if (result) onPaid?.(result);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-panel">
        <DialogHeader>
          <DialogTitle>
            Encaisser {existingOrder ? `— Ticket #${existingOrder.ticketNo}` : ""}
          </DialogTitle>
          <DialogDescription>
            Total à régler : <span className="font-bold text-primary">{fmt(total)}</span>
            {isMulti && (
              <>
                {" "}· Payé : <span className="font-bold">{fmt(paidSum)}</span> · Reste :{" "}
                <span className={cn("font-bold", remaining === 0 ? "text-success" : "text-warning")}>
                  {fmt(remaining)}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto scrollbar-thin pr-1">
          {drafts.map((d, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Paiement {i + 1}
                </span>
                {isMulti && (
                  <button
                    onClick={() => removeDraft(i)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Retirer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setDraft(i, { method: m.id })}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold",
                      d.method === m.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50",
                    )}
                  >
                    {m.icon}
                    {PAYMENT_LABELS[m.id]}
                  </button>
                ))}
              </div>

              {isMulti && (
                <div className="mt-3 space-y-1.5">
                  <Label className="text-xs">Montant (DH)</Label>
                  <div className="flex gap-1.5">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={d.amount}
                      onChange={(e) => setDraft(i, { amount: e.target.value })}
                      placeholder={String(remaining + (Number(d.amount) || 0))}
                      className="h-10 bg-background"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setDraft(i, {
                          amount: String(remaining + (Number(d.amount) || 0)),
                        })
                      }
                    >
                      Reste
                    </Button>
                  </div>
                </div>
              )}

              {d.method === "especes" && (
                <div className="mt-3 space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    Montant reçu (DH)
                    <InfoTooltip text="Saisissez le montant que le client vous a remis en espèces. La monnaie à rendre est calculée automatiquement en dessous." />
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={d.received}
                    onChange={(e) => setDraft(i, { received: e.target.value })}
                    placeholder={String(singleAmount(d))}
                    className="h-11 bg-background text-lg font-semibold"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDraft(i, { received: String(singleAmount(d)) })}
                    >
                      Compte juste
                    </Button>
                    {QUICK.map((q) => (
                      <Button
                        key={q}
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setDraft(i, {
                            received: String((Number(d.received) || 0) + q),
                          })
                        }
                      >
                        +{q}
                      </Button>
                    ))}
                  </div>
                  {!isMulti && (
                    <div className="flex items-center justify-between rounded-md border border-border bg-background p-2.5">
                      <span className="text-xs text-muted-foreground">Monnaie à rendre</span>
                      <span className="text-xl font-bold text-success">{fmt(singleChange)}</span>
                    </div>
                  )}
                  {singleInsufficient && (
                    <p className="text-xs text-destructive">Montant insuffisant.</p>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              className="w-full flex-1 gap-1.5"
              onClick={() =>
                setDrafts((prev) => [
                  ...prev,
                  { method: "carte", amount: String(remaining), received: "" },
                ])
              }
            >
              <Plus className="size-4" /> Ajouter un paiement (split)
            </Button>
            <InfoTooltip text="Permet de régler une seule commande avec plusieurs moyens de paiement (ex : une partie en espèces, une partie par carte). Utile si le client partage l'addition." />
          </div>

          {overpay && (
            <p className="text-center text-xs text-destructive">
              Le total encaissé dépasse le total ({fmt(paidSum - total)} en trop).
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button disabled={!canValidate || singleInsufficient} onClick={submit}>
            Valider — {fmt(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
