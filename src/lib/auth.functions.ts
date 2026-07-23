import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Bootstrap: creates first owner account + restaurant settings row.
// Refuses if any owner already exists (idempotent).
export const bootstrapOwner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        fullName: z.string().min(1).max(120),
        restaurantName: z.string().min(1).max(120),
        ice: z.string().max(30).optional().default(""),
        address: z.string().max(200).optional().default(""),
        phone: z.string().max(30).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing, error: exErr } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "owner")
      .limit(1);
    if (exErr) throw new Error(exErr.message);
    if (existing && existing.length > 0) {
      throw new Error("bootstrap_already_done");
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (createErr || !created?.user) throw new Error(createErr?.message ?? "create_user_failed");
    const userId = created.user.id;

    await supabaseAdmin.from("profiles").upsert({ id: userId, full_name: data.fullName });
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "owner" });
    if (roleErr) throw new Error(roleErr.message);

    await supabaseAdmin.from("restaurant_settings").upsert({
      id: 1,
      name: data.restaurantName,
      ice: data.ice,
      address: data.address,
      phone: data.phone,
    });

    return { ok: true, userId };
  });

export const bootstrapStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("id").eq("role", "owner").limit(1);
  return { needsBootstrap: !data || data.length === 0 };
});

// PIN re-verification for sensitive actions.
export const verifyPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        pin: z.string().regex(/^\d{4,8}$/),
        action: z.string().min(1).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const bcrypt = await import("bcryptjs");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Rate limit: 5 failed attempts / 15 min per user
    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const { data: attempts } = await supabaseAdmin
      .from("pin_attempts")
      .select("id, success")
      .eq("user_id", context.userId)
      .gte("created_at", since);
    const failed = (attempts ?? []).filter((a) => !a.success).length;
    if (failed >= 5) {
      throw new Error("locked_out");
    }

    const { data: employees } = await supabaseAdmin
      .from("employees")
      .select("id, name, role, pin_hash, active")
      .eq("active", true);

    let matched: { id: string; name: string; role: string } | null = null;
    for (const emp of employees ?? []) {
      if (!emp.pin_hash) continue;
      // Support both bcrypt and legacy plain (short) — recommended to hash.
      const ok = emp.pin_hash.startsWith("$2")
        ? await bcrypt.compare(data.pin, emp.pin_hash)
        : emp.pin_hash === data.pin;
      if (ok && (emp.role === "admin" || emp.role === "manager")) {
        matched = { id: emp.id, name: emp.name, role: emp.role };
        break;
      }
    }

    await supabaseAdmin.from("pin_attempts").insert({
      user_id: context.userId,
      success: !!matched,
      action: data.action,
    });

    if (!matched) throw new Error("invalid_pin");

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: `pin_verified:${data.action}`,
      target_type: "employee",
      target_id: matched.id,
      meta: { employee: matched.name, role: matched.role },
    });

    return { ok: true, employee: matched, validUntil: Date.now() + 5 * 60_000 };
  });

// Dashboard stats — pulls from orders.
export const getDashboardStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ from: z.string(), to: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: orders, error } = await context.supabase
      .from("orders")
      .select("id, ticket_number, total, status, payment_method, created_at, items")
      .gte("created_at", data.from)
      .lte("created_at", data.to)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const rows = orders ?? [];
    const encaissees = rows.filter((r) => r.status === "encaissee");
    const total = encaissees.reduce((s, r) => s + Number(r.total ?? 0), 0);
    const tickets = encaissees.length;
    const cancelled = rows.filter((r) => r.status === "annulee").length;
    const avgTicket = tickets > 0 ? total / tickets : 0;

    // by hour
    const byHour: Record<string, number> = {};
    for (const r of encaissees) {
      const h = new Date(r.created_at as string).getHours().toString().padStart(2, "0") + "h";
      byHour[h] = (byHour[h] ?? 0) + Number(r.total ?? 0);
    }
    // by day
    const byDay: Record<string, number> = {};
    for (const r of encaissees) {
      const d = new Date(r.created_at as string).toISOString().slice(0, 10);
      byDay[d] = (byDay[d] ?? 0) + Number(r.total ?? 0);
    }
    // payment mix
    const byPayment: Record<string, number> = {};
    for (const r of encaissees) {
      const p = (r.payment_method as string) ?? "autre";
      byPayment[p] = (byPayment[p] ?? 0) + Number(r.total ?? 0);
    }
    // top items
    const topMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const r of encaissees) {
      const items = Array.isArray(r.items) ? (r.items as Array<Record<string, unknown>>) : [];
      for (const it of items) {
        const name = String(it.name ?? "—");
        const qty = Number(it.quantity ?? it.qty ?? 1);
        const price = Number(it.price ?? it.unitPrice ?? 0);
        if (!topMap[name]) topMap[name] = { name, qty: 0, revenue: 0 };
        topMap[name].qty += qty;
        topMap[name].revenue += qty * price;
      }
    }
    const topItems = Object.values(topMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    return {
      kpi: {
        total,
        tickets,
        cancelled,
        avgTicket,
        cancelRate: rows.length ? cancelled / rows.length : 0,
      },
      byHour: Object.entries(byHour).sort().map(([k, v]) => ({ hour: k, total: v })),
      byDay: Object.entries(byDay).sort().map(([k, v]) => ({ day: k, total: v })),
      byPayment: Object.entries(byPayment).map(([k, v]) => ({ method: k, total: v })),
      topItems,
      orders: rows,
    };
  });
