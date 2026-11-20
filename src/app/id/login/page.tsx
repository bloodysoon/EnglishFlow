import { LoginPage, authMetadata } from "@/components/auth/auth-pages";

export const metadata = authMetadata("id", "login");

export default function Page({ searchParams }: PageProps<"/id/login">) {
  return <LoginPage locale="id" searchParams={searchParams} />;
}
