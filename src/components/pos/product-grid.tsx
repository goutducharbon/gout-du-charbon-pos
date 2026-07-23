import { Search, X, AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { CATEGORY_ICONS, type MenuItem } from "@/data/menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fmt, usePos } from "@/store/pos-store";
import { useAdmin, useEffectiveMenu, isOutOfStock } from "@/store/admin-store";

export function ProductGrid({
  activeCat,
  query,
  onQuery,
  onPick,
}: {
  activeCat: string;
  query: string;
  onQuery: (q: string) => void;
  onPick: (item: MenuItem) => void;
}) {
  const stocks = usePos((s) => s.stocks);
  const overrides = useAdmin((s) => s.overrides);
  const menu = useEffectiveMenu();
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return menu.flatMap((c) =>
        c.items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.desc ?? "").toLowerCase().includes(q),
        ),
      );
    }
    const cat = menu.find((c) => c.id === activeCat) ?? menu[0];
    return cat?.items ?? [];
  }, [activeCat, query, menu]);

  const currentCat = menu.find((c) => c.id === activeCat);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit…"
          className="h-11 rounded-full border-border bg-card pl-10 pr-10 text-sm placeholder:text-muted-foreground"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => onQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {!query && currentCat && (
        <div className="flex items-center gap-2">
          <h2 className="text-display text-lg font-semibold uppercase tracking-wide text-foreground">
            {currentCat.label}
          </h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
            {currentCat.items.length}
          </span>
        </div>
      )}
      {!query && currentCat?.note && (
        <p className="-mt-2 text-xs text-muted-foreground">{currentCat.note}</p>
      )}

      <div className="scrollbar-thin grid flex-1 auto-rows-min grid-cols-2 gap-2.5 overflow-y-auto pb-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {items.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            Aucun produit trouvé.
          </p>
        )}
        {items.map((it) => {
          const foundCat = menu.find((c) => c.items.some((x) => x.id === it.id));
          const catIcon = foundCat?.icon ?? CATEGORY_ICONS[foundCat?.id ?? ""] ?? "🍽️";
          const stock = stocks[it.id];
          const outByAdmin = isOutOfStock(overrides, it.id);
          const isOut = outByAdmin || stock === 0;
          return (
            <button
              key={it.id}
              onClick={() => onPick(it)}
              disabled={isOut}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-background/60">
                {it.img ? (
                  <img
                    src={it.img}
                    alt={it.name}
                    loading="lazy"
                    decoding="async"
                    width={600}
                    height={450}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-4xl sm:text-5xl">
                    <span aria-hidden>{catIcon}</span>
                  </div>
                )}
                <div className="absolute right-1.5 top-1.5 rounded-full bg-background/90 px-2 py-0.5 text-xs font-bold text-primary shadow">
                  {fmt(it.price)}
                </div>
                {isOut && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <AlertCircle className="size-6 text-destructive" />
                      <span className="text-xs font-bold text-white">Rupture</span>
                    </div>
                  </div>
                )}
                {(it.hasExtras || it.hasCuisson) && (
                  <div className="absolute left-1.5 top-1.5 rounded-full bg-primary/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
                    Options
                  </div>
                )}
                {stock !== undefined && stock !== Infinity && !isOut && (
                  <div className="absolute bottom-1.5 left-1.5 rounded-full bg-success/90 px-2 py-0.5 text-[9px] font-bold text-success-foreground">
                    Stock: {stock}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-2">
                <div className="text-[13px] font-semibold leading-tight text-foreground">
                  {it.name}
                </div>
                {it.desc && (
                  <div className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-muted-foreground">
                    {it.desc}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
