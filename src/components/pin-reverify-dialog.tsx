import { useState } from "react";
import { create } from "zustand";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { verifyPin } from "@/lib/auth.functions";
import { toast } from "sonner";

type PinState = {
  open: boolean;
  action: string;
  message: string;
  validUntil: number;
  resolve: ((ok: boolean) => void) | null;
};

const usePinStore = create<PinState & {
  request: (action: string, message?: string) => Promise<boolean>;
  close: (ok: boolean) => void;
  setValid: (until: number) => void;
}>((set, get) => ({
  open: false,
  action: "",
  message: "",
  validUntil: 0,
  resolve: null,
  request: (action, message = "Cette action requiert une vérification manager.") => {
    // Fresh grant valid 5 min
    if (get().validUntil > Date.now()) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      set({ open: true, action, message, resolve });
    });
  },
  close: (ok) => {
    const r = get().resolve;
    set({ open: false, resolve: null });
    r?.(ok);
  },
  setValid: (until) => set({ validUntil: until }),
}));

export function usePinReverify() {
  return usePinStore((s) => s.request);
}

export function clearPinGrant() {
  usePinStore.setState({ validUntil: 0 });
}

export function PinReverifyDialog() {
  const open = usePinStore((s) => s.open);
  const action = usePinStore((s) => s.action);
  const message = usePinStore((s) => s.message);
  const close = usePinStore((s) => s.close);
  const setValid = usePinStore((s) => s.setValid);
  const verify = useServerFn(verifyPin);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await verify({ data: { pin, action } });
      setValid(r.validUntil);
      toast.success(`Autorisé — ${r.employee.name}`);
      setPin("");
      close(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur";
      if (msg.includes("locked")) setErr("Trop de tentatives. Réessayez dans 15 min.");
      else if (msg.includes("invalid")) setErr("PIN invalide ou rôle insuffisant.");
      else setErr(msg);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Vérification manager
          </DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input
            autoFocus
            type="password"
            inputMode="numeric"
            pattern="\d{4,8}"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="Code PIN 4-8 chiffres"
            className="text-center text-2xl tracking-widest"
          />
          {err && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Autorisation valide 5 minutes après validation. Seuls les rôles admin/manager sont acceptés.
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => close(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || pin.length < 4}>
              {loading ? "…" : "Valider"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
