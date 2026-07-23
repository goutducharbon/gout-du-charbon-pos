import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { bootstrapOwner, bootstrapStatus } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/bootstrap")({
  head: () => ({
    meta: [
      { title: "Initialisation — Le Goût du Charbon" },
      { name: "description", content: "Créer le compte propriétaire et initialiser le restaurant." },
      { property: "og:title", content: "Initialisation — Le Goût du Charbon" },
      { property: "og:description", content: "Premier lancement de la caisse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BootstrapPage,
});

function BootstrapPage() {
  const navigate = useNavigate();
  const status = useServerFn(bootstrapStatus);
  const bootstrap = useServerFn(bootstrapOwner);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    restaurantName: "Le Goût du Charbon",
    ice: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    status().then((s) => {
      if (!s.needsBootstrap) navigate({ to: "/auth", replace: true });
      else setChecking(false);
    });
  }, [navigate, status]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await bootstrap({ data: form });
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;
      toast.success("Restaurant initialisé — bienvenue !");
      navigate({ to: "/admin", replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg === "bootstrap_already_done" ? "Un propriétaire existe déjà" : msg);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="grid min-h-[100dvh] place-items-center text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-4">
      <Toaster />
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-panel p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <Flame className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary">Initialisation</h1>
            <p className="text-xs text-muted-foreground">Créer le compte propriétaire</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Restaurant</Label>
            <Input value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label>ICE</Label>
            <Input value={form.ice} onChange={(e) => setForm({ ...form, ice: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Téléphone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Adresse</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Votre nom</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Email propriétaire</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Mot de passe (min 8)</Label>
            <Input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Création…" : "Créer et se connecter"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/auth" className="hover:underline">Déjà un compte ? Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
