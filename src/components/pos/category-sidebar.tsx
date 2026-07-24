import { useRef } from "react";
import { CATEGORY_ICONS } from "@/data/menu";
import { useEffectiveMenu } from "@/store/admin-store";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Barre de catégories horizontale (desktop + mobile). Reflète les réglages admin. */
export function CategorySidebar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  const menu = useEffectiveMenu();
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  };
  return (
    <div className="relative shrink-0 border-b border-border bg-sidebar">
      <button
        type="button"
        aria-label="Faire défiler à gauche"
        onClick={() => scrollBy(-1)}
        className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-panel/90 p-1 shadow ring-1 ring-border hover:bg-muted sm:block"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Faire défiler à droite"
        onClick={() => scrollBy(1)}
        className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-panel/90 p-1 shadow ring-1 ring-border hover:bg-muted sm:block"
      >
        <ChevronRight className="size-4" />
      </button>
      <nav
        ref={ref}
        aria-label="Catégories"
        className="scrollbar-thin flex snap-x snap-mandatory gap-1.5 overflow-x-auto scroll-smooth px-2 py-2 sm:gap-2 sm:px-8"
      >
        {menu.map((cat) => {
          const isActive = cat.id === active;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "group flex shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2 text-center transition-all min-w-[76px] sm:min-w-[92px]",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-sidebar-foreground hover:border-primary/50 hover:bg-muted",
              )}
            >
              <span className="text-xl leading-none sm:text-2xl" aria-hidden>
                {cat.icon ?? CATEGORY_ICONS[cat.id] ?? "🍽️"}
              </span>
              <span className="text-[10.5px] font-semibold leading-tight sm:text-[11.5px]">
                {cat.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
