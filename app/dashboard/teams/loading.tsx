export default function TeamsLoading() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="bg-muted h-9 w-28 animate-pulse rounded-md" />
        <div className="flex gap-2">
          <div className="bg-muted h-9 w-24 animate-pulse rounded-md" />
          <div className="bg-muted h-10 w-32 animate-pulse rounded-md" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["a", "b", "c", "d", "e"].map((k) => (
          <div key={k} className="bg-muted border-border h-40 animate-pulse rounded-lg border" />
        ))}
      </div>
    </div>
  );
}
