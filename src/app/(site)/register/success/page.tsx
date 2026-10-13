import type { Metadata } from "next";
import { RegistrationSuccess } from "@/components/RegistrationSuccess";

export const metadata: Metadata = { title: "নিবন্ধন সম্পন্ন", robots: { index: false } };

// Landing page for the no-JavaScript form fallback (the enhanced form shows the same message inline).
export default async function RegisterSuccessPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <RegistrationSuccess status={status === "approved" ? "approved" : "pending"} />
    </div>
  );
}
