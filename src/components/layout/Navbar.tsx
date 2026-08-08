"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, X, FileStack, Shield } from "lucide-react";
import { TOOLS, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/#tools", label: "Tools" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ticking = useRef(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 8);
      ticking.current = false;
    };
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const toggleTheme = useCallback(() => {
    setTheme(
      mounted && (resolvedTheme === "dark" || theme === "dark") ? "light" : "dark"
    );
  }, [mounted, resolvedTheme, theme, setTheme]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full gpu transition-[background-color,box-shadow] duration-200",
        scrolled
          ? "bg-bg-primary/90 backdrop-blur-md shadow-soft border-b border-primary/10"
          : "bg-bg-primary"
      )}
    >
      <div className="container-max section-pad flex h-14 sm:h-16 items-center justify-between gap-3 sm:gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-base sm:text-lg tracking-tight text-text-primary shrink-0"
          aria-label={`${SITE_NAME} home`}
        >
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
            <FileStack className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </span>
          <span>
            PDF<span className="text-primary">Forge</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2.5 lg:px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="relative group ml-0.5">
            <button
              type="button"
              className="rounded-lg px-2.5 lg:px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
              aria-haspopup="true"
            >
              All tools
            </button>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity absolute left-0 top-full pt-2 w-72 z-50">
              <div className="card-surface rounded-2xl p-2 max-h-80 overflow-y-auto grid gap-0.5">
                {TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.slug}
                      href={tool.href}
                      prefetch
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-primary hover:bg-primary/10"
                    >
                      <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                      {tool.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 sm:px-3 py-1 text-xs font-medium">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden md:inline">Local processing</span>
            <span className="md:hidden">Local</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            {mounted ? (
              isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )
            ) : (
              <span className="h-5 w-5" aria-hidden />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-[44px] min-w-[44px]"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-primary/10 bg-bg-primary">
          <nav className="container-max section-pad py-4 flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-sm font-medium text-text-primary hover:bg-primary/10 min-h-[44px] flex items-center"
              >
                {link.label}
              </Link>
            ))}
            <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Tools
            </p>
            <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto">
              {TOOLS.map((tool) => (
                <Link
                  key={tool.slug}
                  href={tool.href}
                  prefetch
                  className="rounded-xl px-3 py-2.5 text-sm text-text-primary hover:bg-primary/10 min-h-[44px] flex items-center"
                >
                  {tool.shortTitle}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
