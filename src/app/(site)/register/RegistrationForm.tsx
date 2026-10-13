"use client";

import { AlertCircle, ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { RegistrationSuccess } from "@/components/RegistrationSuccess";
import { toBn } from "@/lib/bn";
import { ALLOWED_IMAGE_TYPES, BLOOD_GROUPS } from "@/lib/constants";
import { fieldErrors, registrationMessages, registrationSchema } from "@/lib/validation";

type Props = {
  minYear: number;
  maxYear: number;
  maxUploadMb: number;
  requireApproval: boolean;
  showBloodPublicOption: boolean;
  fallbackError: string | null;
};

type Values = {
  full_name: string;
  phone: string;
  blood_group: string;
  passing_year: string;
  photo_consent: boolean;
  blood_group_public_consent: boolean;
  privacy_accepted: boolean;
};

const FIELD_ORDER = ["full_name", "phone", "blood_group", "passing_year", "photo", "privacy_accepted"] as const;
const MAX_ORIGINAL_MB = 15;

/**
 * Downscale large photos in the browser (max 1600px JPEG) so uploads are fast on mobile data.
 * The server still validates and re-encodes everything; this is only a convenience.
 */
async function prepareImage(file: File, maxBytes: number): Promise<File> {
  if (file.size <= Math.min(maxBytes, 1.5 * 1024 * 1024)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // transparent PNG areas become white instead of black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function RegistrationForm({ minYear, maxYear, maxUploadMb, requireApproval, showBloodPublicOption, fallbackError }: Props) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const [values, setValues] = useState<Values>({
    full_name: "",
    phone: "",
    blood_group: "",
    passing_year: "",
    photo_consent: false,
    blood_group_public_consent: false,
    privacy_accepted: false,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(fallbackError);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ status: "pending" | "approved"; passingYear: number } | null>(null);

  const schema = registrationSchema({ min: minYear, max: maxYear });
  const maxBytes = maxUploadMb * 1024 * 1024;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { if (done) successRef.current?.focus(); }, [done]);

  function validate(v: Values, file: File | null) {
    const result = schema.safeParse({
      ...v,
      photo_consent: v.photo_consent ? "on" : "",
      blood_group_public_consent: v.blood_group_public_consent ? "on" : "",
      privacy_accepted: v.privacy_accepted ? "on" : "",
    });
    const errs = result.success ? {} : fieldErrors(result.error);
    if (!file) errs.photo = registrationMessages.photoRequired;
    return errs;
  }

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    // Re-validate a field that is currently showing an error so the message clears as soon as it's fixed.
    if (errors[key]) {
      const errs = validate(next, photo);
      setErrors((prev) => {
        const copy = { ...prev };
        if (errs[key]) copy[key] = errs[key];
        else delete copy[key];
        return copy;
      });
    }
  }

  function onBlur(key: keyof Values) {
    const errs = validate(values, photo);
    setErrors((prev) => {
      const copy = { ...prev };
      if (errs[key] && (values[key] !== "" || prev[key])) copy[key] = errs[key];
      else delete copy[key];
      return copy;
    });
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    let message: string | null = null;
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) message = registrationMessages.photoType;
    else if (file.size > MAX_ORIGINAL_MB * 1024 * 1024) message = registrationMessages.photoSize(MAX_ORIGINAL_MB);
    if (message) {
      setErrors((prev) => ({ ...prev, photo: message }));
      e.target.value = "";
      return;
    }
    setPreparing(true);
    const prepared = await prepareImage(file, maxBytes);
    setPreparing(false);
    if (prepared.size > maxBytes) {
      setErrors((prev) => ({ ...prev, photo: registrationMessages.photoSize(maxUploadMb) }));
      e.target.value = "";
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(prepared);
    setPreview(URL.createObjectURL(prepared));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.photo;
      return copy;
    });
  }

  function removePhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    fileRef.current?.focus();
  }

  function focusFirstError(errs: Record<string, string>) {
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(first === "photo" ? `#${CSS.escape(`${id}-photo`)}` : `[name="${first}"]`);
    el?.focus();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || preparing) return; // guard against double submission
    setFormError(null);
    const errs = validate(values, photo);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormError("কিছু তথ্য সঠিক নয়। অনুগ্রহ করে চিহ্নিত ঘরগুলো দেখুন।");
      focusFirstError(errs);
      return;
    }

    const body = new FormData();
    body.set("full_name", values.full_name);
    body.set("phone", values.phone);
    body.set("blood_group", values.blood_group);
    body.set("passing_year", values.passing_year);
    if (values.photo_consent) body.set("photo_consent", "on");
    if (values.blood_group_public_consent) body.set("blood_group_public_consent", "on");
    if (values.privacy_accepted) body.set("privacy_accepted", "on");
    body.set("website", (formRef.current?.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "");
    body.set("photo", photo as File);

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", { method: "POST", body, headers: { "x-requested-with": "fetch" } });
      const json = (await res.json().catch(() => null)) as
        | { ok: true; status: "pending" | "approved"; passing_year: number }
        | { ok: false; message: string; fields?: Record<string, string> }
        | null;
      if (json && json.ok) {
        setDone({ status: json.status, passingYear: json.passing_year });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const fields = json && !json.ok ? json.fields ?? {} : {};
      setErrors(fields);
      setFormError(json && !json.ok ? json.message : "দুঃখিত, একটি সমস্যা হয়েছে। আপনার নিবন্ধন সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।");
      if (Object.keys(fields).length) focusFirstError(fields);
      else alertRef.current?.focus();
    } catch {
      setFormError("ইন্টারনেট সংযোগে সমস্যা হয়েছে। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন। আপনার নিবন্ধন এখনো জমা হয়নি।");
      alertRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <RegistrationSuccess status={done.status} passingYear={done.passingYear} headingRef={successRef} />;

  const fid = (name: string) => `${id}-${name}`;
  const describedBy = (name: string, hint = false) =>
    [hint ? `${fid(name)}-hint` : null, errors[name] ? `${fid(name)}-error` : null].filter(Boolean).join(" ") || undefined;
  const ErrorText = ({ name }: { name: string }) =>
    errors[name] ? (
      <p id={`${fid(name)}-error`} className="field-error">
        <AlertCircle aria-hidden size={16} className="mt-0.5 shrink-0" />
        {errors[name]}
      </p>
    ) : null;

  return (
    <form
      ref={formRef}
      action="/api/register"
      method="post"
      encType="multipart/form-data"
      noValidate
      onSubmit={onSubmit}
      className="card p-5 sm:p-8"
      aria-describedby={`${id}-required-note`}
    >
      <p id={`${id}-required-note`} className="text-sm text-muted">
        <span className="text-red-ink">*</span> চিহ্নিত সব ঘর পূরণ করা আবশ্যক।
      </p>

      <div ref={alertRef} tabIndex={-1} aria-live="assertive" className="outline-none">
        {formError && (
          <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-ink/30 bg-red-bg px-4 py-3 text-red-ink">
            <AlertCircle aria-hidden size={20} className="mt-0.5 shrink-0" />
            <p>{formError}</p>
          </div>
        )}
      </div>

      {/* Honeypot for bots — hidden from people and assistive technology */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={fid("website")}>ওয়েবসাইট</label>
        <input id={fid("website")} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={fid("full_name")} className="field-label">
            পূর্ণ নাম <span className="text-red-ink" aria-hidden="true">*</span>
          </label>
          <input
            id={fid("full_name")}
            name="full_name"
            type="text"
            className="input"
            autoComplete="name"
            required
            maxLength={100}
            value={values.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            onBlur={() => onBlur("full_name")}
            aria-invalid={errors.full_name ? true : undefined}
            aria-describedby={describedBy("full_name", true)}
            placeholder="যেমন: মোহাম্মদ আব্দুল করিম"
          />
          <p id={`${fid("full_name")}-hint`} className="field-hint">বাংলা বা ইংরেজিতে লিখতে পারেন। এই নামটিই তালিকায় দেখা যাবে।</p>
          <ErrorText name="full_name" />
        </div>

        <div>
          <label htmlFor={fid("phone")} className="field-label">
            মোবাইল নম্বর <span className="text-red-ink" aria-hidden="true">*</span>
          </label>
          <input
            id={fid("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            className="input"
            autoComplete="tel"
            required
            maxLength={20}
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            onBlur={() => onBlur("phone")}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy("phone", true)}
            placeholder="০১৭XXXXXXXX"
          />
          <p id={`${fid("phone")}-hint`} className="field-hint">কখনোই প্রকাশ করা হবে না। প্রতিটি নম্বরে একবারই নিবন্ধন করা যায়।</p>
          <ErrorText name="phone" />
        </div>

        <div>
          <label htmlFor={fid("blood_group")} className="field-label">
            রক্তের গ্রুপ <span className="text-red-ink" aria-hidden="true">*</span>
          </label>
          <select
            id={fid("blood_group")}
            name="blood_group"
            className="input"
            required
            value={values.blood_group}
            onChange={(e) => update("blood_group", e.target.value)}
            onBlur={() => onBlur("blood_group")}
            aria-invalid={errors.blood_group ? true : undefined}
            aria-describedby={describedBy("blood_group")}
          >
            <option value="">নির্বাচন করুন</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <ErrorText name="blood_group" />
        </div>

        <div>
          <label htmlFor={fid("passing_year")} className="field-label">
            পাসের বছর (এসএসসি) <span className="text-red-ink" aria-hidden="true">*</span>
          </label>
          <select
            id={fid("passing_year")}
            name="passing_year"
            className="input"
            required
            value={values.passing_year}
            onChange={(e) => update("passing_year", e.target.value)}
            onBlur={() => onBlur("passing_year")}
            aria-invalid={errors.passing_year ? true : undefined}
            aria-describedby={describedBy("passing_year", true)}
          >
            <option value="">বছর নির্বাচন করুন</option>
            {years.map((y) => (
              <option key={y} value={y}>{toBn(y)}</option>
            ))}
          </select>
          <p id={`${fid("passing_year")}-hint`} className="field-hint">
            {toBn(minYear)} থেকে {toBn(maxYear)} সাল পর্যন্ত। আপনার বছর না থাকলে আয়োজকদের জানান।
          </p>
          <ErrorText name="passing_year" />
        </div>

        <div className="sm:col-span-2">
          <span id={`${fid("photo")}-label`} className="field-label">
            প্রোফাইল ছবি <span className="text-red-ink" aria-hidden="true">*</span>
          </span>
          <div
            className={`flex flex-col gap-4 rounded-xl border-2 border-dashed p-4 sm:flex-row sm:items-center ${
              errors.photo ? "border-red-ink/50 bg-red-bg/40" : "border-line bg-green-light/40"
            }`}
          >
            <div className="grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-line">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="নির্বাচিত ছবির প্রিভিউ" className="h-full w-full object-cover" />
              ) : preparing ? (
                <Loader2 aria-hidden size={28} className="animate-spin text-green" />
              ) : (
                <ImagePlus aria-hidden size={32} className="text-green/70" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <input
                ref={fileRef}
                id={fid("photo")}
                name="photo"
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                required
                className="sr-only"
                onChange={onFileChange}
                aria-labelledby={`${fid("photo")}-label ${fid("photo")}-button`}
                aria-invalid={errors.photo ? true : undefined}
                aria-describedby={describedBy("photo", true)}
              />
              <div className="flex flex-wrap gap-2">
                <label id={`${fid("photo")}-button`} htmlFor={fid("photo")} className="btn btn-outline btn-sm cursor-pointer">
                  {photo ? <RefreshCw aria-hidden size={16} /> : <ImagePlus aria-hidden size={16} />}
                  {photo ? "ছবি পরিবর্তন করুন" : "ছবি নির্বাচন করুন"}
                </label>
                {photo && (
                  <button type="button" onClick={removePhoto} className="btn btn-ghost btn-sm text-red-ink">
                    <Trash2 aria-hidden size={16} /> সরান
                  </button>
                )}
              </div>
              <p id={`${fid("photo")}-hint`} className="field-hint">
                JPG, PNG বা WebP; সর্বোচ্চ {toBn(MAX_ORIGINAL_MB)} মেগাবাইট (বড় ছবি স্বয়ংক্রিয়ভাবে ছোট করা হবে)। মুখ স্পষ্ট দেখা যায় এমন ছবি দিন।
              </p>
              {preparing && <p className="field-hint" role="status">ছবি প্রস্তুত করা হচ্ছে…</p>}
              <ErrorText name="photo" />
            </div>
          </div>
        </div>
      </div>

      <fieldset className="mt-8 space-y-4 rounded-xl bg-green-light/50 p-4 sm:p-5">
        <legend className="sr-only">প্রকাশ ও গোপনীয়তা সংক্রান্ত সম্মতি</legend>
        <p className="font-display font-semibold">প্রকাশের অনুমতি</p>
        <label className="flex cursor-pointer gap-3">
          <input
            type="checkbox"
            name="photo_consent"
            className="checkbox"
            checked={values.photo_consent}
            onChange={(e) => update("photo_consent", e.target.checked)}
          />
          <span>
            আমার ছবি প্রাক্তন শিক্ষার্থী তালিকায় প্রকাশ করা যাবে।
            <span className="block text-sm text-muted">টিক না দিলে ছবির বদলে নামের আদ্যক্ষর দেখানো হবে; ছবিটি শুধু আয়োজকরা দেখবেন।</span>
          </span>
        </label>
        {showBloodPublicOption && (
          <label className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              name="blood_group_public_consent"
              className="checkbox"
              checked={values.blood_group_public_consent}
              onChange={(e) => update("blood_group_public_consent", e.target.checked)}
            />
            <span>
              আমার রক্তের গ্রুপ তালিকায় প্রকাশ করা যাবে।
              <span className="block text-sm text-muted">জরুরি প্রয়োজনে সহপাঠীরা যেন খুঁজে পান — সম্পূর্ণ ঐচ্ছিক।</span>
            </span>
          </label>
        )}
        <div>
          <label className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              name="privacy_accepted"
              className="checkbox"
              required
              checked={values.privacy_accepted}
              onChange={(e) => update("privacy_accepted", e.target.checked)}
              aria-invalid={errors.privacy_accepted ? true : undefined}
              aria-describedby={describedBy("privacy_accepted")}
            />
            <span>
              আমি{" "}
              <Link href="/privacy" target="_blank" className="font-semibold text-green underline underline-offset-4">
                গোপনীয়তা নীতি
              </Link>{" "}
              পড়েছি এবং অনুমোদনের পর আমার নাম ও পাসের বছর প্রকাশে সম্মতি দিচ্ছি। <span className="text-red-ink" aria-hidden="true">*</span>
            </span>
          </label>
          <ErrorText name="privacy_accepted" />
        </div>
      </fieldset>

      <div className="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {requireApproval ? "জমা দেওয়ার পর আয়োজকরা তথ্য যাচাই করে অনুমোদন করবেন।" : "জমা দেওয়ার পরপরই আপনার নাম তালিকায় যুক্ত হবে।"}
        </p>
        <button type="submit" className="btn btn-primary !min-h-[3.25rem] px-8 text-[1.05rem]" disabled={submitting || preparing} aria-busy={submitting}>
          {submitting ? (
            <>
              <Loader2 aria-hidden size={20} className="animate-spin" /> জমা হচ্ছে…
            </>
          ) : (
            "নিবন্ধন সম্পন্ন করুন"
          )}
        </button>
      </div>
    </form>
  );
}
