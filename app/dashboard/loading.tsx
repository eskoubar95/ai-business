export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-8 px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="bg-muted h-9 w-40 animate-pulse rounded-md" />
        <div className="bg-muted h-10 w-32 animate-pulse rounded-md" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {["a", "b", "c", "d"].map((k) => (
          <div key={k} className="bg-muted border-border h-28 animate-pulse rounded-lg border" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-muted border-border h-64 animate-pulse rounded-lg border" />
        <div className="bg-muted border-border h-64 animate-pulse rounded-lg border" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["e", "f", "g"].map((k) => (
          <div key={k} className="bg-muted border-border h-36 animate-pulse rounded-lg border" />
        ))}
      </div>
    </div>
  );
}
