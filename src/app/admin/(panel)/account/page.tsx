import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { AdminCard, TextInput } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/StatusBadge";
import { toBn } from "@/lib/bn";
import { ADMIN_ROLE_LABELS } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { changePasswordAction } from "../../_actions/auth";

export const metadata = { title: "আমার অ্যাকাউন্ট" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <>
      <PageTitle title="আমার অ্যাকাউন্ট" description={`${admin.name} · ${admin.email} · ${ADMIN_ROLE_LABELS[admin.role]}`} />
      <div className="max-w-xl">
        <AdminCard title="পাসওয়ার্ড পরিবর্তন">
          <ActionForm action={changePasswordAction} resetOnSuccess className="space-y-4">
            <TextInput label="বর্তমান পাসওয়ার্ড" name="current_password" type="password" required autoComplete="current-password" />
            <TextInput label="নতুন পাসওয়ার্ড" name="new_password" type="password" required minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" hint={`কমপক্ষে ${toBn(PASSWORD_MIN_LENGTH)} অক্ষর।`} />
            <TextInput label="নতুন পাসওয়ার্ড আবার লিখুন" name="confirm_password" type="password" required autoComplete="new-password" />
            <SubmitButton>পাসওয়ার্ড পরিবর্তন করুন</SubmitButton>
          </ActionForm>
        </AdminCard>
      </div>
    </>
  );
}
