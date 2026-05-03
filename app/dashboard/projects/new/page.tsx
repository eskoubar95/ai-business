import { ProjectCreateForm } from "@/components/projects/project-form";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";

export const dynamic = "force-dynamic";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/projects");

  return (
    <div className="min-h-full bg-background">
      <ProjectCreateForm businessId={businessId} />
    </div>
  );
}
