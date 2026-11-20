import { LandingPage, landingMetadata } from "@/components/landing/landing-page";

export const metadata = landingMetadata("id");

export default function HomeIdPage() {
  return <LandingPage locale="id" />;
}
