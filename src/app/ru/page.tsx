import { LandingPage, landingMetadata } from "@/components/landing/landing-page";

export const metadata = landingMetadata("ru");

export default function HomeRuPage() {
  return <LandingPage locale="ru" />;
}
