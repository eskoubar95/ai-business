import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectDetailTabs } from "@/components/projects/project-detail-tabs";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { getProjectBundle } from "@/lib/projects/actions";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ businessId?: string }>;
}) {
  const { projectId } = await params;
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/projects");

  let bundle;
  try {
    bundle = await getProjectBundle(projectId);
  } catch {
    notFound();
  }
  if (bundle.project.businessId !== businessId) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <nav className="flex items-center gap-2 text-[13px]" aria-label="Breadcrumb">
          <Link
            href={`/dashboard/projects?businessId=${encodeURIComponent(businessId)}`}
            className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          >
            Projects
          </Link>
          <span className="text-white/20">/</span>
          <span className="font-medium text-foreground">{bundle.project.name}</span>
        </nav>
      </div>

      <ProjectDetailTabs
        businessId={businessId}
        project={bundle.project}
        tasks={bundle.tasks}
        approvalsRows={bundle.approvals}
      />
    </div>
  );
}
