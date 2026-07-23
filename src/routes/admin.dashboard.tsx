import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { Download, FileText, TrendingUp, Receipt, ShoppingCart, XCircle } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Le Goût du Charbon" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#eab308", "#a855f7", "#ec4899"];

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n) + " MAD";
}

function DashboardPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchStats = useServerFn(getDashboardStats);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard", from, to],
    queryFn: () => fetchStats({ data: { from: `${from}T00:00:00.000Z`, to: `${to}T23:59:59.999Z` } }),
  });

  const kpi = data?.kpi;

  const exportCSV = () => {
    if (!data?.orders?.length) {
      toast.error("Aucune donnée");
      return;
    }
    const csv = Papa.unparse(
      data.orders.map((o) => ({
        ticket: o.ticket_no,
        date: o.created_at,
        statut: o.status,
        total: o.total,
      })),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commandes-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV téléchargé");
  };

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Rapport de Chiffre d'Affaires", 14, 20);
    doc.setFontSize(10);
    doc.text(`Le Goût du Charbon — Période : ${from} au ${to}`, 14, 27);

    doc.setFontSize(11);
    doc.text(`CA total : ${fmt(kpi?.total ?? 0)}`, 14, 40);
    doc.text(`Tickets : ${kpi?.tickets ?? 0}`, 14, 46);
    doc.text(`Panier moyen : ${fmt(kpi?.avgTicket ?? 0)}`, 14, 52);
    doc.text(`Annulations : ${kpi?.cancelled ?? 0}`, 14, 58);

    autoTable(doc, {
      startY: 65,
      head: [["Ticket", "Date", "Statut", "Total (MAD)"]],
      body: (data.orders ?? []).map((o) => [
        o.ticket_no ?? "—",
        new Date(o.created_at as string).toLocaleString("fr-FR"),
        o.status,
        Number(o.total ?? 0).toFixed(2),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] },
    });
    doc.save(`rapport-ca-${from}-${to}.pdf`);
    toast.success("PDF téléchargé");
  };

  const setPreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    setFrom(d.toISOString().slice(0, 10));
    setTo(new Date().toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Analyse du chiffre d'affaires et des commandes.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreset(0)}>Aujourd'hui</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset(7)}>7j</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset(30)}>30j</Button>
          <div className="space-y-1">
            <Label className="text-xs">Du</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Au</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <Button size="sm" onClick={() => refetch()}>Actualiser</Button>
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="mr-1.5 size-4" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={exportPDF}>
            <FileText className="mr-1.5 size-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={TrendingUp} label="CA total" value={fmt(kpi?.total ?? 0)} tone="primary" />
        <KpiCard icon={Receipt} label="Tickets" value={String(kpi?.tickets ?? 0)} />
        <KpiCard icon={ShoppingCart} label="Panier moyen" value={fmt(kpi?.avgTicket ?? 0)} />
        <KpiCard icon={XCircle} label="Annulations" value={`${kpi?.cancelled ?? 0} (${((kpi?.cancelRate ?? 0) * 100).toFixed(1)}%)`} tone="danger" />
      </div>

      {isLoading ? (
        <div className="grid place-items-center rounded-2xl border border-border p-12 text-muted-foreground">
          Chargement…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="CA par jour">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.byDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="CA par heure">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.byHour ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="hour" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Modes de paiement">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data?.byPayment ?? []}
                  dataKey="total"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(e) => `${e.method}`}
                >
                  {(data?.byPayment ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Top 10 produits (CA)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.topItems ?? []} layout="vertical" margin={{ left: 90 }}>
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="name" type="category" fontSize={11} width={90} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "primary" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon
          className={
            tone === "primary"
              ? "size-4 text-primary"
              : tone === "danger"
                ? "size-4 text-destructive"
                : "size-4"
          }
        />
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}
