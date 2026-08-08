import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPage,
  LegalSection,
  LegalList,
} from "@/components/layout/LegalPage";
import { createMetadata } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy",
  description: `How ${SITE_NAME} handles privacy. Your PDFs are processed locally in your browser and are not uploaded to our servers.`,
  path: "/privacy",
  keywords: ["privacy policy", "pdf privacy", "local pdf processing"],
});

const LAST_UPDATED = "August 6, 2026";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description={`${SITE_NAME} is built so your documents stay on your device. This policy explains what that means in practice.`}
      lastUpdated={LAST_UPDATED}
    >
      <LegalSection title="1. Overview">
        <p>
          {SITE_NAME} ({SITE_URL}) provides free PDF tools that run in your web
          browser. When you merge, split, compress, edit, watermark, convert, or
          otherwise process a file, that work happens on your device — not on a{" "}
          {SITE_NAME} server that receives and stores your documents.
        </p>
        <p>
          We designed the product around this idea: your privacy is the product.
          We do not operate a document-upload backend for these tools.
        </p>
      </LegalSection>

      <LegalSection title="2. What we do not collect from your PDFs">
        <p>
          We do not upload, store, scan, index, or train models on the contents
          of the PDF or image files you open in {SITE_NAME}. Document bytes are
          read and processed in memory in your browser session (and, where
          features need it, briefly in browser storage on your device — see
          below).
        </p>
        <LegalList
          items={[
            "We do not require an account to use the tools.",
            "We do not keep a server-side copy of files you process.",
            "We do not sell or share your documents with third parties.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. How processing works technically">
        <p>
          Tools use client-side libraries such as pdf-lib, PDF.js, and related
          browser APIs to open, render, and modify files. Fonts and scripts that
          power the app may be loaded over the network so the site can run, but
          your document files themselves are not sent to {SITE_NAME} as part of
          the normal tool workflow.
        </p>
        <p>
          Some features load supporting assets from third-party CDNs (for
          example, a PDF.js worker script). Those requests are for code
          delivery, not for transmitting your PDFs.
        </p>
      </LegalSection>

      <LegalSection title="4. Data stored on your device">
        <p>
          Certain features may save preferences or drafts locally so the product
          is more convenient:
        </p>
        <LegalList
          items={[
            <>
              <strong className="text-text-primary">Editor session</strong> —
              the PDF editor may keep a temporary copy of your work in IndexedDB
              on your device so you can resume after a refresh.
            </>,
            <>
              <strong className="text-text-primary">Signatures</strong> — the
              sign tool may remember recent signature images in local storage on
              your device.
            </>,
            <>
              <strong className="text-text-primary">Debug flags</strong> —
              optional developer settings may be stored locally and never leave
              your browser.
            </>,
          ]}
        />
        <p>
          You can clear this data through your browser&apos;s site data /
          storage controls. Clearing site data removes those local copies from
          that browser.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies and analytics">
        <p>
          {SITE_NAME} does not use third-party advertising cookies or a
          third-party analytics suite to track you across the web. We do not
          run a marketing pixel that reports the contents of your documents.
        </p>
        <p>
          Your browser may still send standard technical requests (page loads,
          static assets) when you visit {SITE_URL}. Those requests are ordinary
          web traffic and do not include your PDF file contents.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact and support email">
        <p>
          If you email us (for example at{" "}
          <a
            href="mailto:hello@pdfforge.app"
            className="text-primary hover:underline"
          >
            hello@pdfforge.app
          </a>
          ), we receive whatever you choose to include in that message. Use
          email only for support or feedback — do not send confidential
          documents unless you intentionally mean to share them with us.
        </p>
      </LegalSection>

      <LegalSection title="7. Children">
        <p>
          {SITE_NAME} is a general-purpose utility. We do not knowingly collect
          personal information from children. If you believe a child has
          provided personal information to us through email contact, please
          reach out and we will delete it.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to this policy">
        <p>
          We may update this Privacy Policy when the product or our practices
          change. The &quot;Last updated&quot; date at the top of this page
          reflects the latest revision. Continued use of {SITE_NAME} after
          changes means you acknowledge the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="9. Related">
        <p>
          Please also read our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
