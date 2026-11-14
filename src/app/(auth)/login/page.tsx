import { LoginPage, authMetadata } from "@/components/auth/auth-pages";

export const metadata = authMetadata("en", "login");

export default function Page({ searchParams }: PageProps<"/login">) {
  return <LoginPage locale="en" searchParams={searchParams} />;
}
