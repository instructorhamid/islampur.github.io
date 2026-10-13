import { type NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { storage } from "@/lib/storage";
import { isUuid } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });
  const [row] = await sql<{ logo_key: string | null; is_published: boolean }[]>`
    select logo_key, is_published from sponsors where id = ${id}`;
  if (!row?.logo_key || (!row.is_published && !(await getCurrentAdmin()))) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const object = await storage().get(row.logo_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(object.body), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": row.is_published ? "public, max-age=3600, stale-while-revalidate=86400" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
