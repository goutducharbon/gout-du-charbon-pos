import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Pencil, Users } from "lucide-react";
import { useAdmin, type Client } from "@/store/admin-store";
import { fmt } from "@/store/pos-store";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const clients = useAdmin((s) => s.clients);
  const removeClient = useAdmin((s) => s.removeClient);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const list = q
    ? clients.filter((c) =>
        [c.name, c.phone, c.email, c.ice]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
    : clients;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Clients</h2>
          <p className="text-sm text-muted-foreground">
            Répertoire clients pour devis, factures et fidélité.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher…"
            className="h-9 w-56"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Nouveau client
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-panel">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Nom</th>
              <th className="p-2 text-left">Téléphone</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">ICE</th>
              <th className="p-2 text-right">
                <span className="inline-flex items-center gap-1">
                  Visites
                  <InfoTooltip text="Nombre de commandes encaissées liées à ce client depuis la caisse (sélecteur « Lier un client fidèle »). Se met à jour automatiquement, aucune saisie manuelle nécessaire." />
                </span>
              </th>
              <th className="p-2 text-right">Total dépensé</th>
              <th className="p-2 text-left">Dernière visite</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 size-8 opacity-40" />
                  Aucun client enregistré.
                </td>
              </tr>
            )}
            {list.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-2 font-medium">{c.name}</td>
                <td className="p-2">{c.phone ?? "—"}</td>
                <td className="p-2">{c.email ?? "—"}</td>
                <td className="p-2 font-mono text-xs">{c.ice ?? "—"}</td>
                <td className="p-2 text-right">{c.visits ?? 0}</td>
                <td className="p-2 text-right">{c.totalSpent ? fmt(c.totalSpent) : "—"}</td>
                <td className="p-2">
                  {c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td className="p-2 text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(c);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Supprimer ${c.name} ?`)) {
                          removeClient(c.id);
                          toast.success("Client supprimé");
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClientFormDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function ClientFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Client | null;
}) {
  const addClient = useAdmin((s) => s.addClient);
  const updateClient = useAdmin((s) => s.updateClient);

  const [name, setName] = useState(editing?.name ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [address, setAddress] = useState(editing?.address ?? "");
  const [ice, setIce] = useState(editing?.ice ?? "");
  const [note, setNote] = useState(editing?.note ?? "");

  const key = editing?.id ?? "new";
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setName(editing?.name ?? "");
    setPhone(editing?.phone ?? "");
    setEmail(editing?.email ?? "");
    setAddress(editing?.address ?? "");
    setIce(editing?.ice ?? "");
    setNote(editing?.note ?? "");
  }

  const submit = () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    const payload = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      ice: ice.trim() || undefined,
      note: note.trim() || undefined,
    };
    if (editing) {
      updateClient(editing.id, payload);
      toast.success("Client mis à jour");
    } else {
      addClient(payload);
      toast.success("Client ajouté");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Modifier le client" : "Nouveau client"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Nom / Raison sociale</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Téléphone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Adresse</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label>ICE</Label>
            <Input value={ice} onChange={(e) => setIce(e.target.value)} />
          </div>
          <div>
            <Label>Note</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
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
