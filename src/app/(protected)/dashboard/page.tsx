import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Welcome to EnglishFlow!</h1>

      <p className="mt-4">You are successfully authenticated.</p>

      <p className="mt-2 text-gray-500">Email: {user.email}</p>
    </main>
  );
}
