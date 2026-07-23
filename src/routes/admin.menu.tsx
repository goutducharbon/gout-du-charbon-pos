import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MENU, CATEGORY_ICONS } from "@/data/menu";
import { useAdmin, getEffectiveMenu } from "@/store/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fmt } from "@/store/pos-store";
import { Ban, Eye, EyeOff, RotateCcw, Plus, Trash2, ChevronUp, ChevronDown, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/menu")({
  component: MenuAdminPage,
});

function MenuAdminPage() {
  const overrides = useAdmin((s) => s.overrides);
  const disabledCategories = useAdmin((s) => s.disabledCategories);
  const customItems = useAdmin((s) => s.customItems);
  const categoryOverrides = useAdmin((s) => s.categoryOverrides);
  const customCategories = useAdmin((s) => s.customCategories);
  const categoryOrder = useAdmin((s) => s.categoryOrder);
  const categoryVatRates = useAdmin((s) => s.categoryVatRates);

  const setOverride = useAdmin((s) => s.setOverride);
  const clearOverride = useAdmin((s) => s.clearOverride);
  const toggleOutOfStock = useAdmin((s) => s.toggleOutOfStock);
  const toggleHidden = useAdmin((s) => s.toggleHidden);
  const toggleCategory = useAdmin((s) => s.toggleCategory);
  const setCategoryOverride = useAdmin((s) => s.setCategoryOverride);
  const addCategory = useAdmin((s) => s.addCategory);
  const removeCategory = useAdmin((s) => s.removeCategory);
  const moveCategory = useAdmin((s) => s.moveCategory);
  const setCategoryVatRate = useAdmin((s) => s.setCategoryVatRate);
  const addCustomItem = useAdmin((s) => s.addCustomItem);
  const removeCustomItem = useAdmin((s) => s.removeCustomItem);

  const [openAdd, setOpenAdd] = useState(false);
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [q, setQ] = useState("");

  const categories = useMemo(
    () =>
      getEffectiveMenu(overrides, disabledCategories, customItems, categoryOverrides, {
        includeHidden: true,
        customCategories,
        categoryOrder,
      }),
    [overrides, disabledCategories, customItems, categoryOverrides, customCategories, categoryOrder],
  );

  const orderedIds = categories.map((c) => c.id);
  const allCategoryOptions = useMemo(
    () => [
      ...MENU.map((c) => ({ id: c.id, label: c.label })),
      ...customCategories.map((c) => ({ id: c.id, label: c.label })),
    ],
    [customCategories],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Menu &amp; Stock</h2>
          <p className="text-sm text-muted-foreground">
            Modifiez prix &amp; noms, mettez en rupture, masquez, réorganisez ou ajoutez des plats et des
            catégories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-56"
          />
          <Button variant="secondary" className="gap-2" onClick={() => setOpenAddCategory(true)}>
            <FolderPlus className="size-4" /> Nouvelle catégorie
          </Button>
          <Button className="gap-2" onClick={() => setOpenAdd(true)}>
            <Plus className="size-4" /> Ajouter un plat
          </Button>
          <InfoTooltip text="« Nouvelle catégorie » crée un rayon dans la barre de la caisse (ex : Jus & Smoothies). « Ajouter un plat » l'insère dans une catégorie existante ou nouvelle." />
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((cat, idx) => {
          const disabled = disabledCategories.includes(cat.id);
          const isCustomCategory = customCategories.some((c) => c.id === cat.id);
          const items = q
            ? cat.items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()))
            : cat.items;
          if (q && items.length === 0) return null;
          const vatOverride = categoryVatRates[cat.id];
          return (
            <div
              key={cat.id}
              className="overflow-hidden rounded-xl border border-border bg-panel"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex flex-col">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 px-1"
                      disabled={idx === 0}
                      title="Monter"
                      onClick={() => moveCategory(cat.id, "up", orderedIds)}
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 px-1"
                      disabled={idx === categories.length - 1}
                      title="Descendre"
                      onClick={() => moveCategory(cat.id, "down", orderedIds)}
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </div>
                  <InfoTooltip text="Ces flèches changent l'ordre d'affichage des catégories dans la barre de la caisse (haut de liste = affiché en premier)." />
                  <Input
                    value={cat.icon ?? CATEGORY_ICONS[cat.id] ?? ""}
                    onChange={(e) => setCategoryOverride(cat.id, { icon: e.target.value })}
                    className="h-8 w-14 text-center text-sm"
                    placeholder="🍽️"
                    title="Icône (emoji)"
                  />
                  <Input
                    value={cat.label}
                    onChange={(e) => setCategoryOverride(cat.id, { label: e.target.value })}
                    className="h-8 max-w-xs text-sm font-semibold"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ({cat.items.length})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                      TVA %
                      <InfoTooltip text="Laissez vide pour utiliser le taux de TVA global (Caisse → Réglages). Renseignez une valeur ici uniquement si cette catégorie a un taux de TVA différent (ex : boissons alcoolisées, à emporter…)." />
                    </Label>
                    <Input
                      type="number"
                      value={vatOverride ?? ""}
                      placeholder="défaut"
                      className="h-8 w-20 text-sm"
                      onChange={(e) => {
                        const v = e.target.value;
                        setCategoryVatRate(cat.id, v === "" ? undefined : Number(v));
                      }}
                      title="Laisser vide pour utiliser le taux de TVA global (Réglages)"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Active
                    <InfoTooltip text="Désactivez pour masquer entièrement cette catégorie côté caisse (les plats restent enregistrés, rien n'est perdu)." />
                    <Switch
                      checked={!disabled}
                      onCheckedChange={() => toggleCategory(cat.id)}
                    />
                  </label>
                  {isCustomCategory && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive"
                      title="Supprimer la catégorie"
                      onClick={() => {
                        if (cat.items.length > 0) {
                          toast.error("Videz d'abord la catégorie (supprimez ses plats).");
                          return;
                        }
                        if (confirm(`Supprimer la catégorie « ${cat.label} » ?`)) {
                          removeCategory(cat.id);
                          toast.success("Catégorie supprimée");
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-border">
                {items.map((it) => {
                  const o = overrides[it.id] ?? {};
                  const price = o.price ?? it.price;
                  const isCustom = customItems.some((c) => c.id === it.id);
                  return (
                    <div
                      key={it.id}
                      className="grid grid-cols-[1fr_auto] gap-2 px-4 py-3 sm:grid-cols-[2fr_120px_auto]"
                    >
                      <div className="min-w-0">
                        <Input
                          value={o.name ?? it.name}
                          onChange={(e) =>
                            setOverride(it.id, { name: e.target.value })
                          }
                          className="h-8 text-sm"
                        />
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          id : {it.id}
                          {isCustom && (
                            <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-primary">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) =>
                            setOverride(it.id, {
                              price: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="h-8 w-20 text-sm"
                        />
                        <span className="text-xs text-muted-foreground">DH</span>
                      </div>
                      <div className="col-span-2 flex flex-wrap items-center justify-end gap-1.5 sm:col-span-1">
                        <Button
                          size="sm"
                          variant={o.outOfStock ? "destructive" : "secondary"}
                          className="h-8 gap-1"
                          onClick={() => toggleOutOfStock(it.id)}
                        >
                          <Ban className="size-3.5" />
                          {o.outOfStock ? "Rupture" : "En stock"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1"
                          onClick={() => toggleHidden(it.id)}
                          title={o.hidden ? "Afficher" : "Masquer"}
                        >
                          {o.hidden ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          title="Réinitialiser"
                          onClick={() => {
                            clearOverride(it.id);
                            toast.success("Réinitialisé");
                          }}
                        >
                          <RotateCcw className="size-3.5" />
                        </Button>
                        {isCustom && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-destructive"
                            onClick={() => removeCustomItem(it.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="col-span-2 -mt-1 grid gap-1.5 sm:grid-cols-2">
                        <Input
                          value={o.desc ?? it.desc ?? ""}
                          onChange={(e) =>
                            setOverride(it.id, { desc: e.target.value })
                          }
                          placeholder="Description (optionnelle)"
                          className="h-8 text-xs"
                        />
                        <Input
                          value={o.img ?? it.img ?? ""}
                          onChange={(e) =>
                            setOverride(it.id, { img: e.target.value })
                          }
                          placeholder="URL image (/images/…)"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <p className="px-4 py-3 text-xs text-muted-foreground">
                    Aucun plat dans cette catégorie pour l'instant.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddItemDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        categoryOptions={allCategoryOptions}
        onAdd={(item) => {
          addCustomItem(item);
          toast.success("Plat ajouté");
        }}
      />

      <AddCategoryDialog
        open={openAddCategory}
        onOpenChange={setOpenAddCategory}
        onAdd={(label, icon) => {
          addCategory(label, icon);
          toast.success("Catégorie ajoutée");
        }}
      />
    </div>
  );
}

function AddItemDialog({
  open,
  onOpenChange,
  onAdd,
  categoryOptions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categoryOptions: { id: string; label: string }[];
  onAdd: (item: {
    id: string;
    name: string;
    price: number;
    desc?: string;
    categoryId: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [desc, setDesc] = useState("");
  const [categoryId, setCategoryId] = useState(categoryOptions[0]?.id ?? MENU[0].id);

  const submit = () => {
    if (!name.trim() || price <= 0) return;
    const id = `custom-${Date.now()}`;
    onAdd({ id, name: name.trim(), price, desc: desc.trim() || undefined, categoryId });
    setName("");
    setPrice(0);
    setDesc("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un plat</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Catégorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Prix (DH)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">Aperçu : {fmt(price)}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!name.trim() || price <= 0}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddCategoryDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (label: string, icon?: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("");

  const submit = () => {
    if (!label.trim()) return;
    onAdd(label.trim(), icon.trim() || undefined);
    setLabel("");
    setIcon("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle catégorie</DialogTitle>
          <DialogDescription>
            Elle apparaîtra dans la barre de catégories de la caisse et pourra recevoir des plats.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nom de la catégorie</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Jus & Smoothies" />
          </div>
          <div>
            <Label>Icône (emoji, optionnel)</Label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🥤" className="w-20" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!label.trim()}>
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
