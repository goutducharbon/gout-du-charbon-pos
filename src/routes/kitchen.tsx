import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChefHat, Volume2, VolumeX, Clock, CheckCircle2, ArrowLeft, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/kitchen")({
  head: () => ({
    meta: [
      { title: "Cuisine — Le Goût du Charbon" },
      { name: "description", content: "Écran cuisine temps réel : nouvelles commandes, préparation et service." },
      { property: "og:title", content: "Cuisine — Le Goût du Charbon" },
      { property: "og:description", content: "Écran cuisine temps réel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KitchenPage,
});

type Row = {
  id: string;
  ticket_number: number | null;
  status: string;
  items: unknown;
  created_at: string;
  table_number: string | null;
  order_type: string | null;
  notes: string | null;
};

function ageMinutes(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function KitchenPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [muted, setMuted] = useState(false);
  const [tick, setTick] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, ticket_number, status, items, created_at, table_number, order_type, notes")
      .in("status", ["en_attente", "en_preparation", "prete"])
      .order("created_at", { ascending: true });
    setRows((data as Row[]) ?? []);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("kitchen-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newRow = payload.new as Row;
          toast.info(`🔔 Nouvelle commande #${newRow.ticket_number ?? "?"}`);
          if (!muted && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        }
        load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [muted]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
  };

  const pending = rows.filter((r) => r.status !== "prete");
  void tick;

  return (
    <div className="min-h-[100dvh] bg-background p-4 text-foreground">
      <Toaster />
      {/* Notification tone: pre-generated short beep */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRhwCAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YfgBAACJi5CVmp+kqa2xtrq9wcTHycvNz9DR0dHR0M/OzMrHxMG9ubWwq6ahnJeSjYiEgHt3c290cHFyc3V3eXt+gIOFiIqNj5GTlZeYmpyeoKGjpKWmp6iop6enp6eno6WkoJ+dm5mXlZOQjoyKh4WCgH58e3l4dnV0c3JycXFxcXFxcXFyc3R0dXd4eXp7fH1+f4CAgYGCg4ODhIWFhYaGhoaHh4eHh4eHh4eHh4aGhoaFhYWEhIODg4KCgYGAgIB/f39+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+"
        preload="auto"
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <ChefHat className="size-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Cuisine</h1>
            <p className="text-xs text-muted-foreground">
              {pending.length} commande{pending.length > 1 ? "s" : ""} en cours
            </p>
          </div>
          {pending.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-bold text-destructive-foreground animate-pulse">
              <Bell className="size-3" /> {pending.length}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setMuted((m) => !m)}>
            {muted ? <VolumeX className="mr-1.5 size-4" /> : <Volume2 className="mr-1.5 size-4" />}
            {muted ? "Muet" : "Son actif"}
          </Button>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 size-4" /> Caisse
            </Button>
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border p-16 text-muted-foreground">
          Aucune commande en cours 🎉
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((r) => {
            const age = ageMinutes(r.created_at);
            const items = Array.isArray(r.items)
              ? (r.items as Array<{ name: string; quantity?: number; qty?: number; notes?: string }>)
              : [];
            return (
              <div
                key={r.id}
                className={cn(
                  "rounded-2xl border-2 bg-card p-3 shadow-sm transition-colors",
                  r.status === "prete"
                    ? "border-blue-500/50 bg-blue-500/5"
                    : age < 5
                      ? "border-emerald-500/60"
                      : age < 10
                        ? "border-amber-500/70 bg-amber-500/5"
                        : "border-red-500/70 bg-red-500/10 animate-pulse",
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-lg font-bold">
                    #{r.ticket_number ?? "—"}
                    {r.table_number && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
                        Table {r.table_number}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" /> {age}′
                  </div>
                </div>
                {r.order_type && (
                  <div className="mb-2 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                    {r.order_type}
                  </div>
                )}
                <ul className="mb-2 space-y-1 text-sm">
                  {items.map((it, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-bold">×{it.quantity ?? it.qty ?? 1}</span>
                      <span className="flex-1">{it.name}</span>
                    </li>
                  ))}
                </ul>
                {r.notes && (
                  <div className="mb-2 rounded bg-muted p-1.5 text-xs italic text-muted-foreground">
                    📝 {r.notes}
                  </div>
                )}
                <div className="mt-2 flex gap-1">
                  {r.status === "en_attente" && (
                    <Button size="sm" className="flex-1" onClick={() => setStatus(r.id, "en_preparation")}>
                      Prise en charge
                    </Button>
                  )}
                  {r.status === "en_preparation" && (
                    <Button size="sm" className="flex-1" onClick={() => setStatus(r.id, "prete")}>
                      <CheckCircle2 className="mr-1 size-4" /> Prête
                    </Button>
                  )}
                  {r.status === "prete" && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setStatus(r.id, "servie")}>
                      Servie
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
