import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import { PosHeader } from "@/components/pos/pos-header";
import { CategorySidebar } from "@/components/pos/category-sidebar";
import { ProductGrid } from "@/components/pos/product-grid";
import { CartPanel, CartMobileBar } from "@/components/pos/cart-panel";
import { ItemConfigurator } from "@/components/pos/item-configurator";
import { PaymentDialog } from "@/components/pos/payment-dialog";
import { KitchenDialog } from "@/components/pos/kitchen-dialog";
import { HistoryDialog } from "@/components/pos/history-dialog";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import {
  OpenSessionDialog,
  CloseSessionDialog,
} from "@/components/pos/session-dialogs";
import { SettingsDialog } from "@/components/pos/settings-dialog";
import { ReportsDialog } from "@/components/pos/reports-dialog";
import { FloorPlanDialog } from "@/components/pos/floor-plan-dialog";

import { type MenuItem } from "@/data/menu";
import { useEffectiveMenu } from "@/store/admin-store";
import { usePos, fmt, useTheme, type Order } from "@/store/pos-store";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caisse — Le Goût du Charbon" },
      {
        name: "description",
        content:
          "Caisse enregistreuse tactile complète : commandes sur place, à emporter, livraison et Glovo, sessions, cuisine, encaissement et historique.",
      },
    ],
  }),
  component: PosPage,
});

function PosPage() {
  const [mounted, setMounted] = useState(false);
  const setMode = useTheme((s) => s.setMode);
  const setBrightness = useTheme((s) => s.setBrightness);
  const mode = useTheme((s) => s.mode);
  const brightness = useTheme((s) => s.brightness);

  useEffect(() => {
    setMounted(true);
    // Initialiser le thème au démarrage
    setMode(mode);
    setBrightness(brightness);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground">
        Chargement de la caisse…
      </div>
    );
  }
  return <PosApp />;
}

function PosApp() {
  const menu = useEffectiveMenu();
  const [activeCat, setActiveCat] = useState(menu[0]?.id ?? "");
  useEffect(() => {
    if (menu.length && !menu.some((c) => c.id === activeCat)) {
      setActiveCat(menu[0].id);
    }
  }, [menu, activeCat]);
  const [query, setQuery] = useState("");
  const [configuring, setConfiguring] = useState<MenuItem | null>(null);
  const [openPayment, setOpenPayment] = useState(false);
  const [openKitchen, setOpenKitchen] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [openSessionOpen, setOpenSessionOpen] = useState(false);
  const [closeSessionOpen, setCloseSessionOpen] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openReports, setOpenReports] = useState(false);
  const [openFloorPlan, setOpenFloorPlan] = useState(false);
  const [receipt, setReceipt] = useState<Order | null>(null);

  const activeSession = usePos((s) => s.activeSession);
  const addLine = usePos((s) => s.addLine);
  const sendToKitchen = usePos((s) => s.sendToKitchen);

  const handlePick = (item: MenuItem) => {
    if (!activeSession) {
      toast.warning("Ouvrez d'abord une session de caisse.");
      setOpenSessionOpen(true);
      return;
    }
    if (item.hasExtras || item.hasCuisson) {
      setConfiguring(item);
    } else {
      addLine({
        itemId: item.id,
        name: item.name,
        basePrice: item.price,
        quantity: 1,
        extras: [],
      });
      toast.success(`${item.name} ajouté`, { description: fmt(item.price) });
    }
  };

  const handleSendKitchen = () => {
    const order = sendToKitchen();
    if (order) {
      toast.success(`Ticket #${order.ticketNo} envoyé en cuisine`, {
        description: `${order.lines.length} article(s) · ${fmt(order.total)}`,
        action: {
          label: "Ticket",
          onClick: () => setReceipt(order),
        },
      });
    }
  };

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-background text-foreground">
      <PosHeader
        onOpenHistory={() => setOpenHistory(true)}
        onOpenKitchen={() => setOpenKitchen(true)}
        onOpenSettings={() => setOpenSettings(true)}
        onOpenReports={() => setOpenReports(true)}
        onOpenFloorPlan={() => setOpenFloorPlan(true)}
      />

      <SessionBar
        onOpen={() => setOpenSessionOpen(true)}
        onClose={() => setCloseSessionOpen(true)}
      />

      <CategorySidebar active={activeCat} onSelect={setActiveCat} />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ProductGrid
          activeCat={activeCat}
          query={query}
          onQuery={setQuery}
          onPick={handlePick}
        />
        <CartPanel
          onOpenPayment={() => setOpenPayment(true)}
          onSendKitchen={handleSendKitchen}
        />
      </main>

      <CartMobileBar
        onOpenPayment={() => setOpenPayment(true)}
        onSendKitchen={handleSendKitchen}
      />

      <ItemConfigurator
        item={configuring}
        open={!!configuring}
        onOpenChange={(v) => !v && setConfiguring(null)}
        onConfirm={(cfg) => {
          if (!configuring) return;
          addLine({
            itemId: configuring.id,
            name: configuring.name,
            basePrice: configuring.price,
            quantity: cfg.quantity,
            extras: cfg.extras,
            cuisson: cfg.cuisson,
            note: cfg.note,
          });
          toast.success(`${configuring.name} ajouté`);
          setConfiguring(null);
        }}
      />

      <PaymentDialog
        open={openPayment}
        onOpenChange={setOpenPayment}
        onPaid={(o) => {
          toast.success(`Ticket #${o.ticketNo} encaissé`, {
            description: `${fmt(o.total)} · Merci !`,
          });
          setReceipt(o);
        }}
      />
      <KitchenDialog open={openKitchen} onOpenChange={setOpenKitchen} onShowReceipt={setReceipt} />
      <HistoryDialog open={openHistory} onOpenChange={setOpenHistory} onShowReceipt={setReceipt} />
      <OpenSessionDialog open={openSessionOpen} onOpenChange={setOpenSessionOpen} />
      <CloseSessionDialog open={closeSessionOpen} onOpenChange={setCloseSessionOpen} />
      <ReceiptDialog order={receipt} onOpenChange={(v) => !v && setReceipt(null)} />
      <SettingsDialog open={openSettings} onOpenChange={setOpenSettings} />
      <ReportsDialog open={openReports} onOpenChange={setOpenReports} />
      <FloorPlanDialog open={openFloorPlan} onOpenChange={setOpenFloorPlan} />

      <Toaster richColors position="top-center" />
    </div>
  );
}

function SessionBar({ onOpen, onClose }: { onOpen: () => void; onClose: () => void }) {
  const activeSession = usePos((s) => s.activeSession);

  if (!activeSession) {
    return (
      <div className="flex items-center justify-between gap-2 border-b border-border bg-warning/10 px-3 py-2 text-xs text-warning sm:px-4 sm:text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="truncate font-semibold">Aucune session de caisse ouverte.</span>
        </div>
        <Button size="sm" onClick={onOpen} className="shrink-0 gap-2">
          <Lock className="size-4" />
          <span className="hidden sm:inline">Ouvrir la caisse</span>
          <span className="sm:hidden">Ouvrir</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b border-border bg-success/10 px-3 py-2 text-[11px] text-success sm:px-4 sm:text-xs">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="font-semibold">
          Session ouverte —{" "}
          {format(activeSession.openedAt, "d MMM HH:mm", { locale: fr })}
        </span>
        <span className="text-muted-foreground">
          Fond : {fmt(activeSession.openingCash)}
        </span>
        {activeSession.cashierName && (
          <span className="hidden text-muted-foreground sm:inline">
            Caissier : {activeSession.cashierName}
          </span>
        )}
      </div>
      <Button size="sm" variant="secondary" onClick={onClose} className="shrink-0 gap-2">
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Clôturer</span>
      </Button>
    </div>
  );
}
