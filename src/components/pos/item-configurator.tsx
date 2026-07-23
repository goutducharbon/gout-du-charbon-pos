import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, AlertCircle } from "lucide-react";
import {
  CUISSON_OPTIONS,
  TOPPINGS,
  type MenuItem,
  type Cuisson,
} from "@/data/menu";
import { cn } from "@/lib/utils";
import { fmt } from "@/store/pos-store";

export function ItemConfigurator({
  item,
  open,
  onOpenChange,
  onConfirm,
}: {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (payload: {
    quantity: number;
    extras: { id: string; name: string; price: number }[];
    cuisson?: Cuisson;
    note?: string;
  }) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [extras, setExtras] = useState<Record<string, boolean>>({});
  const [cuisson, setCuisson] = useState<Cuisson | undefined>();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setExtras({});
      setCuisson(undefined);
      setNote("");
      setError(null);
    }
  }, [open, item?.id]);

  if (!item) return null;

  const chosen = TOPPINGS.filter((t) => extras[t.id]);
  const unit = item.price + chosen.reduce((s, e) => s + e.price, 0);
  const total = unit * quantity;

  const handleConfirm = () => {
    if (item.hasCuisson && !cuisson) {
      setError("Veuillez sélectionner une cuisson.");
      return;
    }
    onConfirm({
      quantity,
      extras: chosen,
      cuisson,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-panel">
        <DialogHeader>
          <DialogTitle className="text-lg">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {item.desc && <p className="text-xs text-muted-foreground">{item.desc}</p>}

          {item.hasCuisson && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Cuisson <span className="text-destructive">*</span>
                </Label>
                {error && !cuisson && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-destructive">
                    <AlertCircle className="size-3" /> Requis
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CUISSON_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCuisson(c);
                      setError(null);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      cuisson === c
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/50",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.hasExtras && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Suppléments
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {TOPPINGS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setExtras((s) => ({ ...s, [t.id]: !s[t.id] }))
                    }
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                      extras[t.id]
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/50",
                    )}
                  >
                    <span>{t.name}</span>
                    <span className="text-xs opacity-80">+{t.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Note cuisine
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex : sans oignon, bien cuit…"
              className="bg-card"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-8 text-center text-lg font-bold">{quantity}</span>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-muted-foreground">Total</div>
              <div className="text-xl font-bold text-primary">{fmt(total)}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>
            Ajouter — {fmt(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
