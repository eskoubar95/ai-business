export default function AgentsLoading() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-8 px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-36 animate-pulse rounded-md" />
          <div className="bg-muted h-4 w-56 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-10 w-32 animate-pulse rounded-md" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-2">
        {["a", "b", "c"].map((k) => (
          <div key={k} className="bg-muted h-40 w-64 shrink-0 animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="bg-muted border-border h-12 animate-pulse rounded-md border" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {["d", "e", "f", "g", "h"].map((k) => (
          <div key={k} className="bg-muted border-border h-36 animate-pulse rounded-lg border" />
        ))}
      </div>
    </div>
  );
}
