import { AlumniGridSkeleton } from "@/components/AlumniCard";

export default function Loading() {
  return (
    <div className="container-page py-10" role="status" aria-label="তালিকা লোড হচ্ছে">
      <div className="skeleton h-9 w-64" />
      <div className="skeleton mt-4 h-5 w-full max-w-xl" />
      <div className="skeleton mt-8 h-24 w-full" />
      <div className="mt-8">
        <AlumniGridSkeleton />
      </div>
      <span className="sr-only">লোড হচ্ছে…</span>
    </div>
  );
}
