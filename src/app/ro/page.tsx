import { LandingPage, landingMetadata } from "@/components/landing/landing-page";

export const metadata = landingMetadata("ro");

export default function HomeRoPage() {
  return <LandingPage locale="ro" />;
}
