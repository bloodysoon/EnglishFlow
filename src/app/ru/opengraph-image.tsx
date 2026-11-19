import { ogAlt, ogSize, renderOgImage } from "@/app/_og/og-image";

export const alt = ogAlt("ru");
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage("ru");
}
