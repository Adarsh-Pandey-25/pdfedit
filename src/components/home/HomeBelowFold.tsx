"use client";

import Link from "next/link";
import { Star, Shield } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HOME_FAQS } from "@/lib/seo-content";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Freelance designer",
    text: "PDFForge replaced three paid apps for me. Merge and compress are blisteringly fast — and I love that nothing uploads.",
  },
  {
    name: "Marcus Chen",
    role: "Operations lead",
    text: "Our team uses the watermark and page-number tools daily. Clean UI, zero lag, and works great on tablets.",
  },
  {
    name: "Elena Rossi",
    role: "Law student",
    text: "Signing and protecting PDFs without creating an account is a game changer for confidential coursework.",
  },
];

export default function HomeBelowFold() {
  return (
    <>
      <section
        aria-labelledby="testimonials-heading"
        className="bg-bg-secondary/60 border-y border-primary/10 below-fold"
      >
        <div className="container-max section-pad py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2
              id="testimonials-heading"
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Loved by thousands
            </h2>
            <p className="mt-2 text-text-secondary">What people say about PDFForge.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <blockquote key={t.name} className="card-surface rounded-3xl p-6">
                <div className="flex gap-0.5 text-accent mb-3" aria-label="5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
                  ))}
                </div>
                <p className="text-sm text-text-primary leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <footer className="mt-4">
                  <cite className="not-italic font-semibold text-sm">{t.name}</cite>
                  <p className="text-xs text-text-secondary">{t.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="container-max section-pad py-16 sm:py-20 below-fold"
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 id="faq-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-text-secondary">Quick answers to common questions.</p>
          </div>
          <Accordion
            type="single"
            collapsible
            className="card-surface rounded-3xl px-5 sm:px-6"
          >
            {HOME_FAQS.map((faq, i) => (
              <AccordionItem key={faq.q} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section
        id="privacy"
        aria-labelledby="privacy-heading"
        className="container-max section-pad pb-16 below-fold"
      >
        <div className="rounded-3xl bg-primary p-8 sm:p-10 text-white text-center shadow-soft">
          <Shield className="mx-auto h-10 w-10 mb-3" aria-hidden />
          <h2 id="privacy-heading" className="text-2xl font-bold">
            Your privacy is the product
          </h2>
          <p className="mt-2 max-w-xl mx-auto text-white/90 text-sm sm:text-base">
            We don&apos;t store, scan, or transmit your documents. Everything
            runs locally with pdf-lib, PDF.js, and related libraries in your
            browser.
          </p>
          <Link
            href="/privacy"
            className="inline-flex mt-5 text-sm font-medium text-white underline underline-offset-4 hover:text-white/90"
          >
            Read the full Privacy Policy
          </Link>
        </div>
      </section>
    </>
  );
}
