"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import {
  Bot, Brain, Cpu, Zap, Shield, Target, Globe, Eye,
  Code2, Search, Layers, BarChart3, PenLine, Palette,
  Wrench, Users, Star, Lightbulb, Rocket, FlaskConical,
  Upload, X, Save,
} from "lucide-react";
import {
  AgentSettingsPermissionsSection,
  type AgentSettingsPermissionsState,
} from "@/components/agents/agent-settings-form-permissions-part";
import {
  AgentSettingsAdapterRunPolicySections,
  type AgentAdapterId,
} from "@/components/agents/agent-settings-form-adapter-run-policy-part";
import { FieldInput, SectionDivider } from "@/components/agents/agent-settings-form-fields-part";
import { PrimaryButton } from "@/components/ui/primary-button";

import { CustomSelect } from "@/components/ui/custom-select";

import { updateAgent, deleteAgent } from "@/lib/agents/actions";
import type { AgentWithInstructions } from "@/lib/agents/actions";
import type { agents, systemRoles as systemRolesTable } from "@/db/schema";
import { cn } from "@/lib/utils";

type Peer = Pick<typeof agents.$inferSelect, "id" | "name">;

type PlatformSystemRole = typeof systemRolesTable.$inferSelect;

type Props = {
  businessId: string;
  agent: AgentWithInstructions;
  peerAgents: Peer[];
  platformSystemRoles: PlatformSystemRole[];
};

// ─── Icon Library ────────────────────────────────────────────────────────────

const ICON_LIBRARY = [
  { id: "bot", Icon: Bot },
  { id: "brain", Icon: Brain },
  { id: "cpu", Icon: Cpu },
  { id: "zap", Icon: Zap },
  { id: "shield", Icon: Shield },
  { id: "target", Icon: Target },
  { id: "globe", Icon: Globe },
  { id: "eye", Icon: Eye },
  { id: "code", Icon: Code2 },
  { id: "search", Icon: Search },
  { id: "layers", Icon: Layers },
  { id: "chart", Icon: BarChart3 },
  { id: "pen", Icon: PenLine },
  { id: "palette", Icon: Palette },
  { id: "wrench", Icon: Wrench },
  { id: "users", Icon: Users },
  { id: "star", Icon: Star },
  { id: "bulb", Icon: Lightbulb },
  { id: "rocket", Icon: Rocket },
  { id: "flask", Icon: FlaskConical },
] as const;

type IconId = (typeof ICON_LIBRARY)[number]["id"];


export function AgentSettingsForm({
  businessId,
  agent,
  peerAgents,
  platformSystemRoles,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Identity
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [systemRoleId, setSystemRoleId] = useState(agent.systemRoleId ?? "");
  const [reportsToAgentId, setReportsToAgentId] = useState<string>(agent.reportsToAgentId ?? "");
  const [selectedIcon, setSelectedIcon] = useState<IconId | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Adapter (UI-only stubs)
  const [adapter, setAdapter] = useState<AgentAdapterId>("cursor_cli");
  const [model, setModel] = useState("auto");
  const [thinkingEffort, setThinkingEffort] = useState("auto");

  // Run policy (UI-only stubs)
  const [heartbeatEnabled, setHeartbeatEnabled] = useState(false);
  const [heartbeatInterval, setHeartbeatInterval] = useState("30");

  // Permissions (UI-only stubs)
  const [permissions, setPermissions] = useState<AgentSettingsPermissionsState>({
    createAgents: false,
    assignTasks: false,
    manageProjects: false,
    assignIssues: false,
    manageTeam: false,
  });

  const peers = peerAgents.filter((p) => p.id !== agent.id);

  useEffect(() => {
    setSystemRoleId(agent.systemRoleId ?? "");
  }, [agent.systemRoleId]);

  // Derive monogram from name
  const monogram = name.slice(0, 2).toUpperCase() || "??";
  const SelectedIcon = selectedIcon ? ICON_LIBRARY.find((i) => i.id === selectedIcon)?.Icon : null;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateAgent(agent.id, {
          name,
          role,
          reportsToAgentId: reportsToAgentId || null,
          systemRoleId: systemRoleId || null,
        });
        toast.success("Settings saved.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${agent.name}"? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteAgent(agent.id);
        router.push(`/dashboard/agents?businessId=${encodeURIComponent(businessId)}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="flex max-w-xl flex-col gap-0">

      {/* ── Identity ──────────────────────────────────────────────── */}
      <p className="section-label mb-4">Identity</p>

      {/* Avatar */}
      <div className="mb-5 flex items-center gap-4">
        {/* Avatar preview */}
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-xl",
            "bg-white/[0.07] border border-white/[0.07]",
          )}
        >
          {SelectedIcon ? (
            <SelectedIcon className="size-6 text-foreground/60" />
          ) : (
            <span className="font-mono text-[15px] font-semibold text-foreground/50">
              {monogram}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowIconPicker((v) => !v)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
                showIconPicker
                  ? "border-white/[0.16] bg-white/[0.05] text-foreground"
                  : "border-border text-muted-foreground hover:border-white/[0.16] hover:text-foreground",
              )}
            >
              Choose icon
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-white/[0.16] hover:text-foreground"
            >
              <Upload className="size-3" />
              Upload
            </button>
            {selectedIcon && (
              <button
                type="button"
                onClick={() => setSelectedIcon(null)}
                className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-1.5 text-[11px] text-muted-foreground/40 transition-colors hover:text-muted-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/40">
            JPG, PNG or GIF · Max 2 MB
          </p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
      </div>

      {/* Icon picker */}
      {showIconPicker && (
        <div className="mb-4 rounded-md border border-border bg-white/[0.02] p-3">
          <div className="grid grid-cols-10 gap-1">
            {ICON_LIBRARY.map(({ id, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setSelectedIcon(id); setShowIconPicker(false); }}
                className={cn(
                  "flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors",
                  selectedIcon === id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground/50 hover:bg-white/[0.06] hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <FieldInput
          id="agent-name"
          label="Name"
          value={name}
          onChange={setName}
          placeholder="Agent name"
          testId="agent-name"
        />
        <FieldInput
          id="agent-role"
          label="Custom role"
          value={role}
          onChange={setRole}
          placeholder="e.g. Senior Developer"
          testId="agent-role"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* System role */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="system-role" className="section-label">System role</label>
          <CustomSelect
            id="system-role"
            value={systemRoleId}
            onChange={setSystemRoleId}
            options={[
              { id: "", label: "— Choose platform role —" },
              ...platformSystemRoles.map((r) => ({ id: r.id, label: r.name })),
            ]}
          />
          <p className="text-[11px] text-muted-foreground/35 leading-snug">
            {platformSystemRoles.find((r) => r.id === systemRoleId)?.description ??
              "Platform-defined behaviour layer (prompt + behaviour). Agents must assign a role before the local runner executes webhooks."}
          </p>
          {platformSystemRoles.find((r) => r.id === systemRoleId)?.includeBusinessContext && (
            <p className="text-[11px] text-emerald-500/70 leading-snug">
              Business-scope memory will be appended for this role when orchestration runs.
            </p>
          )}
        </div>

        {/* Reports to */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="agent-reports-to" className="section-label">Reports to</label>
          <CustomSelect
            id="agent-reports-to"
            data-testid="agent-reports-to"
            value={reportsToAgentId}
            onChange={setReportsToAgentId}
            options={[
              { id: "", label: "— None —" },
              ...peers.map((p) => ({ id: p.id, label: p.name })),
            ]}
          />
        </div>
      </div>

      <AgentSettingsAdapterRunPolicySections
        adapter={adapter}
        setAdapter={setAdapter}
        model={model}
        setModel={setModel}
        thinkingEffort={thinkingEffort}
        setThinkingEffort={setThinkingEffort}
        heartbeatEnabled={heartbeatEnabled}
        setHeartbeatEnabled={setHeartbeatEnabled}
        heartbeatInterval={heartbeatInterval}
        setHeartbeatInterval={setHeartbeatInterval}
      />

      <AgentSettingsPermissionsSection
        permissions={permissions}
        setPermissions={setPermissions}
      />

      {/* ── Actions ───────────────────────────────────────────────── */}
      {error && (
        <p className="mb-3 text-[12px] text-destructive" role="alert">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <PrimaryButton
          type="button"
          disabled={pending}
          loading={pending}
          onClick={handleSave}
          icon={Save}
          size="md"
          data-testid="agent-save"
        >
          {pending ? "Saving…" : "Save changes"}
        </PrimaryButton>
      </div>

      {/* ── Danger zone ───────────────────────────────────────────── */}
      <div className="mt-8 border-t border-white/[0.06] pt-5">
        <p className="section-label mb-3 text-destructive/60">Danger zone</p>
        <div className="flex items-center justify-between rounded-md border border-destructive/20 px-4 py-3">
          <div>
            <p className="text-[13px] font-medium text-foreground">Delete this agent</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/50">
              Permanently remove this agent and all associated data. Cannot be undone.
            </p>
          </div>
          <button
            type="button"
            data-testid="agent-delete"
            disabled={pending}
            onClick={handleDelete}
            className={cn(
              "flex cursor-pointer items-center rounded-md border border-destructive/30 px-3 py-1.5",
              "text-[12px] font-medium text-destructive/70 transition-colors",
              "hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            Delete agent
          </button>
        </div>
      </div>
    </div>
  );
}
