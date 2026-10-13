import { NextResponse, type NextRequest } from "next/server";
import { audit, getCurrentAdmin } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { APPROVAL_STATUS_LABELS } from "@/lib/constants";
import { exportRegistrations, parseAdminFilters } from "@/lib/queries/admin";

export const runtime = "nodejs";

/** CSV export of registrations — main administrators only (contains phone numbers). */
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.redirect(new URL("/admin/login", req.url));
  if (admin.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const filters = parseAdminFilters(Object.fromEntries(req.nextUrl.searchParams));
  const rows = await exportRegistrations(filters);
  await audit(admin.id, "export_csv", "registration", null, { count: rows.length, ...filters });

  const csv = toCsv(
    ["নাম", "মোবাইল", "রক্তের গ্রুপ", "পাসের বছর", "অবস্থা", "ছবি প্রকাশের সম্মতি", "রক্তের গ্রুপ প্রকাশের সম্মতি", "নমুনা", "নিবন্ধনের সময়"],
    rows.map((r) => [
      r.full_name,
      r.normalized_phone,
      r.blood_group,
      r.passing_year,
      APPROVAL_STATUS_LABELS[r.approval_status],
      r.photo_consent ? "হ্যাঁ" : "না",
      r.blood_group_public_consent ? "হ্যাঁ" : "না",
      r.is_demo ? "হ্যাঁ" : "না",
      r.created_at,
    ]),
  );
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
