import { RegisterPage, authMetadata } from "@/components/auth/auth-pages";

export const metadata = authMetadata("ro", "register");

export default function Page() {
  return <RegisterPage locale="ro" />;
}
