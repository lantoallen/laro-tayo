import { appIcon } from "@/lib/appIcon";

/** For phones that cut icons into their own shape, so it fills the whole square. */
export function GET() {
  return appIcon(512, { bleed: true });
}
