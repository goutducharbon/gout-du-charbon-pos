import { useState } from "react";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Percent,
  ChefHat,
  Banknote,
  ChevronDown,
  Gift,
  Pencil,
  X,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "@/store/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  usePos,
  fmt,
  cartSubtotal,
  computeDiscountAmount,
  lineUnitPrice,
  ORDER_TYPE_LABELS,
  type OrderType,
} from "@/store/pos-store";
import { NoteDialog } from "./note-dialog";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const ORDER_TYPES: OrderType[] = ["sur-place", "emporter", "livrer", "glovo"];

function CartPanelBody({
  onOpenPayment,
  onSendKitchen,
}: {
  onOpenPayment: () => void;
  onSendKitchen: () => void;
}) {
  const cart = usePos((s) => s.cart);
  const currentType = usePos((s) => s.currentType);
  const currentTable = usePos((s) => s.currentTable);
  const currentClient = usePos((s) => s.currentClient);
  const currentClientId = usePos((s) => s.currentClientId);
  const clients = useAdmin((s) => s.clients);
  const addAdminClient = useAdmin((s) => s.addClient);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const selectedClient = clients.find((c) => c.id === currentClientId);
  const filteredClients = clientQuery.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientQuery.toLowerCase()) ||
          (c.phone ?? "").includes(clientQuery),
      )
    : clients.slice(0, 8);
  const dType = usePos((s) => s.currentDiscountType);
  const dValue = usePos((s) => s.currentDiscountValue);
  const dReason = usePos((s) => s.currentDiscountReason);
  const activeSession = usePos((s) => s.activeSession);
  const setType = usePos((s) => s.setType);
  const setTable = usePos((s) => s.setTable);
  const setClient = usePos((s) => s.setClient);
  const setDiscount = usePos((s) => s.setDiscount);
  const updateLine = usePos((s) => s.updateLine);
  const removeLine = usePos((s) => s.removeLine);
  const toggleOffered = usePos((s) => s.toggleOffered);
  const clearCart = usePos((s) => s.clearCart);
  const [editingNote, setEditingNote] = useState<{ lineId: string; note: string } | null>(null);

  const subtotal = cartSubtotal(cart);
  const discountAmt = computeDiscountAmount(subtotal, dType, dValue);
  const total = Math.max(0, subtotal - discountAmt);
  const disabled = !activeSession || cart.length === 0;

  const validateAndExecute = (action: () => void) => {
    if (disabled) return;
    
    // Validation des infos obligatoires selon le type
    if (currentType === "sur-place" && !currentTable.trim()) {
      toast.error("Veuillez saisir le numéro de table.");
      return;
    }
    if ((currentType === "emporter" || currentType === "livrer" || currentType === "glovo") && !currentClient.trim()) {
      toast.error(currentType === "glovo" ? "Veuillez saisir la référence Glovo." : "Veuillez saisir le nom du client.");
      return;
    }
    
    action();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Order type tabs */}
      <div className="flex items-center gap-1 px-3 pt-2">
        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Type de commande</span>
        <InfoTooltip text="Choisissez comment la commande sera servie. « Sur place » demande un numéro de table. « Emporter », « Livrer » et « Glovo » demandent un nom de client ou une référence." />
      </div>
      <div className="grid grid-cols-4 gap-1 p-3 pt-1">
        {ORDER_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              "rounded-md px-2 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors",
              currentType === t
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-muted",
            )}
          >
            {t === "sur-place" ? "Sur place" : t === "emporter" ? "Emporter" : t === "livrer" ? "Livrer" : "Glovo"}
          </button>
        ))}
      </div>

      <div className="space-y-2 px-3 pb-2">
        {currentType === "sur-place" && (
          <Input
            placeholder="Table n°"
            value={currentTable}
            onChange={(e) => setTable(e.target.value)}
            className="h-10 bg-card"
          />
        )}
        {(currentType === "emporter" || currentType === "livrer") && (
          <Input
            placeholder={currentType === "livrer" ? "Client / adresse" : "Nom du client"}
            value={currentClient}
            onChange={(e) => setClient(e.target.value)}
            className="h-10 bg-card"
          />
        )}
        {currentType === "glovo" && (
          <Input
            placeholder="Réf. Glovo"
            value={currentClient}
            onChange={(e) => setClient(e.target.value)}
            className="h-10 bg-card"
          />
        )}

        <div className="flex items-center gap-1.5">
          <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full justify-start gap-1.5 text-xs"
            >
              <UserRound className="size-3.5" />
              {selectedClient ? (
                <span className="truncate">
                  {selectedClient.name}
                  {typeof selectedClient.visits === "number" && (
                    <span className="ml-1 text-muted-foreground">
                      ({selectedClient.visits} visite{selectedClient.visits > 1 ? "s" : ""})
                    </span>
                  )}
                </span>
              ) : (
                "Lier un client fidèle (optionnel)"
              )}
              {selectedClient && (
                <X
                  className="ml-auto size-3.5 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setClient(currentClient, undefined);
                  }}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <Input
              placeholder="Rechercher un client (nom, téléphone)…"
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
              className="mb-2 h-8 text-sm"
              autoFocus
            />
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {filteredClients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                  onClick={() => {
                    setClient(c.name, c.id);
                    setClientPickerOpen(false);
                    setClientQuery("");
                  }}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">
                    {c.phone || "sans téléphone"} · {c.visits ?? 0} visite(s)
                  </span>
                </button>
              ))}
              {filteredClients.length === 0 && clientQuery.trim() && (
                <button
                  type="button"
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-primary hover:bg-muted"
                  onClick={() => {
                    const created = addAdminClient({ name: clientQuery.trim() });
                    setClient(created.name, created.id);
                    setClientPickerOpen(false);
                    setClientQuery("");
                    toast.success("Client créé et lié à la commande");
                  }}
                >
                  + Créer le client « {clientQuery.trim()} »
                </button>
              )}
              {filteredClients.length === 0 && !clientQuery.trim() && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  Aucun client enregistré. Tapez un nom pour en créer un.
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
          <InfoTooltip text="Facultatif : liez la commande à un client existant (ou créez-le) pour suivre ses visites et son total dépensé. Sans lien, la commande reste anonyme." />
        </div>
      </div>

      <div className="scrollbar-thin min-h-[120px] flex-1 overflow-y-auto px-3">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center text-muted-foreground">
            <ShoppingCart className="size-12 opacity-40" />
            <p className="max-w-[220px] text-xs">Aucun article. Sélectionnez un produit.</p>
          </div>
        ) : (
          <ul className="space-y-2 pb-2">
            {cart.map((l) => {
              const unit = lineUnitPrice(l);
              const lineTotal = l.offered ? 0 : unit * l.quantity;
              return (
                <li
                  key={l.lineId}
                  className={cn(
                    "rounded-lg border p-2.5 transition-colors",
                    l.offered
                      ? "border-success/40 bg-success/5"
                      : "border-border bg-card",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{l.name}</span>
                        {l.offered && (
                          <span className="rounded-full bg-success/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-success">
                            Offert
                          </span>
                        )}
                      </div>
                      {l.cuisson && (
                        <div className="text-[10px] uppercase tracking-wide text-primary">
                          Cuisson : {l.cuisson}
                        </div>
                      )}
                      {l.extras.length > 0 && (
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          + {l.extras.map((e) => e.name).join(", ")}
                        </div>
                      )}
                      {l.note && (
                        <div className="mt-0.5 text-[11px] italic text-muted-foreground">
                          « {l.note} »
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingNote({ lineId: l.lineId, note: l.note ?? "" })}
                        className="text-muted-foreground hover:text-primary"
                        aria-label="Éditer la note"
                        title="Note cuisine"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => toggleOffered(l.lineId)}
                        className={cn(
                          "hover:text-success",
                          l.offered ? "text-success" : "text-muted-foreground",
                        )}
                        aria-label="Offrir"
                        title="Offrir cet article"
                      >
                        <Gift className="size-3.5" />
                      </button>
                      <button
                        onClick={() => removeLine(l.lineId)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          l.quantity <= 1
                            ? removeLine(l.lineId)
                            : updateLine(l.lineId, { quantity: l.quantity - 1 })
                        }
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold">{l.quantity}</span>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-7"
                        onClick={() => updateLine(l.lineId, { quantity: l.quantity + 1 })}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      {l.offered && (
                        <div className="text-[10px] text-muted-foreground line-through">
                          {fmt(unit * l.quantity)}
                        </div>
                      )}
                      <div
                        className={cn(
                          "text-sm font-bold",
                          l.offered ? "text-success" : "text-primary",
                        )}
                      >
                        {fmt(lineTotal)}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-border p-3">
        {cart.length > 0 && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" size="sm" className="flex-1 gap-1.5">
                  <Percent className="size-3.5" />
                  Remise
                  {discountAmt > 0 && (
                    <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      -{fmt(discountAmt)}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 bg-panel" align="end">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                    Remise
                    <InfoTooltip text="Réduction appliquée à toute la commande, en montant fixe (DH) ou en pourcentage. Indiquez un motif pour garder une trace (utile pour les rapports)." />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setDiscount("dh", dValue, dReason)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-bold",
                        dType === "dh"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-foreground",
                      )}
                    >
                      Montant (DH)
                    </button>
                    <button
                      onClick={() => setDiscount("percent", dValue, dReason)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-bold",
                        dType === "percent"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-foreground",
                      )}
                    >
                      Pourcentage (%)
                    </button>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={dValue || ""}
                    onChange={(e) =>
                      setDiscount(dType, Number(e.target.value) || 0, dReason)
                    }
                    placeholder={dType === "dh" ? "Ex : 20" : "Ex : 10"}
                    className="h-10 bg-card"
                  />
                  <div className="flex flex-wrap gap-1">
                    {(dType === "percent" ? [5, 10, 15, 20, 50] : [10, 20, 50, 100]).map((v) => (
                      <button
                        key={v}
                        onClick={() => setDiscount(dType, v, dReason)}
                        className="rounded-md bg-card px-2 py-1 text-xs hover:bg-muted"
                      >
                        {dType === "percent" ? `${v}%` : `${v} DH`}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={dReason}
                    onChange={(e) => setDiscount(dType, dValue, e.target.value)}
                    placeholder="Motif (fidélité, geste commercial…)"
                    className="h-9 bg-card text-xs"
                  />
                  {discountAmt > 0 && (
                    <button
                      onClick={() => setDiscount("dh", 0, "")}
                      className="flex w-full items-center justify-center gap-1 text-xs text-destructive hover:underline"
                    >
                      <X className="size-3" /> Retirer la remise
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="sm" onClick={clearCart}>
              Vider
            </Button>
          </div>
        )}

        <div className="space-y-1 text-sm">
          {(discountAmt > 0 || cart.some((l) => l.offered)) && (
            <div className="flex justify-between text-muted-foreground">
              <span>Sous-total</span>
              <span>{fmt(subtotal)}</span>
            </div>
          )}
          {discountAmt > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>
                Remise{dType === "percent" ? ` (${dValue}%)` : ""}
                {dReason ? ` — ${dReason}` : ""}
              </span>
              <span>-{fmt(discountAmt)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total
            </span>
            <span className="text-3xl font-bold text-primary">{fmt(total)}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Mode : {ORDER_TYPE_LABELS[currentType]}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Button
              variant="secondary"
              className="w-full gap-2"
              disabled={disabled}
              onClick={() => validateAndExecute(onSendKitchen)}
            >
              <ChefHat className="size-4" />
              Cuisine
            </Button>
            <InfoTooltip
              className="absolute -right-1 -top-1 rounded-full bg-card"
              text="Envoie la commande en préparation SANS l'encaisser. Elle apparaît dans l'écran Cuisine ; vous pourrez l'encaisser plus tard."
            />
          </div>
          <div className="relative">
            <Button className="w-full gap-2" disabled={disabled} onClick={() => validateAndExecute(onOpenPayment)}>
              <Banknote className="size-4" />
              Encaisser
            </Button>
            <InfoTooltip
              className="absolute -right-1 -top-1 rounded-full bg-card"
              text="Ouvre l'écran de paiement pour encaisser cette commande immédiatement (espèces, carte, ou plusieurs moyens combinés)."
            />
          </div>
        </div>
        <p className="text-center text-[10px] text-muted-foreground">
          « Cuisine » envoie sans encaisser (à régler plus tard).
        </p>
      </div>

      <NoteDialog
        open={!!editingNote}
        onOpenChange={(v) => !v && setEditingNote(null)}
        initialNote={editingNote?.note}
        onConfirm={(note) => {
          if (editingNote) {
            updateLine(editingNote.lineId, { note: note || undefined });
            setEditingNote(null);
          }
        }}
      />
    </div>
  );
}

/** Desktop cart panel (aside on the right) */
export function CartPanel(props: {
  onOpenPayment: () => void;
  onSendKitchen: () => void;
}) {
  return (
    <aside className="hidden h-full w-[340px] shrink-0 border-l border-border bg-panel lg:flex lg:flex-col xl:w-[380px]">
      <CartPanelBody {...props} />
    </aside>
  );
}

/** Mobile / tablet bottom bar + sheet cart */
export function CartMobileBar({
  onOpenPayment,
  onSendKitchen,
}: {
  onOpenPayment: () => void;
  onSendKitchen: () => void;
}) {
  const cart = usePos((s) => s.cart);
  const dType = usePos((s) => s.currentDiscountType);
  const dValue = usePos((s) => s.currentDiscountValue);
  const subtotal = cartSubtotal(cart);
  const total = Math.max(0, subtotal - computeDiscountAmount(subtotal, dType, dValue));
  const count = cart.reduce((s, l) => s + l.quantity, 0);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2 border-t border-border bg-panel px-3 py-2 lg:hidden">
          <SheetTrigger asChild>
            <button className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left">
              <div className="relative">
                <ShoppingCart className="size-5 text-primary" />
                {count > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {count}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase text-muted-foreground">Panier</div>
                <div className="truncate text-sm font-bold text-foreground">
                  {count} article{count > 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-muted-foreground">Total</div>
                <div className="text-base font-bold text-primary">{fmt(total)}</div>
              </div>
              <ChevronDown className="size-4 rotate-180 text-muted-foreground" />
            </button>
          </SheetTrigger>
          <Button
            size="sm"
            disabled={cart.length === 0}
            onClick={() => {
              setOpen(false);
              onOpenPayment();
            }}
          >
            <Banknote className="size-4" />
          </Button>
        </div>

        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-2xl border-border bg-panel p-0"
        >
          <CartPanelBody
            onOpenPayment={() => {
              setOpen(false);
              onOpenPayment();
            }}
            onSendKitchen={() => {
              setOpen(false);
              onSendKitchen();
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
