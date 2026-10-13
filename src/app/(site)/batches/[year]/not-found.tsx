import { EmptyState } from "@/components/ui";

export default function BatchNotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        title="ব্যাচটি পাওয়া যায়নি"
        description="ঠিকানায় দেওয়া বছরটি সঠিক নয় অথবা নির্ধারিত পাসের বছরের সীমার বাইরে।"
        action={{ href: "/batches", label: "সব ব্যাচ দেখুন" }}
      />
    </div>
  );
}
