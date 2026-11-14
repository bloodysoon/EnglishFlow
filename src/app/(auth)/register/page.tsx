import { RegisterPage, authMetadata } from "@/components/auth/auth-pages";

export const metadata = authMetadata("en", "register");

export default function Page() {
  return <RegisterPage locale="en" />;
}
