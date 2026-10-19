import type { GuideContent } from "@/components/guides/GuideArticle";
import { compressPdfGuide } from "./compress-pdf";
import { mergePdfGuide } from "./merge-pdf";
import { splitPdfGuide } from "./split-pdf";

/** Article bodies, keyed by the slugs in `src/lib/guides.ts`. */
export const GUIDE_CONTENT: Record<string, GuideContent> = {
  "how-to-merge-pdf-files": mergePdfGuide,
  "how-to-compress-a-pdf": compressPdfGuide,
  "how-to-split-a-pdf": splitPdfGuide,
};
