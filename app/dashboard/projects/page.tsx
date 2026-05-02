import Link from "next/link";

import { ProjectCard } from "@/components/projects/project-card";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { listProjectsOverview } from "@/lib/projects/actions";

export const dynamic = "force-dynamic";

export default async function ProjectsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/projects");
  const rows = await listProjectsOverview(businessId);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <div>
          <p className="section-label mb-0.5">Workspace</p>
          <h1 className="text-[15px] font-semibold tracking-tight text-foreground">Projects</h1>
        </div>
        <Link
          href={`/dashboard/projects/new?businessId=${encodeURIComponent(businessId)}`}
          className={[
            "inline-flex cursor-pointer items-center rounded-md border border-primary/40 px-4 py-1.5",
            "bg-primary/90 text-[12px] font-medium text-primary-foreground shadow-sm",
            "transition-colors hover:bg-primary",
          ].join(" ")}
        >
          New project
        </Link>
      </div>

      <div className="flex-1 px-6 py-8">
        {rows.length === 0 ? (
          <div className="flex max-w-lg flex-col gap-4 rounded-xl border border-dashed border-white/[0.08] px-8 py-12 text-center">
            <p className="text-[14px] text-muted-foreground">No projects yet</p>
            <p className="text-[12px] text-muted-foreground/50">
              Create a project to attach PRDs and sprints, then tie tasks back to orchestration flows.
            </p>
            <div>
              <Link
                href={`/dashboard/projects/new?businessId=${encodeURIComponent(businessId)}`}
                className="text-[13px] text-primary underline-offset-4 hover:underline cursor-pointer"
              >
                Create your first project
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <ProjectCard key={r.id} row={r} businessId={businessId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
