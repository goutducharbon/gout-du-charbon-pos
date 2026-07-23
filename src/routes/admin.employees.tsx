import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trash2, Plus, Pencil, User, Shield, ShieldCheck } from "lucide-react";
import { useAdmin, type Employee, type EmployeeRole } from "@/store/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import { fmt, usePos } from "@/store/pos-store";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export const Route = createFileRoute("/admin/employees")({
  component: EmployeesPage,
});

const ROLE_LABEL: Record<EmployeeRole, string> = {
  admin: "Administrateur",
  manager: "Manager",
  caissier: "Caissier",
};

const ROLE_ICON: Record<EmployeeRole, typeof User> = {
  admin: ShieldCheck,
  manager: Shield,
  caissier: User,
};

function EmployeesPage() {
  const employees = useAdmin((s) => s.employees);
  const removeEmployee = useAdmin((s) => s.removeEmployee);
  const updateEmployee = useAdmin((s) => s.updateEmployee);
  const sessions = usePos((s) => s.sessions);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  // Heures travaillées & paie estimée, calculées à partir des sessions de caisse
  // clôturées liées au nom du caissier, sur les 30 derniers jours.
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const workedHours = useMemo(() => {
    const since = Date.now() - THIRTY_DAYS;
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (!s.cashierName || !s.closedAt || s.openedAt < since) continue;
      const ms = Math.max(0, s.closedAt - s.openedAt);
      map.set(s.cashierName, (map.get(s.cashierName) ?? 0) + ms);
    }
    return map;
  }, [sessions]);

  const startNew = () => {
    setEditing(null);
    setOpenForm(true);
  };
  const startEdit = (e: Employee) => {
    setEditing(e);
    setOpenForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Employés</h2>
          <p className="text-sm text-muted-foreground">
            Gérez vos caissiers, managers et administrateurs (rôle, PIN, taux horaire).
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Les heures (30j) sont estimées à partir des sessions de caisse clôturées ouvertes/fermées
            sous le nom exact de l'employé.
          </p>
        </div>
        <Button className="gap-2" onClick={startNew}>
          <Plus className="size-4" /> Nouvel employé
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-panel">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Nom</th>
              <th className="p-2 text-left">Rôle</th>
              <th className="p-2 text-left">PIN</th>
              <th className="p-2 text-left">Téléphone</th>
              <th className="p-2 text-right">Taux/h</th>
              <th className="p-2 text-right">Heures (30j)</th>
              <th className="p-2 text-right">Paie est. (30j)</th>
              <th className="p-2 text-center">Actif</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-muted-foreground">
                  Aucun employé enregistré.
                </td>
              </tr>
            )}
            {employees.map((e) => {
              const Icon = ROLE_ICON[e.role];
              const ms = workedHours.get(e.name) ?? 0;
              const hours = ms / (1000 * 60 * 60);
              return (
                <tr key={e.id} className="border-t border-border">
                  <td className="p-2 font-medium">{e.name}</td>
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                      <Icon className="size-3" />
                      {ROLE_LABEL[e.role]}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-xs">
                    {e.pin ? "••••" : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-2">{e.phone ?? "—"}</td>
                  <td className="p-2 text-right">
                    {e.hourlyRate ? fmt(e.hourlyRate) : "—"}
                  </td>
                  <td className="p-2 text-right">
                    {hours > 0 ? `${hours.toFixed(1)} h` : "—"}
                  </td>
                  <td className="p-2 text-right">
                    {e.hourlyRate && hours > 0 ? fmt(hours * e.hourlyRate) : "—"}
                  </td>
                  <td className="p-2 text-center">
                    <Switch
                      checked={e.active}
                      onCheckedChange={(v) => updateEmployee(e.id, { active: v })}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(e)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm(`Supprimer ${e.name} ?`)) {
                            removeEmployee(e.id);
                            toast.success("Employé supprimé");
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

      <EmployeeFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        editing={editing}
      />
    </div>
  );
}

function EmployeeFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Employee | null;
}) {
  const addEmployee = useAdmin((s) => s.addEmployee);
  const updateEmployee = useAdmin((s) => s.updateEmployee);

  const [name, setName] = useState(editing?.name ?? "");
  const [role, setRole] = useState<EmployeeRole>(editing?.role ?? "caissier");
  const [pin, setPin] = useState(editing?.pin ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [hourlyRate, setHourlyRate] = useState<number>(editing?.hourlyRate ?? 0);
  const [active, setActive] = useState(editing?.active ?? true);

  // Reset form when editing changes
  const key = editing?.id ?? "new";
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setName(editing?.name ?? "");
    setRole(editing?.role ?? "caissier");
    setPin(editing?.pin ?? "");
    setPhone(editing?.phone ?? "");
    setHourlyRate(editing?.hourlyRate ?? 0);
    setActive(editing?.active ?? true);
  }

  const submit = () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (pin && !/^\d{4}$/.test(pin)) {
      toast.error("Le PIN doit contenir 4 chiffres");
      return;
    }
    const payload = {
      name: name.trim(),
      role,
      pin: pin || undefined,
      phone: phone.trim() || undefined,
      hourlyRate: hourlyRate > 0 ? hourlyRate : undefined,
      active,
    };
    if (editing) {
      updateEmployee(editing.id, payload);
      toast.success("Employé mis à jour");
    } else {
      addEmployee(payload);
      toast.success("Employé ajouté");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Modifier l'employé" : "Nouvel employé"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1.5">
                Rôle
                <InfoTooltip text="Caissier : utilise la caisse uniquement. Manager : peut aussi se connecter à l'Admin avec son PIN, mais sans accès à la page Employés. Administrateur : rôle informatif — l'accès complet reste protégé par le compte propriétaire (email/mot de passe)." />
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as EmployeeRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caissier">Caissier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                PIN (4 chiffres)
                <InfoTooltip text="Utilisé pour ouvrir une session de caisse à son nom, et — si le rôle est manager ou administrateur — pour se connecter à l'espace Admin depuis l'écran de connexion (onglet « Manager »)." />
              </Label>
              <Input
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Optionnel"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Téléphone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                Taux horaire (DH)
                <InfoTooltip text="Utilisé uniquement pour estimer une paie indicative (Taux × Heures travaillées calculées depuis les sessions de caisse). Ce n'est pas un bulletin de paie officiel." />
              </Label>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={active} onCheckedChange={setActive} />
            <span>Actif (visible dans l'ouverture de session)</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit}>{editing ? "Enregistrer" : "Ajouter"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
