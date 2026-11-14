import { LoginPage, authMetadata } from "@/components/auth/auth-pages";

export const metadata = authMetadata("ru", "login");

export default function Page({ searchParams }: PageProps<"/ru/login">) {
  return <LoginPage locale="ru" searchParams={searchParams} />;
}
