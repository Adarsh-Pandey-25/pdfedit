import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  breadcrumbs?: { label: string; href?: string }[];
};

export function PageHeader({
  title,
  description,
  icon: Icon,
  breadcrumbs = [{ label: "Home", href: "/" }, { label: "Tools", href: "/#tools" }],
}: PageHeaderProps) {
  return (
    <div className="mb-4">
      <nav
        aria-label="Breadcrumb"
        className="mb-2.5 flex flex-wrap items-center gap-1 text-sm text-text-secondary"
      >
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.label} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-primary transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-text-primary font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
        <span className="text-text-primary font-medium">{title}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {Icon && (
          <span className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary shadow-soft">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm sm:text-base text-text-secondary max-w-2xl px-0 sm:px-0">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function BackToTools() {
  return (
    <Link
      href="/#tools"
      className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors mb-6"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to all tools
    </Link>
  );
}
