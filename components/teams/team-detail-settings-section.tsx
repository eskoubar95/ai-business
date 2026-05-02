"use client";

import { useState, useTransition } from "react";
import { Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamSettingsSectionProps } from "@/components/teams/team-detail-types";
import { CustomSelect } from "@/components/ui/custom-select";
import { PrimaryButton } from "@/components/ui/primary-button";
import { updateTeamName, setTeamLead, deleteTeam } from "@/lib/teams/actions";

export function TeamSettingsSection({
  team,
  businessAgents,
  onSaved,
  onDeleted,
}: TeamSettingsSectionProps) {
  const [name, setName] = useState(team.name);
  const [leadId, setLeadId] = useState(team.leadAgentId);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const agentOptions = businessAgents.map((a) => ({
    id: a.id,
    label: a.name,
    description: a.role,
  }));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        if (name.trim() !== team.name) {
          await updateTeamName(team.id, name.trim());
        }
        if (leadId !== team.leadAgentId) {
          await setTeamLead(team.id, leadId);
        }
        showToast("Team updated");
        onSaved();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    startTransition(async () => {
      try {
        await deleteTeam(team.id);
        onDeleted();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to delete");
        setDeleteConfirm(false);
      }
    });
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      {toast && (
        <div className="rounded-md border border-border bg-card px-4 py-2.5 text-[13px] text-foreground">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <p className="section-label">General</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] text-muted-foreground" htmlFor="team-name">
            Team name
          </label>
          <input
            id="team-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 hover:border-white/[0.14] focus:border-white/[0.20]"
            placeholder="Enter team name…"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] text-muted-foreground" htmlFor="team-lead">
            Lead agent
          </label>
          <CustomSelect
            id="team-lead"
            value={leadId}
            onChange={setLeadId}
            options={agentOptions}
            placeholder="Select lead agent…"
          />
          <p className="text-[11px] text-muted-foreground">
            The lead agent must already be a team member.
          </p>
        </div>

        <PrimaryButton
          onClick={handleSave}
          disabled={isPending}
          loading={isPending}
          icon={Save}
          size="md"
        >
          {isPending ? "Saving…" : "Save changes"}
        </PrimaryButton>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-red-500/20 p-4">
        <p className="section-label text-red-400/80">Danger Zone</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-foreground">Delete this team</p>
            <p className="text-[12px] text-muted-foreground">
              Permanently remove this team. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] transition-colors disabled:opacity-50",
              deleteConfirm
                ? "border-red-500/60 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "border-border text-muted-foreground hover:border-red-500/40 hover:text-red-400",
            )}
          >
            <Trash2 className="size-3.5" />
            {deleteConfirm ? "Confirm delete" : "Delete team"}
          </button>
        </div>
      </div>
    </div>
  );
}
