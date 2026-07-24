import { useEffect } from "react";
import { toast } from "sonner";

/** Déconnecte l'utilisateur après `ms` d'inactivité (aucun clic/touche/mouvement). */
export function useIdleLock(enabled: boolean, ms: number, onIdle: () => void) {
  useEffect(() => {
    if (!enabled) return;
    let t: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        toast.warning("Session admin verrouillée après inactivité");
        onIdle();
      }, ms);
    };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [enabled, ms, onIdle]);
}
