import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-max section-pad py-24 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-text-secondary">That tool or page doesn&apos;t exist.</p>
      <Button asChild className="mt-6">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
