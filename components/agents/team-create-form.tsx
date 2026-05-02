"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Crown, Users } from "lucide-react";

import { CustomSelect } from "@/components/ui/custom-select";
import { addTeamMember, createTeam } from "@/lib/teams/actions";
import type { agents } from "@/db/schema";
import { cn } from "@/lib/utils";

type Peer = Pick<typeof agents.$inferSelect, "id" | "name">;

function AgentMonogram({ name }: { name: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.07] font-mono text-[10px] font-semibold text-foreground/50">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function TeamCreateForm({
  businessId,
  agents: agentOptions,
}: {
  businessId: string;
  agents: Peer[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [leadId, setLeadId] = useState(agentOptions[0]?.id ?? "");
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());

  // Members = all agents except the selected lead
  const memberCandidates = agentOptions.filter((a) => a.id !== leadId);

  function toggleMember(id: string) {
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleLeadChange(id: string) {
    setLeadId(id);
    // Remove new lead from member selection if present
    setMemberIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    const nm = name.trim();
    if (!nm) { setError("Team name is required"); return; }
    if (!leadId) { setError("Select a lead agent"); return; }

    startTransition(async () => {
      try {
        const team = await createTeam({ businessId, name: nm, leadAgentId: leadId });
        for (const mid of memberIds) {
          await addTeamMember(team.id, mid);
        }
        toast.success("Team created.");
        router.push(`/dashboard/teams/${team.id}?businessId=${encodeURIComponent(businessId)}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Create failed");
      }
    });
  }

  const noAgents = agentOptions.length === 0;

  return (
    <div className="flex max-w-md flex-col gap-5">

      {/* Team name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="team-name" className="section-label">Team name</label>
        <input
          id="team-name"
          data-testid="team-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Frontend Squad"
          className={cn(
            "h-9 w-full rounded-md border border-border bg-transparent",
            "px-3 text-[13px] text-foreground placeholder:text-muted-foreground/30",
            "outline-none transition-colors focus:border-white/[0.18]",
          )}
        />
      </div>

      {/* Lead agent */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="team-lead" className="section-label">Lead agent</label>
        {noAgents ? (
          <p className="text-[12px] text-muted-foreground/50">
            No agents found. Create agents first.
          </p>
        ) : (
          <CustomSelect
            id="team-lead"
            data-testid="team-lead"
            value={leadId}
            onChange={handleLeadChange}
            options={agentOptions.map((a) => ({ id: a.id, label: a.name }))}
          />
        )}
        <p className="text-[11px] text-muted-foreground/40">
          The lead coordinates the team and receives sprint briefs.
        </p>
      </div>

      {/* Members — checkbox list */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="section-label">Members</p>
          {memberIds.size > 0 && (
            <span className="font-mono text-[11px] text-muted-foreground/50">
              {memberIds.size} selected
            </span>
          )}
        </div>

        {memberCandidates.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.01] px-4 py-3">
            <Users className="size-3.5 text-muted-foreground/30" />
            <p className="text-[12px] text-muted-foreground/50">
              {agentOptions.length <= 1
                ? "Create more agents to add members."
                : "No other agents to add as members."}
            </p>
          </div>
        ) : (
          <div
            data-testid="team-member-list"
            className="rounded-md border border-border overflow-hidden"
          >
            {memberCandidates.map((a, i) => {
              const checked = memberIds.has(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-label={`Add ${a.name} as team member`}
                  onClick={() => toggleMember(a.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors",
                    "hover:bg-white/[0.03]",
                    i < memberCandidates.length - 1 ? "border-b border-white/[0.05]" : "",
                    checked ? "bg-white/[0.02]" : "",
                  )}
                >
                  {/* Checkbox */}
                  <span
                    className={cn(
                      "flex size-[15px] shrink-0 items-center justify-center rounded-sm border transition-all duration-100",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-white/[0.20] bg-transparent",
                    )}
                  >
                    {checked && <Check className="size-2.5 stroke-[3]" />}
                  </span>

                  <AgentMonogram name={a.name} />

                  <span className={cn(
                    "flex-1 text-[13px] transition-colors",
                    checked ? "font-medium text-foreground" : "text-muted-foreground/70",
                  )}>
                    {a.name}
                  </span>

                  {checked && (
                    <span className="flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-primary/70">
                      Member
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground/35">
          Optional — you can add members later from the team page.
        </p>
      </div>

      {/* Lead preview */}
      {leadId && (
        <div className="rounded-md border border-white/[0.06] bg-white/[0.01] px-4 py-3">
          <p className="section-label mb-2">Team preview</p>
          <div className="flex flex-wrap items-center gap-2">
            {/* Lead */}
            {agentOptions.find((a) => a.id === leadId) && (
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-white/[0.04] px-2.5 py-1">
                <Crown className="size-3 text-primary/60" />
                <span className="text-[12px] font-medium text-foreground">
                  {agentOptions.find((a) => a.id === leadId)?.name}
                </span>
              </div>
            )}
            {/* Members */}
            {agentOptions
              .filter((a) => memberIds.has(a.id))
              .map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 rounded-md border border-white/[0.06] px-2.5 py-1">
                  <span className="text-[12px] text-muted-foreground/70">{a.name}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-[12px] text-destructive" role="alert">{error}</p>
      )}

      {/* Submit */}
      <button
        type="button"
        data-testid="team-create-submit"
        disabled={pending || noAgents}
        onClick={submit}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-white/[0.10] px-4 py-2.5",
          "text-[13px] font-medium text-foreground transition-colors",
          "hover:border-white/[0.18] hover:bg-white/[0.04]",
          "disabled:pointer-events-none disabled:opacity-40",
        )}
      >
        <Check className="size-3.5" />
        {pending ? "Creating…" : "Create team"}
      </button>
    </div>
  );
}
