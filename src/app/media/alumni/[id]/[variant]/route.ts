import { type NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { publicPhotoKey } from "@/lib/queries/alumni";
import { storage } from "@/lib/storage";
import { isUuid } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Serves alumni photos from (private) storage. A photo is public only when the registration
 * is approved AND the person consented to photo display. Signed-in organizers can see every photo.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; variant: string }> }) {
  const { id, variant } = await params;
  if (!isUuid(id) || (variant !== "thumb" && variant !== "full")) return new Response("Not found", { status: 404 });

  let key = await publicPhotoKey(id);
  let isPublic = true;
  if (!key) {
    const admin = await getCurrentAdmin();
    if (admin) {
      const [row] = await sql<{ photo_key: string | null }[]>`select photo_key from registrations where id = ${id}`;
      key = row?.photo_key ?? null;
      isPublic = false;
    }
  }
  if (!key) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const object = await storage().get(`${key}/${variant}.webp`);
  if (!object) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  return new Response(new Uint8Array(object.body), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(object.body.length),
      // Short public cache so removing a photo or unpublishing takes effect quickly.
      "Cache-Control": isPublic ? "public, max-age=600, stale-while-revalidate=3600" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "X-Robots-Tag": "noindex",
    },
  });
}
