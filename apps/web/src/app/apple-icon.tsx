import { appIcon } from "@/lib/appIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The home screen icon on iPhones and iPads, which round the corners themselves. */
export default function AppleIcon() {
  return appIcon(180, { bleed: true });
}
