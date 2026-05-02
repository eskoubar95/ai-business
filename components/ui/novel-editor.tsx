import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

const NovelEditorClient = dynamic(
  () =>
    import("./novel-editor-client").then((mod) => ({ default: mod.NovelEditorClient })),
  {
    ssr: false,
    loading: () => (
      <div
        className={cn(
          "border-border bg-muted flex min-h-[200px] animate-pulse items-center justify-center rounded-md border text-sm text-transparent",
        )}
      >
        Loading editor…
      </div>
    ),
  },
);

export function NovelEditor({
  initialContent,
  className,
}: {
  initialContent?: string;
  className?: string;
}) {
  return <NovelEditorClient initialContent={initialContent} className={className} />;
}
