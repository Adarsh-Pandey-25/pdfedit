import type { Metadata } from "next";
import dynamic from "next/dynamic";
import {
  Upload,
  Pencil,
  Download,
  Shield,
  Zap,
  Gift,
  UserX,
  MonitorSmartphone,
  Smartphone,
} from "lucide-react";
import { HeroSection } from "@/components/home/HeroSection";
import { ToolsGrid } from "@/components/home/ToolsGrid";
import { FAQSchema } from "@/components/seo/StructuredData";
import { createMetadata } from "@/lib/seo";
import { HOME_FAQS } from "@/lib/seo-content";

export const metadata: Metadata = {
  ...createMetadata({
    description:
      "Free online PDF editor with 15+ tools. Edit text, merge, split, compress, convert, sign, and watermark PDFs. No signup — files never leave your browser.",
    path: "/",
    keywords: [
      "free online pdf editor",
      "edit pdf online",
      "pdf tools",
      "merge split compress pdf",
    ],
  }),
  title: {
    absolute: "PDFForge - Free Online PDF Editor | Merge, Split, Convert",
  },
};

const HomeBelowFold = dynamic(() => import("@/components/home/HomeBelowFold"), {
  loading: () => (
    <div className="container-max section-pad py-16" aria-hidden>
      <div className="skeleton h-64 w-full rounded-3xl" />
    </div>
  ),
});

const features = [
  { icon: Gift, title: "Free", desc: "All tools free forever — no hidden fees." },
  { icon: Shield, title: "Secure", desc: "Files never leave your browser." },
  { icon: Zap, title: "Fast", desc: "Instant processing with no upload wait." },
  { icon: UserX, title: "No Signup", desc: "Start editing immediately." },
  { icon: MonitorSmartphone, title: "Browser-based", desc: "Works on any modern browser." },
  { icon: Smartphone, title: "Mobile Friendly", desc: "Fully responsive on phones & tablets." },
];

const steps = [
  { icon: Upload, title: "Upload", desc: "Drop your PDF or document — stays on your device." },
  { icon: Pencil, title: "Edit", desc: "Use the tool you need: merge, split, sign, and more." },
  { icon: Download, title: "Download", desc: "Save your result instantly. Done." },
];

export default function HomePage() {
  return (
    <>
      <FAQSchema faqs={HOME_FAQS} />
      <HeroSection />

      <section
        id="tools"
        aria-labelledby="tools-heading"
        className="container-max section-pad py-8 sm:py-12 md:py-16 lg:py-20"
      >
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2
            id="tools-heading"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
          >
            All PDF tools
          </h2>
          <p className="mt-2 text-sm sm:text-base text-text-secondary max-w-xl mx-auto px-2">
            Fifteen professional tools — free, fast, and private.{" "}
            <a href="/edit" className="text-primary font-medium hover:underline">
              Use our free PDF editor
            </a>
            ,{" "}
            <a href="/merge" className="text-primary font-medium hover:underline">
              merge multiple PDFs
            </a>
            , or{" "}
            <a href="/split" className="text-primary font-medium hover:underline">
              split a PDF into pages
            </a>
            .
          </p>
        </div>
        <ToolsGrid />
      </section>

      <section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        className="bg-bg-secondary/50 border-y border-primary/10 below-fold"
      >
        <div className="container-max section-pad py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2
              id="how-it-works-heading"
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              How it works
            </h2>
            <p className="mt-2 text-text-secondary">Three simple steps. Zero friction.</p>
          </div>
          <ol className="grid md:grid-cols-3 gap-6 list-none p-0 m-0">
            {steps.map((step, i) => (
              <li key={step.title} className="card-surface rounded-3xl p-6 sm:p-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-soft mb-4">
                  <step.icon className="h-7 w-7" aria-hidden />
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
                  Step {i + 1}
                </p>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="why-heading"
        className="container-max section-pad py-16 sm:py-20 below-fold"
      >
        <div className="text-center mb-10">
          <h2 id="why-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">
            Why PDFForge
          </h2>
          <p className="mt-2 text-text-secondary">Built for privacy and speed.</p>
        </div>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
          {features.map((f) => (
            <li key={f.title} className="rounded-2xl p-5 card-surface flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <f.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-bold">{f.title}</h3>
                <p className="text-sm text-text-secondary mt-0.5">{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <HomeBelowFold />
    </>
  );
}
