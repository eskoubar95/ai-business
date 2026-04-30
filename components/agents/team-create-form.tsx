"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { addTeamMember, createTeam } from "@/lib/teams/actions";
import type { agents } from "@/db/schema";
import { Button } from "@/components/ui/button";

type Peer = Pick<typeof agents.$inferSelect, "id" | "name">;

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
  const [memberA, setMemberA] = useState("");
  const [memberB, setMemberB] = useState("");

  const others = agentOptions.filter((a) => a.id !== leadId);

  function submit() {
    setError(null);
    const nm = name.trim();
    if (!nm) {
      setError("Team name is required");
      return;
    }
    if (!leadId) {
      setError("Select a lead agent");
      return;
    }
    if (!memberA || !memberB) {
      setError("Pick two additional members");
      return;
    }
    if (memberA === memberB) {
      setError("Additional members must be different");
      return;
    }
    if (memberA === leadId || memberB === leadId) {
      setError("Additional members must not be the lead (lead is added automatically)");
      return;
    }

    startTransition(async () => {
      try {
        const team = await createTeam({
          businessId,
          name: nm,
          leadAgentId: leadId,
        });
        await addTeamMember(team.id, memberA);
        await addTeamMember(team.id, memberB);
        toast.success("Team created.");
        router.push(
          `/dashboard/teams/${team.id}?businessId=${encodeURIComponent(businessId)}`,
        );
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Create failed");
      }
    });
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="team-name">
          Team name
        </label>
        <input
          id="team-name"
          data-testid="team-name"
          className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="team-lead">
          Lead agent
        </label>
        <select
          id="team-lead"
          data-testid="team-lead"
          className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          value={leadId}
          onChange={(e) => {
            setLeadId(e.target.value);
            setMemberA("");
            setMemberB("");
          }}
        >
          {agentOptions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="team-member-a">
          Additional member
        </label>
        <select
          id="team-member-a"
          data-testid="team-member-a"
          className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          value={memberA}
          onChange={(e) => setMemberA(e.target.value)}
        >
          <option value="">— Select agent —</option>
          {others.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="team-member-b">
          Additional member
        </label>
        <select
          id="team-member-b"
          data-testid="team-member-b"
          className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          value={memberB}
          onChange={(e) => setMemberB(e.target.value)}
        >
          <option value="">— Select agent —</option>
          {others.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        data-testid="team-create-submit"
        disabled={pending || agentOptions.length < 3}
        onClick={submit}
      >
        Create team
      </Button>
      {agentOptions.length < 3 ? (
        <p className="text-muted-foreground text-xs">
          Create at least three agents before forming a team with a lead plus two members.
        </p>
      ) : null}
    </div>
  );
}
