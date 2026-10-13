export default function Loading() {
  return (
    <div className="container-page py-10" role="status" aria-label="ব্যাচ তালিকা লোড হচ্ছে">
      <div className="skeleton h-9 w-64" />
      <div className="skeleton mt-8 h-24 w-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton h-44" />
        ))}
      </div>
      <span className="sr-only">লোড হচ্ছে…</span>
    </div>
  );
}
