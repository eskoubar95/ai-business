import type { NotionSyncEventRow } from "@/lib/orchestration/notion-sync-queries";

type Props = {
  events: NotionSyncEventRow[];
};

export function NotionSyncTable({ events }: Props) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm" data-testid="notion-sync-empty">
        No sync runs yet. Connect Notion and run a sync.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border" data-testid="notion-sync-table">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 border-b text-xs uppercase">
          <tr>
            <th className="px-3 py-2">Synced at</th>
            <th className="px-3 py-2">Tasks</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Notion</th>
          </tr>
        </thead>
        <tbody>
          {events.flatMap((ev) =>
            ev.pages.length === 0
              ? [
                  <tr key={ev.id} className="border-b">
                    <td className="px-3 py-2">{ev.syncedAt ?? ev.createdAt.toISOString()}</td>
                    <td className="px-3 py-2">0</td>
                    <td className="px-3 py-2">{ev.status}</td>
                    <td className="px-3 py-2 text-muted-foreground">—</td>
                    <td className="px-3 py-2">—</td>
                  </tr>,
                ]
              : ev.pages.map((p, idx) => (
                  <tr key={`${ev.id}-${p.notionPageId}-${idx}`} className="border-b">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {idx === 0 ? (ev.syncedAt ?? ev.createdAt.toISOString()) : ""}
                    </td>
                    <td className="px-3 py-2">{idx === 0 ? ev.pages.length : ""}</td>
                    <td className="px-3 py-2">{idx === 0 ? ev.status : ""}</td>
                    <td className="px-3 py-2">{p.title}</td>
                    <td className="px-3 py-2">
                      <a
                        href={`https://notion.so/${p.notionPageId.replace(/-/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                )),
          )}
        </tbody>
      </table>
    </div>
  );
}
