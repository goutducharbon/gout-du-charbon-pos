import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePos, fmt } from "@/store/pos-store";
import { useAdmin } from "@/store/admin-store";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function OpenSessionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const openSession = usePos((s) => s.openSession);
  const cashierNameStored = usePos((s) => s.cashierName);
  const employees = useAdmin((s) => s.employees);
  const legacy = useAdmin((s) => s.caissiers);
  const caissiers = employees.filter((e) => e.active).map((e) => e.name);
  const list = caissiers.length > 0 ? caissiers : legacy;
  const [opening, setOpening] = useState("0");
  const [name, setName] = useState(cashierNameStored);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const selectedEmp = employees.find((e) => e.name === name && e.active);
  const requiresPin = !!selectedEmp?.pin;

  const submit = () => {
    setError(null);
    if (list.length > 0 && !name.trim()) {
      setError("Sélectionnez un caissier.");
      return;
    }
    if (requiresPin && pin !== selectedEmp?.pin) {
      setError("Code PIN incorrect.");
      return;
    }
    openSession(Math.max(0, Number(opening) || 0), name.trim() || undefined);
    setPin("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-panel">
        <DialogHeader>
          <DialogTitle>Ouvrir la caisse</DialogTitle>
          <DialogDescription>
            Comptez le fond de caisse avant d'ouvrir la session.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Caissier</Label>
            {list.length > 0 ? (
              <Select value={name} onValueChange={(v) => { setName(v); setPin(""); setError(null); }}>
                <SelectTrigger><SelectValue placeholder="Choisir un caissier" /></SelectTrigger>
                <SelectContent>
                  {list.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du caissier" />
            )}
            <p className="text-[11px] text-muted-foreground">
              Gérez la liste depuis Admin → Employés.
            </p>
          </div>
          {requiresPin && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                Code PIN (4 chiffres)
                <InfoTooltip text="Cet employé a un code PIN défini dans Admin → Employés. Il doit le saisir pour prendre son poste de caisse." />
              </Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                autoFocus
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              Fond de caisse (DH)
              <InfoTooltip text="Montant en espèces déjà présent dans le tiroir-caisse avant de commencer à vendre (ex : monnaie pour rendre aux premiers clients). Il servira de référence pour calculer l'écart à la clôture." />
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit}>Ouvrir la session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CloseSessionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const activeSession = usePos((s) => s.activeSession);
  const orders = usePos((s) => s.orders);
  const closeSession = usePos((s) => s.closeSession);
  const [closingCash, setClosingCash] = useState("");
  const [note, setNote] = useState("");

  if (!activeSession) return null;

  const sessionOrders = orders.filter(
    (o) => o.sessionId === activeSession.id && o.status === "encaissee",
  );
  const totalCash = sessionOrders
    .filter((o) => o.paymentMethod === "especes")
    .reduce((s, o) => s + o.total, 0);
  const totalCard = sessionOrders
    .filter((o) => o.paymentMethod === "carte")
    .reduce((s, o) => s + o.total, 0);
  const totalOther = sessionOrders
    .filter((o) => !["especes", "carte"].includes(o.paymentMethod ?? ""))
    .reduce((s, o) => s + o.total, 0);
  const expectedCash = activeSession.openingCash + totalCash;
  const actual = Number(closingCash) || 0;
  const diff = actual - expectedCash;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-panel">
        <DialogHeader>
          <DialogTitle>Clôturer la caisse</DialogTitle>
          <DialogDescription>
            Session ouverte le{" "}
            {format(activeSession.openedAt, "d MMM yyyy à HH:mm", { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border border-border bg-card p-3 text-sm">
          <Row label="Fond de caisse" value={fmt(activeSession.openingCash)} />
          <Row label="Ventes espèces" value={fmt(totalCash)} />
          <Row label="Ventes carte" value={fmt(totalCard)} />
          <Row label="Autres (Glovo, virement…)" value={fmt(totalOther)} />
          <div className="my-2 border-t border-border" />
          <Row label="Caisse théorique" value={fmt(expectedCash)} strong />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Espèces comptées (DH)
            <InfoTooltip text="Comptez physiquement tout l'argent liquide dans le tiroir et saisissez le total ici. L'écart affiché ci-dessous compare ce montant à la « caisse théorique » (fond de caisse + ventes espèces)." />
          </Label>
          <Input
            type="number"
            inputMode="decimal"
            value={closingCash}
            onChange={(e) => setClosingCash(e.target.value)}
          />
          {closingCash && (
            <p
              className={
                diff === 0
                  ? "text-xs text-success"
                  : diff > 0
                    ? "text-xs text-primary"
                    : "text-xs text-destructive"
              }
            >
              Écart : {diff > 0 ? "+" : ""}
              {fmt(diff)}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Note</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              closeSession(actual, note.trim() || undefined);
              onOpenChange(false);
            }}
          >
            Clôturer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "font-bold text-primary" : ""}>{value}</span>
    </div>
  );
}
