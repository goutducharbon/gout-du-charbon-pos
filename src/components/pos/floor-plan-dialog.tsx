import { useState, useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePos, fmt, type Order } from "@/store/pos-store";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Receipt } from "lucide-react";
import { PaymentDialog } from "./payment-dialog";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { toast } from "sonner";

export type Table = {
  id: string;
  number: number;
  seats: number;
  x: number;
  y: number;
};

const DEFAULT_TABLES: Table[] = [
  { id: "t1", number: 1, seats: 2, x: 50, y: 50 },
  { id: "t2", number: 2, seats: 4, x: 200, y: 50 },
  { id: "t3", number: 3, seats: 4, x: 350, y: 50 },
  { id: "t4", number: 4, seats: 2, x: 50, y: 200 },
  { id: "t5", number: 5, seats: 6, x: 200, y: 200 },
  { id: "t6", number: 6, seats: 4, x: 350, y: 200 },
];

type TablesState = {
  tables: Table[];
  setTables: (t: Table[]) => void;
};
const useTables = create<TablesState>()(
  persist(
    (set) => ({
      tables: DEFAULT_TABLES,
      setTables: (t) => set({ tables: t }),
    }),
    { name: "gdc-floor-plan-v1" },
  ),
);

export function FloorPlanDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const orders = usePos((s) => s.orders);
  const tables = useTables((s) => s.tables);
  const setTables = useTables((s) => s.setTables);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [newTableSeats, setNewTableSeats] = useState(2);
  const [paying, setPaying] = useState<Order | null>(null);

  const activeOrdersByTable = useMemo(() => {
    const map: Record<string, Order> = {};
    for (const o of orders) {
      if (o.status === "en-cuisine" && o.tableNo) {
        map[o.tableNo] = o;
      }
    }
    return map;
  }, [orders]);

  const addTable = () => {
    const newId = `t${Date.now()}`;
    const newNumber = Math.max(...tables.map((t) => t.number), 0) + 1;
    setTables([
      ...tables,
      {
        id: newId,
        number: newNumber,
        seats: newTableSeats,
        x: Math.random() * 300,
        y: Math.random() * 300,
      },
    ]);
  };

  const deleteTable = (id: string) => {
    setTables(tables.filter((t) => t.id !== id));
  };

  const updateTable = (id: string, patch: Partial<Table>) => {
    setTables(tables.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Plan de salle
            <InfoTooltip text="Une table colorée a une commande en cours : cliquez dessus pour l'encaisser directement. Cliquez sur le petit crayon (✎) pour modifier son numéro ou son nombre de places sans l'encaisser." />
          </DialogTitle>
          <DialogDescription>Gérez les tables et visualisez les commandes en cours.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Floor plan visualization */}
          <div className="lg:col-span-2">
            <div className="relative w-full bg-card border border-border rounded-lg p-4 aspect-video">
              <svg
                viewBox="0 0 500 350"
                className="w-full h-full"
              >
                {/* Grid background */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="500" height="350" fill="url(#grid)" />

                {/* Tables */}
                {tables.map((table) => {
                  const order = activeOrdersByTable[String(table.number)];
                  const isActive = !!order;
                  return (
                    <g key={table.id}>
                      <circle
                        cx={table.x}
                        cy={table.y}
                        r="30"
                        fill={isActive ? "var(--color-primary)" : "var(--color-card)"}
                        stroke={isActive ? "var(--color-primary)" : "var(--color-border)"}
                        strokeWidth="2"
                        style={{ cursor: "pointer" }}
                        onClick={() => (isActive ? setPaying(order) : setEditingTable(table))}
                      />
                      <text
                        x={table.x}
                        y={table.y}
                        textAnchor="middle"
                        dy="0.3em"
                        fontSize="16"
                        fontWeight="bold"
                        fill={isActive ? "var(--color-primary-foreground)" : "var(--color-foreground)"}
                        style={{ pointerEvents: "none" }}
                      >
                        {table.number}
                      </text>
                      {isActive && (
                        <text
                          x={table.x}
                          y={table.y + 18}
                          textAnchor="middle"
                          fontSize="10"
                          fill={isActive ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)"}
                          style={{ pointerEvents: "none" }}
                        >
                          {table.seats} places
                        </text>
                      )}
                      {/* Icône d'édition séparée : permet de modifier une table même occupée */}
                      <g
                        transform={`translate(${table.x + 20}, ${table.y - 20})`}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTable(table);
                        }}
                      >
                        <circle r="9" fill="var(--color-background)" stroke="var(--color-border)" strokeWidth="1" />
                        <text textAnchor="middle" dy="0.3em" fontSize="9" fill="var(--color-muted-foreground)">
                          ✎
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Cliquez sur une table pour la modifier. Les tables en orange ont des commandes en cours.
            </p>
          </div>

          {/* Table management */}
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <h3 className="mb-2 text-sm font-semibold">Ajouter une table</h3>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Nombre de places</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={newTableSeats}
                    onChange={(e) => setNewTableSeats(Number(e.target.value))}
                    className="h-8 bg-background text-sm"
                  />
                </div>
                <Button onClick={addTable} className="w-full gap-2 text-sm" size="sm">
                  <Plus className="size-3.5" />
                  Ajouter
                </Button>
              </div>
            </div>

            {/* Tables list */}
            <div className="rounded-lg border border-border bg-card p-3">
              <h3 className="mb-2 text-sm font-semibold">Tables ({tables.length})</h3>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {tables.map((table) => {
                  const order = activeOrdersByTable[String(table.number)];
                  return (
                    <div
                      key={table.id}
                      className="flex items-center justify-between rounded-md bg-background p-2 text-xs"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">
                          Table {table.number}
                          {order && <Badge className="ml-1 text-[9px]">En cours</Badge>}
                        </div>
                        <div className="text-muted-foreground">{table.seats} places</div>
                      </div>
                      <button
                        onClick={() => deleteTable(table.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Edit table modal */}
        {editingTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-lg bg-panel border border-border p-4 w-full max-w-sm">
              <h3 className="mb-3 text-sm font-semibold">Modifier table {editingTable.number}</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Numéro</Label>
                  <Input
                    type="number"
                    value={editingTable.number}
                    onChange={(e) =>
                      setEditingTable({ ...editingTable, number: Number(e.target.value) })
                    }
                    className="h-8 bg-card text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nombre de places</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={editingTable.seats}
                    onChange={(e) =>
                      setEditingTable({ ...editingTable, seats: Number(e.target.value) })
                    }
                    className="h-8 bg-card text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      updateTable(editingTable.id, editingTable);
                      setEditingTable(null);
                    }}
                    className="flex-1 text-sm"
                    size="sm"
                  >
                    Enregistrer
                  </Button>
                  <Button
                    onClick={() => setEditingTable(null)}
                    variant="ghost"
                    className="flex-1 text-sm"
                    size="sm"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
