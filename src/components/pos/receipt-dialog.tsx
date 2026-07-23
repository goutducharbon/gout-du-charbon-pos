import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Printer, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  fmt,
  usePos,
  lineUnitPrice,
  computeVatAmount,
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  type Order,
} from "@/store/pos-store";
import { useAdmin, getItemVatRate } from "@/store/admin-store";

export function ReceiptDialog({
  order,
  onOpenChange,
}: {
  order: Order | null;
  onOpenChange: (v: boolean) => void;
}) {
  const settings = usePos((s) => s.settings);
  const vatRate = usePos((s) => s.vatRate);
  const customItems = useAdmin((s) => s.customItems);
  const categoryVatRates = useAdmin((s) => s.categoryVatRates);
  const handlePrint = () => window.print();

  // TVA affichée : si des catégories ont un taux personnalisé (Admin → Menu),
  // on calcule un montant pondéré ligne par ligne plutôt qu'un taux unique global.
  const vatInfo = useMemo(() => {
    if (!order) return { amount: 0, mixed: false, singleRate: vatRate };
    const rates = new Set<number>();
    let amount = 0;
    for (const l of order.lines) {
      if (l.offered) continue;
      const rate = getItemVatRate(l.itemId, customItems, categoryVatRates, vatRate);
      rates.add(rate);
      const lineTotal = lineUnitPrice(l) * l.quantity;
      amount += computeVatAmount(lineTotal, rate);
    }
    return {
      amount,
      mixed: rates.size > 1,
      singleRate: rates.size === 1 ? [...rates][0] : vatRate,
    };
  }, [order, customItems, categoryVatRates, vatRate]);

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-panel p-0">
        <DialogHeader className="border-b border-border px-4 py-3 print:hidden">
          <DialogTitle>Ticket de caisse</DialogTitle>
        </DialogHeader>

        {order && (
          <div
            id="receipt-print"
            className="space-y-3 bg-white p-4 font-mono text-xs text-black print:m-0 print:p-2"
          >
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <img 
                  src="/images/hero-grill.jpg" 
                  alt="Logo" 
                  className="size-12 rounded-lg object-cover grayscale"
                />
              </div>
              <div className="text-display text-lg font-black uppercase">
                {settings.name}
              </div>
              <div className="mt-2 flex justify-center print:hidden">
                <div className="rounded-lg border border-black p-1 bg-white">
                  <QRCodeSVG 
                    value={`Ticket #${order.ticketNo}`}
                    size={60}
                    level="L"
                    includeMargin={false}
                  />
                </div>
              </div>
              {settings.address && <div className="text-[10px]">{settings.address}</div>}
              {settings.phone && <div className="text-[10px]">Tél : {settings.phone}</div>}
              {settings.ice && <div className="text-[10px]">ICE : {settings.ice}</div>}
            </div>
            <div className="border-y border-dashed border-black py-1 text-center">
              <div className="text-sm font-bold">TICKET #{order.ticketNo}</div>
              <div>{format(order.createdAt, "d MMM yyyy · HH:mm", { locale: fr })}</div>
              <div>{ORDER_TYPE_LABELS[order.type]}</div>
              {order.tableNo && <div>Table : {order.tableNo}</div>}
              {order.clientName && <div>Client : {order.clientName}</div>}
              {order.cashierName && <div>Caissier : {order.cashierName}</div>}
            </div>

            <table className="w-full">
              <tbody>
                {order.lines.map((l) => {
                  const unit = lineUnitPrice(l);
                  const lineTotal = l.offered ? 0 : unit * l.quantity;
                  return (
                    <tr key={l.lineId} className="align-top">
                      <td className="pr-1">{l.quantity}×</td>
                      <td className="pr-1">
                        <div>
                          {l.name}
                          {l.offered && " (OFFERT)"}
                        </div>
                        {l.cuisson && <div className="text-[10px]">— {l.cuisson}</div>}
                        {l.extras.map((e) => (
                          <div key={e.id} className="text-[10px]">
                            + {e.name}
                          </div>
                        ))}
                        {l.note && <div className="text-[10px] italic">« {l.note} »</div>}
                      </td>
                      <td className="text-right">{fmt(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="border-t border-dashed border-black pt-1">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{fmt(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span>
                    Remise
                    {order.discountType === "percent" ? ` (${order.discountValue}%)` : ""}
                    {order.discountReason ? ` — ${order.discountReason}` : ""}
                  </span>
                  <span>-{fmt(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold">
                <span>TOTAL</span>
                <span>{fmt(order.total)}</span>
              </div>
              {vatInfo.amount > 0 && (
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>Dont TVA{vatInfo.mixed ? " (taux multiples)" : ` (${vatInfo.singleRate}%)`}</span>
                  <span>{fmt(vatInfo.amount)}</span>
                </div>
              )}
              {order.payments && order.payments.length > 0 ? (
                order.payments.map((p, i) => (
                  <div key={i} className="mt-1 flex justify-between">
                    <span>{PAYMENT_LABELS[p.method]}</span>
                    <span>{fmt(p.amount)}</span>
                  </div>
                ))
              ) : order.paymentMethod ? (
                <div className="mt-1 flex justify-between">
                  <span>{PAYMENT_LABELS[order.paymentMethod]}</span>
                  <span>{fmt(order.total)}</span>
                </div>
              ) : null}
              {order.cashReceived !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span>Reçu</span>
                    <span>{fmt(order.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rendu</span>
                    <span>{fmt(order.change ?? 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center text-[10px]">{settings.footer}</div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border bg-panel p-3 print:hidden">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-1 size-4" />
            Fermer
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-1 size-4" />
            Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
