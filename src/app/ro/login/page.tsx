import { LoginPage, authMetadata } from "@/components/auth/auth-pages";

export const metadata = authMetadata("ro", "login");

export default function Page({ searchParams }: PageProps<"/ro/login">) {
  return <LoginPage locale="ro" searchParams={searchParams} />;
}
