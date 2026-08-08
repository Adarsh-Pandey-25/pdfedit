"use client";

import Link from "next/link";
import { FileStack, Share2, Globe, Mail, X } from "lucide-react";
import { SITE_NAME, TOOLS } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-primary/10 bg-bg-secondary/40">
      <div className="container-max section-pad py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <FileStack className="h-5 w-5" />
              </span>
              PDF<span className="text-primary">Forge</span>
            </Link>
            <p className="text-sm text-text-secondary max-w-xs">
              Free browser-based PDF tools. Your files stay private — processed
              entirely on your device.
            </p>
            <div className="flex gap-3">
              {[
                { icon: X, label: "X", href: "#" },
                { icon: Share2, label: "Share", href: "#" },
                { icon: Globe, label: "Website", href: "#" },
                { icon: Mail, label: "Email", href: "mailto:hello@pdfforge.app" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-card text-text-secondary hover:text-primary hover:shadow-soft transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-text-primary">Popular tools</h3>
            <ul className="space-y-2">
              {TOOLS.slice(0, 6).map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={tool.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-text-primary">More tools</h3>
            <ul className="space-y-2">
              {TOOLS.slice(6, 12).map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={tool.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-text-primary">Stay updated</h3>
            <p className="text-sm text-text-secondary mb-3">
              Product tips & new tools — no spam.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="newsletter" className="sr-only">
                Email
              </label>
              <input
                id="newsletter"
                type="email"
                placeholder="you@email.com"
                className="h-11 flex-1 rounded-xl border border-primary/20 bg-bg-card px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="h-11 rounded-xl bg-primary hover:bg-primary-dark text-white px-4 text-sm whitespace-nowrap transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-text-secondary">
          <p>
            © {year} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/#faq" className="hover:text-primary">
              FAQ
            </Link>
            <span>Files never leave your browser</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
