export default function TasksLoading() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="bg-muted h-9 w-32 animate-pulse rounded-md" />
        <div className="bg-muted h-10 w-36 animate-pulse rounded-md" />
      </div>
      <div className="grid grid-flow-col gap-3 overflow-x-auto pb-2">
        {["Backlog", "Progress", "Blocked", "Review", "Done"].map((col) => (
          <div key={col} className="flex min-w-[220px] flex-col gap-3">
            <div className="bg-muted border-border flex h-10 animate-pulse items-center rounded-md border px-2" />
            <div className="bg-muted h-24 animate-pulse rounded-lg" />
            <div className="bg-muted h-24 animate-pulse rounded-lg" />
            <div className="bg-muted h-24 animate-pulse rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
