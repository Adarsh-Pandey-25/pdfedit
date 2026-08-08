import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type LegalPageProps = {
  title: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalPage({
  title,
  description,
  lastUpdated,
  children,
}: LegalPageProps) {
  return (
    <div className="container-max section-pad py-8 sm:py-12 min-h-[70vh]">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <header className="max-w-3xl mb-10">
        <p className="text-sm font-medium text-primary mb-2">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-text-secondary text-base sm:text-lg max-w-2xl">
          {description}
        </p>
        <p className="mt-4 text-xs text-text-secondary">
          Last updated: {lastUpdated}
        </p>
        <div className="mt-6 h-px bg-primary/10" />
      </header>

      <article className="max-w-3xl space-y-8 text-text-secondary text-sm sm:text-[15px] leading-relaxed">
        {children}
      </article>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-2">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
