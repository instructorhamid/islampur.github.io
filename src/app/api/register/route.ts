import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { isUniqueViolation, sql } from "@/lib/db";
import { env } from "@/lib/env";
import { deleteObjects, ImageValidationError, photoObjectKeys, storeProfilePhoto } from "@/lib/images";
import { getActiveEvent, registrationClosedReason } from "@/lib/queries/event";
import { getSettings } from "@/lib/queries/settings";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, registrationMessages, registrationSchema } from "@/lib/validation";

export const runtime = "nodejs";

type ErrorCode = "origin" | "too_large" | "rate_limited" | "closed" | "deadline" | "invalid_form" | "validation" | "duplicate" | "server";

const MESSAGES: Record<ErrorCode, string> = {
  origin: "অনুরোধটি গ্রহণ করা যায়নি। অনুগ্রহ করে ওয়েবসাইট থেকে আবার চেষ্টা করুন।",
  too_large: "জমা দেওয়া তথ্যের আকার অনেক বড়। ছোট আকারের একটি ছবি দিয়ে আবার চেষ্টা করুন।",
  rate_limited: "অল্প সময়ে অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
  closed: "এই মুহূর্তে নিবন্ধন বন্ধ রয়েছে।",
  deadline: "নিবন্ধনের নির্ধারিত সময় শেষ হয়ে গেছে।",
  invalid_form: "ফর্মটি সঠিকভাবে জমা হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
  validation: "কিছু তথ্য সঠিক নয়। অনুগ্রহ করে চিহ্নিত ঘরগুলো দেখুন।",
  duplicate: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে নিবন্ধন করা হয়েছে। তথ্য সংশোধনের প্রয়োজন হলে আয়োজকদের সঙ্গে যোগাযোগ করুন।",
  server: "দুঃখিত, একটি সমস্যা হয়েছে। আপনার নিবন্ধন সংরক্ষণ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
};

const STATUS: Record<ErrorCode, number> = {
  origin: 403, too_large: 413, rate_limited: 429, closed: 403, deadline: 403,
  invalid_form: 400, validation: 422, duplicate: 409, server: 500,
};

/**
 * Responds with JSON for the enhanced (fetch) form, or redirects for the no-JavaScript fallback.
 */
function fail(req: NextRequest, code: ErrorCode, fields?: Record<string, string>) {
  if (req.headers.get("x-requested-with") !== "fetch") {
    return NextResponse.redirect(new URL(`/register?error=${code}`, req.url), 303);
  }
  return NextResponse.json({ ok: false, code, message: MESSAGES[code], fields }, { status: STATUS[code] });
}

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients; still subject to every other check
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail(req, "origin");

  const length = Number(req.headers.get("content-length") || 0);
  if (length > env.maxUploadBytes + 64 * 1024) return fail(req, "too_large");

  // Generous per-IP limit: Bangladeshi mobile carriers use carrier-grade NAT and venues share Wi-Fi.
  if (!(await rateLimit("register", await clientIp(), 20, 10 * 60))) return fail(req, "rate_limited");

  const [settings, event] = await Promise.all([getSettings(), getActiveEvent()]);
  const closed = registrationClosedReason(event, settings.registration_open);
  if (closed === "disabled") return fail(req, "closed");
  if (closed === "deadline") return fail(req, "deadline");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(req, "invalid_form");
  }

  // Honeypot: real visitors never see or fill this field.
  if (String(form.get("website") ?? "") !== "") return fail(req, "invalid_form");

  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const parsed = registrationSchema({ min: settings.min_passing_year, max: settings.max_passing_year }).safeParse({
    full_name: str("full_name"),
    phone: str("phone"),
    blood_group: str("blood_group"),
    passing_year: str("passing_year"),
    photo_consent: str("photo_consent"),
    blood_group_public_consent: str("blood_group_public_consent"),
    privacy_accepted: str("privacy_accepted"),
  });

  const photo = form.get("photo");
  const errors = parsed.success ? {} : fieldErrors(parsed.error);
  if (!(photo instanceof File) || photo.size === 0) errors.photo = registrationMessages.photoRequired;
  if (!parsed.success || Object.keys(errors).length > 0) return fail(req, "validation", errors);
  const data = parsed.data;

  // Cheap duplicate check before doing image work. The unique index below is the real guarantee.
  const [existing] = await sql`select 1 from registrations where normalized_phone = ${data.phone}`;
  if (existing) return fail(req, "duplicate", { phone: MESSAGES.duplicate });

  let photoKey: string;
  try {
    photoKey = await storeProfilePhoto(photo);
  } catch (err) {
    if (err instanceof ImageValidationError) {
      const message =
        err.reason === "type" ? registrationMessages.photoType
        : err.reason === "size" ? registrationMessages.photoSize(Math.round(env.maxUploadBytes / 1024 / 1024))
        : err.reason === "missing" ? registrationMessages.photoRequired
        : registrationMessages.photoInvalid;
      return fail(req, "validation", { photo: message });
    }
    console.error("Photo storage failed", err);
    return fail(req, "server");
  }

  const status = settings.require_approval ? "pending" : "approved";
  try {
    await sql`
      insert into registrations (full_name, normalized_phone, blood_group, passing_year, photo_key,
        photo_consent, blood_group_public_consent, privacy_accepted_at, approval_status, reviewed_at)
      values (${data.full_name}, ${data.phone}, ${data.blood_group}, ${data.passing_year}, ${photoKey},
        ${data.photo_consent}, ${data.blood_group_public_consent}, now(), ${status},
        ${status === "approved" ? sql`now()` : null})`;
  } catch (err) {
    // Never leave orphaned files behind when the record could not be saved.
    await deleteObjects(photoObjectKeys(photoKey));
    if (isUniqueViolation(err, "registrations_phone_key")) return fail(req, "duplicate", { phone: MESSAGES.duplicate });
    console.error("Registration insert failed", err);
    return fail(req, "server");
  }

  if (status === "approved") {
    revalidatePath("/", "layout");
  }

  if (req.headers.get("x-requested-with") !== "fetch") {
    return NextResponse.redirect(new URL(`/register/success?status=${status}`, req.url), 303);
  }
  return NextResponse.json({ ok: true, status, passing_year: data.passing_year }, { status: 201 });
}
