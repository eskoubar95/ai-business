export default function SettingsLoading() {
  return (
    <div className="mx-auto flex max-w-screen-2xl gap-8 px-6 py-6">
      <div className="bg-muted hidden w-48 shrink-0 animate-pulse rounded-lg md:block" />
      <div className="min-w-0 flex-1 space-y-6">
        <div className="bg-muted h-10 w-48 animate-pulse rounded-md" />
        <div className="bg-muted border-border h-48 animate-pulse rounded-lg border" />
        <div className="bg-muted border-border h-32 animate-pulse rounded-lg border" />
      </div>
    </div>
  );
}
