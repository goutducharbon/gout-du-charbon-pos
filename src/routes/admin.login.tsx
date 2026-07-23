import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdmin } from "@/store/admin-store";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Connexion Admin — Le Goût du Charbon" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const login = useAdmin((s) => s.login);
  const loginWithPin = useAdmin((s) => s.loginWithPin);
  const navigate = useNavigate();
  const [mode, setMode] = useState<"owner" | "manager">("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "owner") {
      if (login(email, password)) {
        toast.success("Bienvenue !");
        navigate({ to: "/admin" });
      } else {
        toast.error("Identifiants incorrects");
      }
    } else {
      if (loginWithPin(pin)) {
        toast.success("Bienvenue !");
        navigate({ to: "/admin" });
      } else {
        toast.error("Code PIN invalide (doit correspondre à un employé actif, rôle manager ou admin)");
      }
    }
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-panel p-6 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <Flame className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary">Administration</h1>
            <p className="text-xs text-muted-foreground">Le Goût du Charbon</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("owner")}
            className={`rounded-md py-1.5 font-medium transition-colors ${
              mode === "owner" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            Propriétaire
          </button>
          <button
            type="button"
            onClick={() => setMode("manager")}
            className={`rounded-md py-1.5 font-medium transition-colors ${
              mode === "manager" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            Manager (PIN)
          </button>
        </div>

        {mode === "owner" ? (
          <>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@..."
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mot de passe</Label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <Label>Code PIN (4 chiffres)</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              required
            />
            <p className="text-xs text-muted-foreground">
              Accès restreint : disponible pour les employés actifs de rôle « manager » ou « admin »
              (Admin → Employés). Les accès complets (Employés, comptes) restent réservés au
              propriétaire.
            </p>
          </div>
        )}

        <Button type="submit" className="w-full gap-2">
          <Lock className="size-4" />
          Se connecter
        </Button>
      </form>
      <Toaster richColors position="top-center" />
    </div>
  );
}
