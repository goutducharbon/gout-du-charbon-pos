import { CATEGORY_ICONS } from "@/data/menu";
import { useEffectiveMenu } from "@/store/admin-store";
import { cn } from "@/lib/utils";

/** Barre de catégories horizontale (desktop + mobile). Reflète les réglages admin. */
export function CategorySidebar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  const menu = useEffectiveMenu();
  return (
    <nav
      aria-label="Catégories"
      className="scrollbar-thin flex shrink-0 gap-1.5 overflow-x-auto border-b border-border bg-sidebar px-2 py-2 sm:gap-2 sm:px-3"
    >
      {menu.map((cat) => {
        const isActive = cat.id === active;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "group flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2 text-center transition-all min-w-[76px] sm:min-w-[92px]",
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
  );
}
