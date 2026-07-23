import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Petite bulle d'aide cliquable (fonctionne au tactile, contrairement à un tooltip au survol).
 * À poser à côté d'un champ, d'un bouton ou d'un titre pour guider les utilisateurs novices.
 */
export function InfoTooltip({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-primary ${className}`}
          aria-label="Aide"
        >
          <HelpCircle className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-2.5 text-xs leading-relaxed"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {text}
      </PopoverContent>
    </Popover>
  );
}
