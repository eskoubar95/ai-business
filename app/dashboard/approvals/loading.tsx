export default function ApprovalsLoading() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-6 py-6">
      <div className="bg-muted h-9 w-44 animate-pulse rounded-md" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {["Pending", "Approved", "Rejected"].map((col) => (
          <div key={col} className="flex flex-col gap-3">
            <div className="bg-muted border-border h-10 animate-pulse rounded-md border" />
            <div className="bg-muted h-32 animate-pulse rounded-lg" />
            <div className="bg-muted h-32 animate-pulse rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
