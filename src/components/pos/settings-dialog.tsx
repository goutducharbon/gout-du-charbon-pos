import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePos, useTheme } from "@/store/pos-store";
import { useAdmin } from "@/store/admin-store";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Moon, Sun, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const settings = usePos((s) => s.settings);
  const updateSettings = usePos((s) => s.updateSettings);
  const cashierName = usePos((s) => s.cashierName);
  const setCashierName = usePos((s) => s.setCashierName);
  const vatRate = usePos((s) => s.vatRate);
  const setVatRate = (rate: number) => usePos.setState({ vatRate: rate });
  const mode = useTheme((s) => s.mode);
  const brightness = useTheme((s) => s.brightness);
  const setMode = useTheme((s) => s.setMode);
  const setBrightness = useTheme((s) => s.setBrightness);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-panel">
        <DialogHeader>
          <DialogTitle>Réglages du restaurant</DialogTitle>
          <DialogDescription>
            Ces informations apparaissent sur les tickets imprimés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label>Nom du restaurant</Label>
            <Input
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Input
              value={settings.address}
              onChange={(e) => updateSettings({ address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input
                value={settings.phone}
                onChange={(e) => updateSettings({ phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                ICE
                <InfoTooltip text="Identifiant Commun de l'Entreprise (Maroc) — obligatoire sur les tickets/factures pour les entreprises assujetties à la TVA." />
              </Label>
              <Input
                value={settings.ice}
                onChange={(e) => updateSettings({ ice: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              Message de pied de ticket
              <InfoTooltip text="Texte libre affiché en bas de chaque ticket imprimé (ex : 'Merci de votre visite !', réseaux sociaux, conditions de retour…)." />
            </Label>
            <Textarea
              rows={2}
              value={settings.footer}
              onChange={(e) => updateSettings({ footer: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                Caissier par défaut
                <InfoTooltip text="Nom pré-rempli à l'ouverture de session si vous n'utilisez pas la liste des employés. Pratique pour un poste tenu toujours par la même personne." />
              </Label>
              <Input
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="Nom du caissier"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                Taux TVA (%)
                <InfoTooltip text="Taux de TVA par défaut, affiché à titre indicatif sur les tickets. Vous pouvez définir un taux différent pour une catégorie précise dans Admin → Menu & Stock." />
              </Label>
              <Input
                type="number"
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <h3 className="mb-3 text-sm font-semibold">Affichage</h3>
            <div className="space-y-1.5">
              <Label>Thème</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("dark")}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    mode === "dark"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <Moon className="size-3.5" />
                  Sombre
                </button>
                <button
                  onClick={() => setMode("light")}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    mode === "light"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <Sun className="size-3.5" />
                  Clair
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Luminosité : {Math.round(brightness * 100)}%</Label>
              <input
                type="range"
                min="50"
                max="150"
                value={Math.round(brightness * 100)}
                onChange={(e) => setBrightness(Number(e.target.value) / 100)}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Sombre</span>
                <span>Normal</span>
                <span>Lumineux</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
