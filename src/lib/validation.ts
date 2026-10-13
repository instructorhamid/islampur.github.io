import { z } from "zod";
import { fromBnDigits, toBn } from "./bn";
import { BLOOD_GROUPS } from "./constants";
import { normalizeBdPhone } from "./phone";

/** Collapse internal whitespace and trim. */
export function cleanText(value: string): string {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

// Letters (any script, incl. Bengali), combining marks (Bengali vowel signs), spaces and . ' -
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'\-]*$/u;

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal(""), z.literal("false"), z.undefined(), z.null()])
  .transform((v) => v === "on" || v === "true" || v === "1");

export const registrationMessages = {
  fullNameRequired: "অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।",
  fullNameShort: "নাম কমপক্ষে ২ অক্ষরের হতে হবে।",
  fullNameLong: "নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারে।",
  fullNameInvalid: "নামে শুধু বাংলা বা ইংরেজি অক্ষর, স্পেস, ডট ও হাইফেন ব্যবহার করুন।",
  phoneRequired: "অনুগ্রহ করে আপনার মোবাইল নম্বর লিখুন।",
  phoneInvalid: "সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: ০১৭১২৩৪৫৬৭৮)।",
  bloodGroupRequired: "অনুগ্রহ করে রক্তের গ্রুপ নির্বাচন করুন।",
  passingYearRequired: "অনুগ্রহ করে পাসের বছর নির্বাচন করুন।",
  passingYearRange: (min: number, max: number) =>
    `পাসের বছর ${toBn(min)} থেকে ${toBn(max)} সালের মধ্যে হতে হবে।`,
  privacyRequired: "নিবন্ধনের জন্য গোপনীয়তা নীতিতে সম্মতি দেওয়া প্রয়োজন।",
  photoRequired: "অনুগ্রহ করে একটি প্রোফাইল ছবি যুক্ত করুন।",
  photoType: "শুধু JPG, PNG বা WebP ছবি গ্রহণযোগ্য।",
  photoSize: (mb: number) => `ছবির আকার সর্বোচ্চ ${toBn(mb)} মেগাবাইট হতে পারে।`,
  photoInvalid: "ছবিটি পড়া যাচ্ছে না। অনুগ্রহ করে অন্য একটি ছবি নির্বাচন করুন।",
};

export function registrationSchema(range: { min: number; max: number }) {
  const m = registrationMessages;
  return z.object({
    full_name: z
      .string({ required_error: m.fullNameRequired })
      .transform(cleanText)
      .pipe(
        z
          .string()
          .min(1, m.fullNameRequired)
          .min(2, m.fullNameShort)
          .max(100, m.fullNameLong)
          .regex(NAME_PATTERN, m.fullNameInvalid),
      ),
    phone: z
      .string({ required_error: m.phoneRequired })
      .trim()
      .min(1, m.phoneRequired)
      .transform((v, ctx) => {
        const normalized = normalizeBdPhone(v);
        if (!normalized) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: m.phoneInvalid });
          return z.NEVER;
        }
        return normalized;
      }),
    blood_group: z.enum(BLOOD_GROUPS, {
      errorMap: () => ({ message: m.bloodGroupRequired }),
    }),
    passing_year: z
      .string({ required_error: m.passingYearRequired })
      .transform((v) => fromBnDigits(v).trim())
      .pipe(
        z
          .string()
          .min(1, m.passingYearRequired)
          .regex(/^\d{4}$/, m.passingYearRequired)
          .transform(Number)
          .pipe(
            z
              .number()
              .min(range.min, m.passingYearRange(range.min, range.max))
              .max(range.max, m.passingYearRange(range.min, range.max)),
          ),
      ),
    photo_consent: checkbox,
    blood_group_public_consent: checkbox,
    privacy_accepted: checkbox.refine((v) => v === true, m.privacyRequired),
  });
}

/** Turn zod issues into a { field: firstMessage } map. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Optional http(s) URL; empty string → null. */
export const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^https?:\/\/[^\s]+$/i.test(v), "সঠিক ওয়েব ঠিকানা দিন (https:// দিয়ে শুরু)।");

export const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max, `সর্বোচ্চ ${toBn(max)} অক্ষর লেখা যাবে।`)
    .transform((v) => (v === "" ? null : v));

export const requiredText = (max = 300, message = "এই ঘরটি পূরণ করা আবশ্যক।") =>
  z.string().trim().min(1, message).max(max, `সর্বোচ্চ ${toBn(max)} অক্ষর লেখা যাবে।`);

export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
