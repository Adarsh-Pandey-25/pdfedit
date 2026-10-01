import Image from "next/image";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Intrinsic size of the trimmed wordmark files in /public. */
const WORDMARK_W = 1011;
const WORDMARK_H = 397;

interface BrandLogoProps {
  /** Rendered height of the wordmark; width follows the 2.55:1 aspect ratio. */
  className?: string;
  priority?: boolean;
}

/**
 * Full PdfEdit+ wordmark. Both variants are rendered and swapped with CSS so the
 * correct one paints on first frame — `useTheme()` would flash the wrong logo
 * until hydration. `dark:` maps to `[data-theme="dark"]` (see tailwind.config.ts).
 */
export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <>
      <Image
        src="/logo-light.png"
        alt={SITE_NAME}
        width={WORDMARK_W}
        height={WORDMARK_H}
        priority={priority}
        className={cn("w-auto dark:hidden", className)}
      />
      <Image
        src="/logo-dark.png"
        alt=""
        aria-hidden
        width={WORDMARK_W}
        height={WORDMARK_H}
        priority={priority}
        className={cn("hidden w-auto dark:block", className)}
      />
    </>
  );
}

/** Square app icon — identical in both themes, so no variant swap needed. */
export function BrandMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo-mark.png"
      alt={SITE_NAME}
      width={512}
      height={512}
      priority={priority}
      className={cn("rounded-[22%]", className)}
    />
  );
}
