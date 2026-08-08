export function ToolPageLoading({ label = "Loading tool…" }: { label?: string }) {
  return (
    <div className="container-max section-pad py-8 sm:py-12 animate-pulse" aria-busy="true">
      <div className="mb-6 space-y-3 max-w-xl">
        <div className="h-8 sm:h-10 w-48 sm:w-72 rounded-xl bg-primary/15" />
        <div className="h-4 w-full max-w-md rounded-lg bg-primary/10" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="h-40 rounded-2xl bg-primary/10" />
          <div className="h-24 rounded-2xl bg-primary/10" />
          <div className="h-12 rounded-xl bg-primary/15" />
        </div>
        <div className="lg:col-span-3">
          <div className="h-64 sm:h-80 rounded-2xl bg-primary/10" />
        </div>
      </div>
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-full bg-bg-card px-5 py-3 shadow-soft border border-primary/15">
        <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-text-primary whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
}

export function EditPageLoading() {
  return (
    <div className="min-h-[70vh] animate-pulse" aria-busy="true">
      <div className="border-b border-primary/10 bg-bg-card px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
        <div className="h-6 w-40 sm:w-56 rounded-lg bg-primary/15" />
        <div className="flex gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10" />
          <div className="h-9 w-24 rounded-lg bg-primary/20" />
        </div>
      </div>
      <div className="border-b border-primary/10 bg-bg-card px-2 py-2 flex gap-1 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-12 w-14 shrink-0 rounded-lg bg-primary/10" />
        ))}
      </div>
      <div className="p-4 sm:p-6">
        <div className="mx-auto max-w-3xl h-[50vh] rounded-xl bg-primary/10" />
      </div>
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-full bg-bg-card px-5 py-3 shadow-soft border border-primary/15">
        <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-text-primary">
          Loading PDF editor…
        </span>
      </div>
    </div>
  );
}
