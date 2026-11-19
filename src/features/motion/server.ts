import { cookies } from "next/headers";

import { MOTION_COOKIE, MOTION_PAUSED } from "./motion";

// Server only (next/headers). Read on the server so a landing the visitor
// paused never starts moving before hydration.
export async function getMotionPaused(): Promise<boolean> {
  return (await cookies()).get(MOTION_COOKIE)?.value === MOTION_PAUSED;
}
