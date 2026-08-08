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
  title: "Terms of Service",
  description: `Terms of Service for ${SITE_NAME} — free browser-based PDF tools. Files are processed locally on your device.`,
  path: "/terms",
  keywords: ["terms of service", "pdf tools terms", "pdfforge terms"],
});

const LAST_UPDATED = "August 6, 2026";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description={`These terms govern your use of ${SITE_NAME}, a free set of PDF tools that run in your browser.`}
      lastUpdated={LAST_UPDATED}
    >
      <LegalSection title="1. Acceptance">
        <p>
          By accessing or using {SITE_NAME} at {SITE_URL}, you agree to these
          Terms of Service. If you do not agree, please do not use the site.
        </p>
        <p>
          These terms are an informational agreement for a free consumer web
          app. They are not a substitute for professional legal advice.
        </p>
      </LegalSection>

      <LegalSection title="2. The service">
        <p>
          {SITE_NAME} offers browser-based tools to work with PDF and related
          files, including (without limitation) merge, split, compress, rotate,
          watermark, page numbers, view, edit, protect, unlock, sign, extract
          text, and convert between formats such as images, Word, and text.
        </p>
        <LegalList
          items={[
            "Processing runs locally in your browser — we do not operate a document-upload backend for these tools.",
            "No account is required to use the core tools.",
            "Features and availability may change as we improve the product.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Your responsibilities">
        <p>You agree that you will:</p>
        <LegalList
          items={[
            "Use the tools only for lawful purposes and in compliance with applicable laws.",
            "Only process files you have the right to access and modify.",
            "Not attempt to disrupt, reverse-engineer for abuse, or overload the site’s delivery infrastructure.",
            "Not use the service to distribute malware or to harm others.",
          ]}
        />
        <p>
          You remain solely responsible for the content of documents you open
          and for any exports you download or share.
        </p>
      </LegalSection>

      <LegalSection title="4. Intellectual property">
        <p>
          The {SITE_NAME} name, logo, site design, and software that make up the
          web application are owned by {SITE_NAME} or its licensors. Your use of
          the site does not transfer ownership of those materials to you.
        </p>
        <p>
          You retain all rights to the documents and other files you process
          with the tools. We claim no ownership over your content.
        </p>
      </LegalSection>

      <LegalSection title="5. No warranties">
        <p>
          {SITE_NAME} is provided <strong className="text-text-primary">“as is”</strong> and{" "}
          <strong className="text-text-primary">“as available”</strong> without
          warranties of any kind, whether express or implied, including
          merchantability, fitness for a particular purpose, and
          non-infringement.
        </p>
        <p>
          PDF editing and conversion are complex. We do not guarantee that
          every file will open, that layouts will be preserved perfectly, that
          watermarks or edits will match every viewer, or that protected /
          encrypted PDFs will unlock in every case.
        </p>
      </LegalSection>

      <LegalSection title="6. Limitation of liability">
        <p>
          To the fullest extent permitted by law, {SITE_NAME} and its operators
          will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or for any loss of data, profits,
          or business arising from your use of (or inability to use) the
          service — including issues caused by browser limits, corrupted files,
          or third-party libraries.
        </p>
        <p>
          Always keep your own backups of important documents before processing
          them.
        </p>
      </LegalSection>

      <LegalSection title="7. Privacy">
        <p>
          How we handle privacy — including local processing and on-device
          storage — is described in our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          . By using {SITE_NAME}, you also acknowledge that policy.
        </p>
      </LegalSection>

      <LegalSection title="8. Third-party resources">
        <p>
          The site may load scripts, fonts, or workers from third-party CDNs so
          that tools can run in the browser. Those providers have their own
          terms. Your documents are not uploaded to {SITE_NAME} as part of the
          standard tool workflow.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes">
        <p>
          We may update these Terms from time to time. The &quot;Last
          updated&quot; date at the top of this page shows when they were last
          revised. Continued use after changes constitutes acceptance of the
          updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Questions about these Terms:{" "}
          <a
            href="mailto:hello@pdfforge.app"
            className="text-primary hover:underline"
          >
            hello@pdfforge.app
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
