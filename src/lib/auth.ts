import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { AdminRole } from "./constants";
import { sql } from "./db";
import { env } from "./env";

export const SESSION_COOKIE = "ihs_admin_session";
const SESSION_DAYS = 7;

export type AdminUser = { id: string; name: string; email: string; role: AdminRole };

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`insert into admin_sessions (admin_id, token_hash, expires_at) values (${adminId}, ${hashToken(token)}, ${expires})`;
  await sql`update admins set last_login_at = now() where id = ${adminId}`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql`delete from admin_sessions where token_hash = ${hashToken(token)}`;
  jar.delete(SESSION_COOKIE);
}

/** Current admin for this request, or null. Cached per request. */
export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const [admin] = await sql<AdminUser[]>`
    select a.id, a.name, a.email, a.role
    from admin_sessions s join admins a on a.id = s.admin_id
    where s.token_hash = ${hashToken(token)} and s.expires_at > now() and a.is_active`;
  return admin ?? null;
});

/**
 * Server-side guard for admin pages and actions. Redirects to the login page when
 * the visitor is not signed in; redirects to the dashboard when the role is insufficient.
 */
export async function requireAdmin(role: AdminRole | "any" = "any"): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (role === "admin" && admin.role !== "admin") redirect("/admin?error=forbidden");
  return admin;
}

export async function audit(adminId: string, action: string, targetType: string | null, targetId: string | null, details?: Record<string, unknown>) {
  await sql`insert into audit_log (admin_id, action, target_type, target_id, details)
            values (${adminId}, ${action}, ${targetType}, ${targetId}, ${details ? sql.json(details as never) : null})`;
}
