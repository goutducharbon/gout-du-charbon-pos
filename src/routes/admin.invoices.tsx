import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Printer, Trash2, ArrowRightLeft, FileText, FilePlus2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAdmin, type Invoice, type InvoiceKind, type InvoiceLine } from "@/store/admin-store";
import { usePos, fmt } from "@/store/pos-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/invoices")({
  component: InvoicesPage,
});

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function computeTotals(inv: Pick<Invoice, "lines" | "discount" | "vatRate">) {
  const subtotal = inv.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const discount = Math.min(subtotal, Math.max(0, inv.discount));
  const totalTTC = subtotal - discount;
  const vat = inv.vatRate > 0 ? totalTTC - totalTTC / (1 + inv.vatRate / 100) : 0;
  const totalHT = totalTTC - vat;
  return { subtotal, discount, vat, totalHT, totalTTC };
}

function InvoicesPage() {
  const invoices = useAdmin((s) => s.invoices);
  const createInvoice = useAdmin((s) => s.createInvoice);
  const deleteInvoice = useAdmin((s) => s.deleteInvoice);
  const convertToFacture = useAdmin((s) => s.convertToFacture);
  const updateInvoice = useAdmin((s) => s.updateInvoice);
  const settings = usePos((s) => s.settings);
  const vatRate = usePos((s) => s.vatRate);
  const orders = usePos((s) => s.orders);

  const [openNew, setOpenNew] = useState(false);
  const [printing, setPrinting] = useState<Invoice | null>(null);
  const [q, setQ] = useState("");
  const [filterKind, setFilterKind] = useState<"all" | InvoiceKind>("all");

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      if (filterKind !== "all" && i.kind !== filterKind) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        i.number.toLowerCase().includes(s) ||
        i.client.name.toLowerCase().includes(s)
      );
    });
  }, [invoices, q, filterKind]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-2xl font-bold">
            Devis &amp; Factures
            <InfoTooltip text="Un devis est une proposition de prix non définitive, sans valeur comptable. Une facture est le document définitif. Vous pouvez convertir un devis en facture d'un clic une fois accepté." />
          </h2>
          <p className="text-sm text-muted-foreground">
            Créez, imprimez et convertissez vos devis en factures.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpenNew(true)}>
          <Plus className="size-4" /> Nouveau document
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="N° ou client…"
            className="h-9 w-64 pl-7"
          />
        </div>
        <Select value={filterKind} onValueChange={(v) => setFilterKind(v as typeof filterKind)}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="devis">Devis</SelectItem>
            <SelectItem value="facture">Factures</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-panel">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="p-2 text-left">N°</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Client</th>
              <th className="p-2 text-right">Total TTC</th>
              <th className="p-2 text-center">Statut</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Aucun document.
                </td>
              </tr>
            )}
            {filtered.map((inv) => {
              const totals = computeTotals(inv);
              return (
                <tr key={inv.id} className="border-t border-border">
                  <td className="p-2 font-mono text-xs">{inv.number}</td>
                  <td className="p-2">
                    <span
                      className={
                        "rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase " +
                        (inv.kind === "devis"
                          ? "bg-warning/20 text-warning"
                          : "bg-primary/20 text-primary")
                      }
                    >
                      {inv.kind}
                    </span>
                  </td>
                  <td className="p-2">
                    {format(inv.createdAt, "d MMM yyyy", { locale: fr })}
                  </td>
                  <td className="p-2">
                    <div className="font-semibold">{inv.client.name}</div>
                    {inv.client.ice && (
                      <div className="text-[11px] text-muted-foreground">
                        ICE {inv.client.ice}
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-right font-semibold">
                    {fmt(totals.totalTTC)}
                  </td>
                  <td className="p-2 text-center">
                    {inv.kind === "facture" ? (
                      <button
                        onClick={() =>
                          updateInvoice(inv.id, { paid: !inv.paid })
                        }
                        className={
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                          (inv.paid
                            ? "bg-success/20 text-success"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        {inv.paid ? "Payée" : "Impayée"}
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1"
                        onClick={() => setPrinting(inv)}
                      >
                        <Printer className="size-3.5" />
                      </Button>
                      {inv.kind === "devis" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1 text-primary"
                          title="Convertir en facture"
                          onClick={() => {
                            const f = convertToFacture(inv.id);
                            if (f) toast.success(`Facture ${f.number} créée`);
                          }}
                        >
                          <ArrowRightLeft className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-destructive"
                        onClick={() => {
                          if (confirm(`Supprimer ${inv.number} ?`)) {
                            deleteInvoice(inv.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NewInvoiceDialog
        open={openNew}
        onOpenChange={setOpenNew}
        vatRate={vatRate}
        onCreate={(data) => {
          const inv = createInvoice(data);
          toast.success(`${inv.number} créé`);
          setPrinting(inv);
        }}
        orders={orders}
      />

      {printing && (
        <PrintInvoiceDialog
          invoice={printing}
          settings={settings}
          onClose={() => setPrinting(null)}
        />
      )}
    </div>
  );
}

function NewInvoiceDialog({
  open,
  onOpenChange,
  vatRate,
  onCreate,
  orders,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vatRate: number;
  onCreate: (input: Parameters<ReturnType<typeof useAdmin.getState>["createInvoice"]>[0]) => void;
  orders: ReturnType<typeof usePos.getState>["orders"];
}) {
  const [kind, setKind] = useState<InvoiceKind>("devis");
  const [client, setClient] = useState({ name: "", address: "", phone: "", ice: "" });
  const [lines, setLines] = useState<InvoiceLine[]>([
    { id: uid(), name: "", quantity: 1, unitPrice: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(vatRate);
  const [notes, setNotes] = useState("");
  const [fromOrderId, setFromOrderId] = useState<string>("");

  const reset = () => {
    setKind("devis");
    setClient({ name: "", address: "", phone: "", ice: "" });
    setLines([{ id: uid(), name: "", quantity: 1, unitPrice: 0 }]);
    setDiscount(0);
    setVat(vatRate);
    setNotes("");
    setFromOrderId("");
  };

  const pickOrder = (id: string) => {
    setFromOrderId(id);
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setLines(
      o.lines.map((l) => ({
        id: uid(),
        name:
          l.name +
          (l.cuisson ? ` (${l.cuisson})` : "") +
          (l.extras.length ? ` +${l.extras.map((e) => e.name).join(", ")}` : ""),
        quantity: l.quantity,
        unitPrice: l.offered
          ? 0
          : l.basePrice + l.extras.reduce((s, e) => s + e.price, 0),
      })),
    );
    setDiscount(o.discount);
    if (o.clientName && !client.name) setClient((c) => ({ ...c, name: o.clientName ?? "" }));
  };

  const totals = computeTotals({ lines, discount, vatRate: vat });

  const submit = () => {
    if (!client.name.trim() || lines.length === 0) {
      toast.error("Nom du client et au moins une ligne requis");
      return;
    }
    onCreate({
      kind,
      client,
      lines: lines.filter((l) => l.name.trim()),
      discount,
      vatRate: vat,
      notes: notes.trim() || undefined,
      fromOrderId: fromOrderId || undefined,
    });
    reset();
    onOpenChange(false);
  };

  const paidOrders = orders.filter((o) => o.status === "encaissee").slice(0, 50);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus2 className="size-5" /> Nouveau document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as InvoiceKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="devis">Devis</SelectItem>
                  <SelectItem value="facture">Facture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Générer depuis un ticket (optionnel)</Label>
              <Select value={fromOrderId || "__none"} onValueChange={(v) => v !== "__none" && pickOrder(v)}>
                <SelectTrigger><SelectValue placeholder="Choisir un ticket…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Aucun —</SelectItem>
                  {paidOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      #{o.ticketNo} — {fmt(o.total)} —{" "}
                      {format(o.paidAt ?? o.createdAt, "d MMM HH:mm", { locale: fr })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <h4 className="mb-2 text-sm font-semibold">Client</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Nom / Raison sociale"
                value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
              />
              <Input
                placeholder="ICE"
                value={client.ice}
                onChange={(e) => setClient({ ...client, ice: e.target.value })}
              />
              <Input
                placeholder="Téléphone"
                value={client.phone}
                onChange={(e) => setClient({ ...client, phone: e.target.value })}
              />
              <Input
                placeholder="Adresse"
                value={client.address}
                onChange={(e) => setClient({ ...client, address: e.target.value })}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">Lignes</h4>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setLines([...lines, { id: uid(), name: "", quantity: 1, unitPrice: 0 }])
                }
              >
                <Plus className="size-4" /> Ligne
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div
                  key={l.id}
                  className="grid grid-cols-[1fr_70px_100px_auto] items-center gap-2"
                >
                  <Input
                    placeholder={`Désignation ${i + 1}`}
                    value={l.name}
                    onChange={(e) =>
                      setLines(lines.map((x) => (x.id === l.id ? { ...x, name: e.target.value } : x)))
                    }
                  />
                  <Input
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) =>
                      setLines(
                        lines.map((x) =>
                          x.id === l.id ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    value={l.unitPrice}
                    onChange={(e) =>
                      setLines(
                        lines.map((x) =>
                          x.id === l.id ? { ...x, unitPrice: Math.max(0, Number(e.target.value) || 0) } : x,
                        ),
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setLines(lines.filter((x) => x.id !== l.id))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Remise (DH)</Label>
              <Input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div>
              <Label>TVA (%)</Label>
              <Input
                type="number"
                min={0}
                value={vat}
                onChange={(e) => setVat(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="rounded-lg bg-muted/40 p-2 text-sm">
              <div className="flex justify-between"><span>HT</span><span>{fmt(totals.totalHT)}</span></div>
              <div className="flex justify-between"><span>TVA</span><span>{fmt(totals.vat)}</span></div>
              <div className="flex justify-between font-bold text-primary"><span>TTC</span><span>{fmt(totals.totalTTC)}</span></div>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrintInvoiceDialog({
  invoice,
  settings,
  onClose,
}: {
  invoice: Invoice;
  settings: ReturnType<typeof usePos.getState>["settings"];
  onClose: () => void;
}) {
  const totals = computeTotals(invoice);
  const title = invoice.kind === "devis" ? "DEVIS" : "FACTURE";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
        <div className="flex items-center justify-between border-b border-border p-3 print:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" /> {invoice.number}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Fermer</Button>
            <Button size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="size-4" /> Imprimer / PDF
            </Button>
          </div>
        </div>

        <article className="invoice-print bg-white p-8 text-neutral-900">
          <header className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{settings.name}</h1>
              {settings.address && <p className="text-sm">{settings.address}</p>}
              {settings.phone && <p className="text-sm">Tél. {settings.phone}</p>}
              {settings.ice && <p className="text-sm">ICE {settings.ice}</p>}
            </div>
            <div className="text-right">
              <div className="text-3xl font-black tracking-wide">{title}</div>
              <div className="mt-1 font-mono text-sm">{invoice.number}</div>
              <div className="text-sm">
                {format(invoice.createdAt, "d MMMM yyyy", { locale: fr })}
              </div>
            </div>
          </header>

          <section className="mb-6 rounded border border-neutral-300 p-3">
            <div className="mb-1 text-xs font-semibold uppercase text-neutral-500">Client</div>
            <div className="font-semibold">{invoice.client.name}</div>
            {invoice.client.address && <div className="text-sm">{invoice.client.address}</div>}
            {invoice.client.phone && <div className="text-sm">Tél. {invoice.client.phone}</div>}
            {invoice.client.ice && <div className="text-sm">ICE {invoice.client.ice}</div>}
          </section>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-800 text-left">
                <th className="py-2">Désignation</th>
                <th className="py-2 text-right">Qté</th>
                <th className="py-2 text-right">P.U.</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((l) => (
                <tr key={l.id} className="border-b border-neutral-200">
                  <td className="py-1.5">{l.name}</td>
                  <td className="py-1.5 text-right">{l.quantity}</td>
                  <td className="py-1.5 text-right">{fmt(l.unitPrice)}</td>
                  <td className="py-1.5 text-right">{fmt(l.quantity * l.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><span>Sous-total</span><span>{fmt(totals.subtotal)}</span></div>
            {totals.discount > 0 && (
              <div className="flex justify-between"><span>Remise</span><span>-{fmt(totals.discount)}</span></div>
            )}
            <div className="flex justify-between"><span>Total HT</span><span>{fmt(totals.totalHT)}</span></div>
            <div className="flex justify-between"><span>TVA ({invoice.vatRate}%)</span><span>{fmt(totals.vat)}</span></div>
            <div className="flex justify-between border-t-2 border-neutral-800 pt-1 text-lg font-bold">
              <span>Total TTC</span><span>{fmt(totals.totalTTC)}</span>
            </div>
          </div>

          {invoice.notes && (
            <section className="mt-6 border-t border-neutral-300 pt-3 text-sm">
              <div className="mb-1 text-xs font-semibold uppercase text-neutral-500">Notes</div>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </section>
          )}

          <footer className="mt-8 border-t border-neutral-300 pt-3 text-center text-xs text-neutral-500">
            {settings.footer}
          </footer>
        </article>

        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .invoice-print, .invoice-print * { visibility: visible !important; }
            .invoice-print { position: absolute; inset: 0; padding: 20mm; }
            @page { size: A4; margin: 0; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
