export default function SkillsLoading() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="bg-muted h-9 w-28 animate-pulse rounded-md" />
        <div className="bg-muted h-10 w-40 animate-pulse rounded-md" />
      </div>
      <div className="bg-muted border-border h-72 animate-pulse rounded-lg border" />
    </div>
  );
}
