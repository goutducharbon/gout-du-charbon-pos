import { Link } from "@tanstack/react-router";
import { ClipboardList, ChefHat, Settings, BarChart3, Grid3x3, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePos } from "@/store/pos-store";
import { useAdmin } from "@/store/admin-store";

export function PosHeader({
  onOpenHistory,
  onOpenKitchen,
  onOpenSettings,
  onOpenReports,
  onOpenFloorPlan,
}: {
  onOpenHistory: () => void;
  onOpenKitchen: () => void;
  onOpenSettings: () => void;
  onOpenReports: () => void;
  onOpenFloorPlan: () => void;
}) {
  const activeCount = usePos((s) =>
    s.orders.filter((o) => o.status === "en-cuisine").length,
  );
  const settings = usePos((s) => s.settings);
  const authed = useAdmin((s) => s.authed);

  return (
    <header className="flex items-center justify-between gap-2 border-b border-border bg-panel px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/15 sm:size-11">
          <img
            src="/images/hero-grill.jpg"
            alt="Logo"
            className="size-full object-cover opacity-80"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-display truncate text-base font-bold uppercase tracking-wide text-primary sm:text-xl">
            {settings.name}
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Caisse enregistreuse
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Badge
          variant="outline"
          className="hidden rounded-full border-border bg-secondary px-3 py-1 text-xs font-semibold text-foreground sm:inline-flex"
        >
          Actives : <span className="ml-1 text-primary">{activeCount}</span>
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={onOpenReports}
          title="Rapports"
        >
          <BarChart3 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={onOpenFloorPlan}
          title="Plan de salle"
        >
          <Grid3x3 className="size-4" />
        </Button>
        <Button asChild variant="ghost" size="icon" className={authed ? "size-9 text-primary" : "size-9"} title="Administration">
          <Link to="/admin">
            <Shield className="size-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={onOpenSettings}
          title="Réglages"
        >
          <Settings className="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 bg-card hover:bg-muted"
          onClick={onOpenHistory}
        >
          <ClipboardList className="size-4" />
          <span className="hidden sm:inline">Historique</span>
        </Button>
        <Button size="sm" className="relative gap-2" onClick={onOpenKitchen}>
          <ChefHat className="size-4" />
          <span className="hidden sm:inline">Cuisine</span>
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
