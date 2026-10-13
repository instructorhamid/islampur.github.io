import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { AdminCard, Checkbox, Select, TextInput } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/StatusBadge";
import { formatBnDateTime, toBn } from "@/lib/bn";
import { ADMIN_ROLE_LABELS, ADMIN_ROLES, type AdminRole } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { createAdminAction, updateAdminAction } from "../../_actions/users";

export const metadata = { title: "অ্যাডমিন ব্যবহারকারী" };

export default async function UsersPage() {
  const me = await requireAdmin("admin");
  const admins = await sql<{ id: string; name: string; email: string; role: AdminRole; is_active: boolean; last_login_at: Date | null }[]>`
    select id, name, email, role, is_active, last_login_at from admins order by created_at`;

  return (
    <>
      <PageTitle title="অ্যাডমিন ব্যবহারকারী" description="প্রধান অ্যাডমিন সব কিছু করতে পারেন। মডারেটর নিবন্ধন পর্যালোচনা ও কনটেন্ট সম্পাদনা করতে পারেন, কিন্তু নিবন্ধন মুছে ফেলা, CSV ডাউনলোড ও সেটিংস পরিবর্তন করতে পারেন না।" />
      <div className="space-y-6">
        <AdminCard title="অ্যাকাউন্টসমূহ">
          <ul className="divide-y divide-line">
            {admins.map((a) => (
              <li key={a.id} className="py-4">
                <ActionForm action={updateAdminAction} className="flex flex-wrap items-end gap-4">
                  <input type="hidden" name="id" value={a.id} />
                  <div className="min-w-56 flex-1">
                    <p className="font-semibold">{a.name} {a.id === me.id && <span className="badge badge-green">আপনি</span>}</p>
                    <p className="text-sm text-muted">{a.email}</p>
                    <p className="text-xs text-muted">সর্বশেষ লগইন: {a.last_login_at ? formatBnDateTime(a.last_login_at) : "কখনো না"}</p>
                  </div>
                  <Select label="ভূমিকা" name="role" defaultValue={a.role} className="w-44">
                    {ADMIN_ROLES.map((r) => <option key={r} value={r}>{ADMIN_ROLE_LABELS[r]}</option>)}
                  </Select>
                  <div className="pb-3"><Checkbox label="সক্রিয়" name="is_active" defaultChecked={a.is_active} /></div>
                  <SubmitButton className="btn btn-outline btn-sm !min-h-12">হালনাগাদ</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard title="নতুন অ্যাডমিন যুক্ত করুন">
          <ActionForm action={createAdminAction} resetOnSuccess className="grid gap-4 md:grid-cols-2">
            <TextInput label="নাম" name="name" required maxLength={100} />
            <TextInput label="ইমেইল" name="email" type="email" required autoComplete="off" />
            <Select label="ভূমিকা" name="role" defaultValue="moderator">
              {ADMIN_ROLES.map((r) => <option key={r} value={r}>{ADMIN_ROLE_LABELS[r]}</option>)}
            </Select>
            <TextInput label="প্রাথমিক পাসওয়ার্ড" name="password" type="password" required minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" hint={`কমপক্ষে ${toBn(PASSWORD_MIN_LENGTH)} অক্ষর।`} />
            <div className="md:col-span-2"><SubmitButton>অ্যাকাউন্ট তৈরি করুন</SubmitButton></div>
          </ActionForm>
        </AdminCard>
      </div>
    </>
  );
}
