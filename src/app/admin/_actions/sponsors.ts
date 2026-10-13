"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failure, success, type ActionState } from "@/lib/action-state";
import { audit, requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { deleteObjects, ImageValidationError, storeSponsorLogo } from "@/lib/images";
import { isUuid, optionalText, optionalUrl, requiredText } from "@/lib/validation";

const refresh = () => revalidatePath("/", "layout");

const sponsorSchema = z.object({
  name: requiredText(200, "পৃষ্ঠপোষকের নাম লিখুন।"),
  tier_id: z.string().transform((v) => (isUuid(v) ? v : null)),
  description: optionalText(1000),
  website_url: optionalUrl,
  display_order: z.coerce.number().int().min(0).max(999).catch(0),
  is_published: z.string().optional().transform((v) => v === "on"),
});

export async function saveSponsorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = sponsorSchema.safeParse({
    name: formData.get("name") ?? "",
    tier_id: formData.get("tier_id") ?? "",
    description: formData.get("description") ?? "",
    website_url: formData.get("website_url") ?? "",
    display_order: formData.get("display_order") ?? "0",
    is_published: formData.get("is_published") ?? undefined,
  });
  if (!parsed.success) return failure(parsed.error.issues[0]?.message);
  const d = parsed.data;

  const logo = formData.get("logo");
  let logoKey: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    try {
      logoKey = await storeSponsorLogo(logo);
    } catch (err) {
      if (err instanceof ImageValidationError) return failure("লোগোটি গ্রহণযোগ্য নয় (JPG, PNG বা WebP; সর্বোচ্চ আকারের মধ্যে)।");
      throw err;
    }
  }
  const removeLogo = formData.get("remove_logo") === "on";

  if (id) {
    if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
    const [old] = await sql<{ logo_key: string | null }[]>`select logo_key from sponsors where id = ${id}`;
    if (!old) return failure("পৃষ্ঠপোষক পাওয়া যায়নি।");
    const nextLogo = logoKey ?? (removeLogo ? null : old.logo_key);
    await sql`update sponsors set name = ${d.name}, tier_id = ${d.tier_id}, description = ${d.description},
      website_url = ${d.website_url}, display_order = ${d.display_order}, is_published = ${d.is_published},
      logo_key = ${nextLogo}, updated_at = now() where id = ${id}`;
    if (old.logo_key && old.logo_key !== nextLogo) await deleteObjects([old.logo_key]);
    await audit(admin.id, "update_sponsor", "sponsor", id);
  } else {
    try {
      const [row] = await sql<{ id: string }[]>`insert into sponsors (name, tier_id, description, website_url, display_order, is_published, logo_key)
        values (${d.name}, ${d.tier_id}, ${d.description}, ${d.website_url}, ${d.display_order}, ${d.is_published}, ${logoKey}) returning id`;
      await audit(admin.id, "create_sponsor", "sponsor", row.id);
    } catch (err) {
      if (logoKey) await deleteObjects([logoKey]);
      throw err;
    }
  }
  refresh();
  return success(id ? "পৃষ্ঠপোষকের তথ্য হালনাগাদ করা হয়েছে।" : "নতুন পৃষ্ঠপোষক যুক্ত করা হয়েছে।");
}

export async function deleteSponsorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
  const [row] = await sql<{ logo_key: string | null }[]>`delete from sponsors where id = ${id} returning logo_key`;
  if (row?.logo_key) await deleteObjects([row.logo_key]);
  await audit(admin.id, "delete_sponsor", "sponsor", id);
  refresh();
  return success("পৃষ্ঠপোষক মুছে ফেলা হয়েছে।");
}

const tierSchema = z.object({
  name: requiredText(100, "শ্রেণির নাম লিখুন।"),
  display_order: z.coerce.number().int().min(0).max(999).catch(0),
});

export async function saveTierAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = tierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message);
  const d = parsed.data;
  if (id) {
    if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
    await sql`update sponsor_tiers set name = ${d.name}, display_order = ${d.display_order} where id = ${id}`;
  } else {
    await sql`insert into sponsor_tiers (name, display_order) values (${d.name}, ${d.display_order})`;
  }
  await audit(admin.id, id ? "update_tier" : "create_tier", "sponsor_tier", id || null);
  refresh();
  return success(id ? "শ্রেণি হালনাগাদ করা হয়েছে।" : "নতুন শ্রেণি যুক্ত করা হয়েছে।");
}

export async function deleteTierAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
  await sql`delete from sponsor_tiers where id = ${id}`;
  await audit(admin.id, "delete_tier", "sponsor_tier", id);
  refresh();
  return success("শ্রেণি মুছে ফেলা হয়েছে। এই শ্রেণির পৃষ্ঠপোষকরা 'অন্যান্য' হিসেবে দেখাবে।");
}
