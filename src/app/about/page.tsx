import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Zap, Sparkles, Globe, Mail } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getTool, SITE_EMAIL, SITE_NAME, TOOLS, type ToolSlug } from "@/lib/constants";

export const metadata: Metadata = createMetadata({
  title: "About Us",
  description: `${SITE_NAME} is a free, privacy-first PDF toolkit that runs entirely in your browser — no uploads, no signups, no cost.`,
  path: "/about",
  keywords: ["about pdfedit+", "about us", "privacy-first pdf editor"],
});

const PRINCIPLES = [
  {
    icon: Shield,
    title: "Privacy by design",
    text: "Every tool runs on-device using libraries like pdf-lib and PDF.js. We don't operate a document-upload backend for these tools.",
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Sparkles,
    title: "Free, no account",
    text: "No signup, no watermark, no paywall. We'd rather you leave with a finished file than a login form.",
    accent: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    icon: Zap,
    title: "No upload wait",
    text: "Your file is processed where it already is, so there's no upload or download of the document itself. How long a task takes depends on the file and your device.",
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    icon: Globe,
    title: "Works in your browser",
    text: "A modern browser and an internet connection to load the tools are all you need — no installs or plugins.",
    accent: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
] as const;

const STATS = [
  { value: `${TOOLS.length}`, label: "PDF tools" },
  { value: "$0", label: "Cost to use" },
  { value: "0", label: "Files uploaded to a server" },
] as const;

/** A few tools to start with; the homepage lists them all. */
const FEATURED_TOOLS: ToolSlug[] = [
  "edit",
  "compress",
  "image-to-pdf",
  "word-to-pdf",
  "text-to-pdf",
];

export default function AboutPage() {
  return (
    <div className="bg-bg-primary">
      <div className="container-max section-pad pt-6 sm:pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      {/* Hero */}
      <section className="container-max section-pad pt-6 pb-14 sm:pt-8 sm:pb-16 md:pb-20 text-center">
        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold tracking-wide uppercase mb-4 anim-fade-up">
          About {SITE_NAME}
        </span>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance max-w-3xl mx-auto text-text-primary leading-tight anim-fade-up">
          PDF tools that stay out of your way — and off our servers
        </h1>

        <p
          className="mt-5 text-text-secondary text-base sm:text-lg max-w-2xl mx-auto leading-relaxed anim-fade-up"
          style={{ animationDelay: "0.05s" }}
        >
          {SITE_NAME} is a free set of PDF tools that runs in your web
          browser. You can edit, merge, split, compress, convert, sign, and
          password-protect PDFs without creating an account. The tools
          process files on your device, so the documents you open are not
          uploaded to our servers.
        </p>

        <div
          className="mt-9 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 anim-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary">
                {s.value}
              </span>
              <span className="mt-0.5 text-xs sm:text-sm text-text-secondary">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* What we stand for */}
      <section
        aria-labelledby="principles-heading"
        className="bg-bg-secondary/60 border-y border-primary/10"
      >
        <div className="container-max section-pad py-14 sm:py-20">
          <div className="text-center mb-10">
            <h2
              id="principles-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-text-primary"
            >
              What we stand for
            </h2>
            <p className="mt-2 text-text-secondary">
              The four ideas every tool here is built around.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {PRINCIPLES.map(({ icon: Icon, title, text, accent }) => (
              <div
                key={title}
                className="card-surface rounded-2xl sm:rounded-3xl p-6 hover:-translate-y-0.5 hover:shadow-soft transition-all duration-200"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 ${accent}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="font-semibold text-text-primary mb-1.5">
                  {title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where to start */}
      <section
        aria-labelledby="tools-heading"
        className="container-max section-pad pt-14 sm:pt-20"
      >
        <div className="text-center mb-8">
          <h2
            id="tools-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-text-primary"
          >
            What you can do with {SITE_NAME}
          </h2>
          <p className="mt-2 text-text-secondary">
            A few places to start. The{" "}
            <Link href="/#tools" className="text-primary hover:underline">
              full list of {TOOLS.length} tools
            </Link>{" "}
            is on the homepage.
          </p>
        </div>
        <ul className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURED_TOOLS.map((slug) => getTool(slug))
            .filter((tool) => tool !== undefined)
            .map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={tool.href}
                  className="card-surface rounded-2xl p-4 block h-full hover:border-primary/40 transition-colors"
                >
                  <span className="font-semibold text-text-primary">
                    {tool.title}
                  </span>
                  <span className="mt-1 block text-sm text-text-secondary">
                    {tool.description}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="container-max section-pad py-14 sm:py-20">
        <div className="text-center mb-5">
          <h2
            id="how-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-text-primary"
          >
            How it actually works
          </h2>
        </div>
        <p className="max-w-2xl mx-auto text-center text-text-secondary text-sm sm:text-base leading-relaxed">
          There&apos;s no magic — and no server doing the heavy lifting. Tools
          are built on open-source libraries (pdf-lib, PDF.js, and others)
          that run directly in your browser as JavaScript. When
          you merge two files or add a watermark, that
          computation happens on your machine, in memory, for the duration of
          the task. Read the full breakdown in our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        {/* CTA */}
        <div className="mt-12 sm:mt-16 max-w-3xl mx-auto rounded-3xl bg-primary p-8 sm:p-10 text-white text-center shadow-soft">
          <Mail className="mx-auto h-9 w-9 mb-3" aria-hidden />
          <h3 className="text-xl sm:text-2xl font-bold">
            Questions, feedback, or a tool you wish existed?
          </h3>
          <p className="mt-2 max-w-xl mx-auto text-white/90 text-sm sm:text-base">
            Email us with questions, feedback, or a problem you ran into
            while using {SITE_NAME}.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-soft hover:bg-white/90 transition-colors"
            >
              Email us
            </a>
            <Link
              href="/#tools"
              className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Explore tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
