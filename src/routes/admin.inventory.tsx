import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  Package,
  Plus,
  Minus,
  Download,
  History,
} from "lucide-react";
import { usePos } from "@/store/pos-store";
import { useAdmin, getEffectiveMenu } from "@/store/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export const Route = createFileRoute("/admin/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  const stocks = usePos((s) => s.stocks);
  const setStock = usePos((s) => s.setStock);
  const overrides = useAdmin((s) => s.overrides);
  const disabledCategories = useAdmin((s) => s.disabledCategories);
  const customItems = useAdmin((s) => s.customItems);
  const categoryOverrides = useAdmin((s) => s.categoryOverrides);
  const customCategories = useAdmin((s) => s.customCategories);
  const categoryOrder = useAdmin((s) => s.categoryOrder);
  const thresholds = useAdmin((s) => s.stockThresholds);
  const setThreshold = useAdmin((s) => s.setStockThreshold);
  const movements = useAdmin((s) => s.stockMovements);
  const addMovement = useAdmin((s) => s.addStockMovement);

  const [q, setQ] = useState("");
  const [adjust, setAdjust] = useState<{
    itemId: string;
    name: string;
    current: number;
  } | null>(null);

  const items = useMemo(() => {
    const menu = getEffectiveMenu(overrides, disabledCategories, customItems, categoryOverrides, {
      includeHidden: true,
      customCategories,
      categoryOrder,
    });
    return menu.flatMap((c) =>
      c.items.map((i) => ({
        id: i.id,
        name: i.name,
        category: c.label,
        stock: stocks[i.id],
        threshold: thresholds[i.id] ?? 0,
      })),
    );
  }, [overrides, disabledCategories, customItems, categoryOverrides, customCategories, categoryOrder, stocks, thresholds]);

  const filtered = q
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(q.toLowerCase()) ||
          i.category.toLowerCase().includes(q.toLowerCase()),
      )
    : items;

  const lowStock = items.filter(
    (i) => i.stock !== undefined && i.stock <= i.threshold,
  );

  const exportCSV = () => {
    const rows = [
      ["Produit", "Catégorie", "Stock", "Seuil alerte"],
      ...items.map((i) => [
        i.name,
        i.category,
        i.stock === undefined ? "Illimité" : String(i.stock),
        String(i.threshold),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventaire-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Inventaire</h2>
          <p className="text-sm text-muted-foreground">
            Quantités en stock, seuils d'alerte et mouvements manuels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-56"
          />
          <Button variant="secondary" className="gap-2" onClick={exportCSV}>
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="size-4 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">
              {lowStock.length} produit(s) sous le seuil d'alerte
            </p>
            <p className="text-xs text-muted-foreground">
              {lowStock
                .slice(0, 6)
                .map((i) => `${i.name} (${i.stock})`)
                .join(" · ")}
              {lowStock.length > 6 && ` +${lowStock.length - 6} autres`}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-panel">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Produit</th>
              <th className="p-2 text-left">Catégorie</th>
              <th className="p-2 text-right">
                <span className="inline-flex items-center gap-1">
                  Stock
                  <InfoTooltip text="∞ signifie qu'aucune quantité n'est suivie pour ce produit (stock illimité). Un nombre s'affiche seulement si vous avez fait un premier ajustement via « Ajuster »." />
                </span>
              </th>
              <th className="p-2 text-right">
                <span className="inline-flex items-center gap-1">
                  Seuil
                  <InfoTooltip text="En dessous de ce niveau de stock, le produit apparaît en rouge ici et dans le tableau de bord (alerte de rupture à venir)." />
                </span>
              </th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const alert = i.stock !== undefined && i.stock <= i.threshold;
              return (
                <tr key={i.id} className="border-t border-border">
                  <td className="p-2 font-medium">{i.name}</td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {i.category}
                  </td>
                  <td className="p-2 text-right">
                    {i.stock === undefined ? (
                      <span className="text-muted-foreground">∞</span>
                    ) : (
                      <span
                        className={
                          alert ? "font-semibold text-destructive" : ""
                        }
                      >
                        {i.stock}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    <Input
                      type="number"
                      className="ml-auto h-7 w-20 text-right text-xs"
                      value={i.threshold}
                      onChange={(e) =>
                        setThreshold(i.id, Number(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1"
                      onClick={() =>
                        setAdjust({
                          itemId: i.id,
                          name: i.name,
                          current: i.stock ?? 0,
                        })
                      }
                    >
                      <Package className="size-3.5" /> Ajuster
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-panel p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <History className="size-4" /> Historique des mouvements
        </h3>
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun mouvement enregistré.
          </p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {movements.slice(0, 30).map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{m.itemName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(m.at, "d MMM HH:mm", { locale: fr })} · {m.reason}
                  </p>
                </div>
                <span
                  className={`font-semibold ${
                    m.delta >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {m.delta > 0 ? "+" : ""}
                  {m.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {adjust && (
        <AdjustDialog
          open
          onClose={() => setAdjust(null)}
          onSubmit={(delta, reason) => {
            const next = Math.max(0, adjust.current + delta);
            setStock(adjust.itemId, next);
            addMovement({
              itemId: adjust.itemId,
              itemName: adjust.name,
              delta,
              reason,
            });
            toast.success("Stock ajusté");
            setAdjust(null);
          }}
          current={adjust.current}
          name={adjust.name}
        />
      )}
    </div>
  );
}

function AdjustDialog({
  open,
  onClose,
  onSubmit,
  current,
  name,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (delta: number, reason: string) => void;
  current: number;
  name: string;
}) {
  const [mode, setMode] = useState<"in" | "out" | "set">("in");
  const [qty, setQty] = useState<number>(1);
  const [reason, setReason] = useState("Réception marchandise");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuster : {name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Stock actuel : {current}
            <InfoTooltip text="Entrée = vous ajoutez du stock (livraison, réassort). Sortie = vous en retirez (casse, péremption, prélèvement). Définir = vous fixez directement le nombre exact restant." />
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === "in" ? "default" : "secondary"}
              className="flex-1 gap-1"
              onClick={() => setMode("in")}
            >
              <Plus className="size-3.5" /> Entrée
            </Button>
            <Button
              size="sm"
              variant={mode === "out" ? "default" : "secondary"}
              className="flex-1 gap-1"
              onClick={() => setMode("out")}
            >
              <Minus className="size-3.5" /> Sortie
            </Button>
            <Button
              size="sm"
              variant={mode === "set" ? "default" : "secondary"}
              className="flex-1"
              onClick={() => setMode("set")}
            >
              Définir
            </Button>
          </div>
          <div>
            <Label>Quantité</Label>
            <Input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div>
            <Label className="flex items-center gap-1.5">
              Motif
              <InfoTooltip text="Obligatoire : gardez une trace de la raison (ex : « Livraison fournisseur », « Produit périmé », « Erreur de saisie »). Visible dans l'historique des mouvements." />
            </Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              const delta =
                mode === "in" ? qty : mode === "out" ? -qty : qty - current;
              onSubmit(delta, reason.trim() || "Ajustement");
            }}
          >
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
