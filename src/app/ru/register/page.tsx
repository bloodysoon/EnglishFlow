import { RegisterPage, authMetadata } from "@/components/auth/auth-pages";

export const metadata = authMetadata("ru", "register");

export default function Page() {
  return <RegisterPage locale="ru" />;
}
