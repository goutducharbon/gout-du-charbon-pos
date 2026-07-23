import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Flame, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Le Goût du Charbon" },
      { name: "description", content: "Connectez-vous à votre espace caisse Le Goût du Charbon." },
      { property: "og:title", content: "Connexion — Le Goût du Charbon" },
      { property: "og:description", content: "Espace propriétaire et manager." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connexion réussie");
        navigate({ to: "/admin", replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre email si demandé.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur d'authentification";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!result.redirected) {
        toast.success("Connecté avec Google");
        navigate({ to: "/admin", replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec Google";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-4">
      <Toaster />
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-panel p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <Flame className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary">Espace Propriétaire</h1>
            <p className="text-xs text-muted-foreground">Le Goût du Charbon</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-md py-1.5 font-medium transition-colors ${
              mode === "signin" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-md py-1.5 font-medium transition-colors ${
              mode === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            Inscription
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg className="mr-2 size-4" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.5 34.7 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41.4 36 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z"/>
          </svg>
          Continuer avec Google
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                placeholder="vous@exemple.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {mode === "signin" ? "Se connecter" : "Créer mon compte"}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Premier lancement ?{" "}
          <Link to="/bootstrap" className="text-primary underline">
            Initialiser le restaurant
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            ← Retour à la caisse
          </Link>
        </p>
      </div>
    </div>
  );
}
