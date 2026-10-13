import { UserX } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default function AlumnusNotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<UserX aria-hidden size={28} />}
        title="প্রোফাইলটি পাওয়া যায়নি"
        description="প্রোফাইলটি হয়তো এখনো অনুমোদিত হয়নি, অথবা সরিয়ে নেওয়া হয়েছে।"
        action={{ href: "/alumni", label: "প্রাক্তন শিক্ষার্থী তালিকা" }}
      />
    </div>
  );
}
