"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Try again — if this keeps repeating, check Sentry if monitoring is configured.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
