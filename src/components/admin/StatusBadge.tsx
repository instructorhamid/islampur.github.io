import { APPROVAL_STATUS_LABELS, type ApprovalStatus } from "@/lib/constants";

export function StatusBadge({ status }: { status: ApprovalStatus }) {
  const cls = status === "approved" ? "badge-green" : status === "pending" ? "badge-amber" : "badge-red";
  return <span className={`badge ${cls}`}>{APPROVAL_STATUS_LABELS[status]}</span>;
}

export function PageTitle({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
