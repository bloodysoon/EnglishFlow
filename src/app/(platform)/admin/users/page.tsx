import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdmin } from "@/features/admin/server";
import { listUsers } from "@/features/admin/users";
import { learnerLevel } from "@/features/leitner/xp";

export const metadata: Metadata = { title: "Users" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const formatDate = (value: string | null) => (value ? dateFormat.format(new Date(value)) : "—");

export default async function AdminUsersPage() {
  const admin = await getAdmin();
  if (!admin) notFound();

  const users = await listUsers(admin.supabase);

  return (
    <section aria-labelledby="users-title" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="users-title" className="text-xl font-black uppercase">
          Learners <span className="text-muted">({users.length})</span>
        </h2>
        <p className="text-sm font-semibold text-muted">
          Read-only. Roles are set in Supabase (app_metadata.role).
        </p>
      </div>

      <div className="overflow-x-auto border-[3px] border-line bg-surface shadow-brutal">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b-[3px] border-line bg-raised">
            <tr>
              {["Email", "Joined", "Last sign-in", "Words", "XP", "Level", "Translations", "Goal"].map((heading) => (
                <th key={heading} scope="col" className="px-4 py-3 font-black uppercase">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b-2 border-line last:border-b-0">
                <th scope="row" className="px-4 py-3 font-bold">
                  <span className="block max-w-[260px] truncate" title={user.email}>
                    {user.email}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {user.isAdmin && (
                      <span className="border-[2px] border-line bg-chip px-1.5 text-[10px] font-black text-on-box uppercase">Admin</span>
                    )}
                    {!user.confirmed && (
                      <span className="border-[2px] border-line bg-box-1 px-1.5 text-[10px] font-black text-on-box uppercase">
                        Unconfirmed
                      </span>
                    )}
                  </span>
                </th>
                <td className="px-4 py-3 font-semibold">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3 font-semibold">{formatDate(user.lastSignInAt)}</td>
                <td className="px-4 py-3 font-semibold">{user.wordCount}</td>
                <td className="px-4 py-3 font-semibold">{user.xpTotal.toLocaleString("en-GB")}</td>
                <td className="px-4 py-3 font-semibold">{learnerLevel(user.xpTotal).level}</td>
                <td className="px-4 py-3 font-semibold uppercase">{user.translationLanguage ?? "—"}</td>
                <td className="px-4 py-3 font-semibold">{user.dailyGoal ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
