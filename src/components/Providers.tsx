"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          className: "text-sm font-medium",
          style: {
            borderRadius: "12px",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid rgba(249,115,22,0.2)",
          },
          success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
        }}
      />
    </NextThemesProvider>
  );
}
