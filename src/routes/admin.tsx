import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { LayoutDashboard, ListOrdered, FileBarChart, Users, Lock, ArrowLeft, LogOut, ShoppingBag, FileText, Package, UserSquare2, ChefHat, BarChart3 } from "lucide-react";
import { useAdmin } from "@/store/admin-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePos } from "@/store/pos-store";
import { useIdleLock } from "@/hooks/use-idle-lock";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Le Goût du Charbon" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: ({ location }) => {
    // client-only auth; skip on SSR
    if (typeof window === "undefined") return;
    const { authed, role } = useAdmin.getState();
    if (!authed && location.pathname !== "/admin/login") {
      throw redirect({ to: "/admin/login" });
    }
    if (authed && location.pathname === "/admin/login") {
      throw redirect({ to: "/admin" });
    }
    // Un manager (PIN) n'a pas accès à la page Employés (rôles, PIN, gestion RH) ni aux comptes.
    if (
      authed &&
      role === "manager" &&
      location.pathname.startsWith("/admin/employees")
    ) {
      throw redirect({ to: "/admin" });
    }
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/dashboard", label: "Analytics CA", icon: BarChart3 },
  { to: "/kitchen", label: "Écran cuisine", icon: ChefHat },
  { to: "/admin/menu", label: "Menu & Catégories", icon: ShoppingBag },
  { to: "/admin/inventory", label: "Inventaire", icon: Package },
  { to: "/admin/invoices", label: "Devis & Factures", icon: FileText },
  { to: "/admin/sessions", label: "Sessions", icon: ListOrdered },
  { to: "/admin/reports", label: "Rapports", icon: FileBarChart },
  { to: "/admin/employees", label: "Employés", icon: Users, ownerOnly: true },
  { to: "/admin/clients", label: "Clients", icon: UserSquare2 },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const authed = useAdmin((s) => s.authed);
  const role = useAdmin((s) => s.role);
  const roleName = useAdmin((s) => s.roleName);
  const logout = useAdmin((s) => s.logout);
  const settings = usePos((s) => s.settings);

  // Auto-lock : déconnexion admin après 10 minutes d'inactivité.
  useIdleLock(authed, 10 * 60_000, logout);

  if (!authed) {
    return <Outlet />;
  }

  const nav = NAV.filter((n) => !(n.ownerOnly && role === "manager"));

  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground print:block print:min-h-0">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-panel md:flex print:hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Lock className="size-4 text-primary" />
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            Admin
          </span>
        </div>
        {role === "manager" && (
          <div className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            Connecté en manager{roleName ? ` — ${roleName}` : ""}. Accès Employés restreint.
          </div>
        )}
        <nav className="flex-1 space-y-1 p-2">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-border p-2">
          <Button asChild variant="secondary" size="sm" className="w-full justify-start gap-2">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Retour caisse
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-destructive"
            onClick={logout}
          >
            <LogOut className="size-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-border bg-panel px-4 py-3 print:hidden">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-primary">
              {settings.name} — Administration
            </h1>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Button asChild size="sm" variant="secondary" className="gap-1.5">
              <Link to="/"><ArrowLeft className="size-4" />Caisse</Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={logout} className="text-destructive">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-border bg-panel px-2 py-2 md:hidden print:hidden">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <n.icon className="size-3.5" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
