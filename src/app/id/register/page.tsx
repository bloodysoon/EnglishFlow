import { RegisterPage, authMetadata } from "@/components/auth/auth-pages";

export const metadata = authMetadata("id", "register");

export default function Page() {
  return <RegisterPage locale="id" />;
}
