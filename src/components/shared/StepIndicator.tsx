import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  steps: string[];
  current: number;
};

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 sm:gap-4" aria-label="Progress">
      {steps.map((step, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                active && "bg-primary text-white shadow-soft",
                done && "bg-emerald-500 text-white",
                !active && !done && "bg-primary/15 text-text-secondary"
              )}
              aria-current={active ? "step" : undefined}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium hidden sm:inline",
                active ? "text-text-primary" : "text-text-secondary"
              )}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <span className="hidden sm:block w-8 h-0.5 bg-primary/20 mx-1" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
