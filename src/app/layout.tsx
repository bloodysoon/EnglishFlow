import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// One variable family for the whole app: normal width for reading,
// expanded width (wdth axis) for the display voice. See globals.css.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: {
    default: "EnglishFlow · Learn words. Remember forever.",
    template: "%s · EnglishFlow",
  },
  description:
    "Learn English vocabulary with spaced repetition and the Leitner system. Practice a little every day.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
