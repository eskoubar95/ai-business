"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Eye, EyeOff, Settings } from "lucide-react";

import type { McpLibraryBoard } from "@/lib/mcp/actions";
import { deleteMcpCredential, saveMcpCredential } from "@/lib/mcp/actions";
import { listMcpTypeConfigs, type McpTypeConfig } from "@/lib/mcp/config";
import { cn } from "@/lib/utils";

type Props = {
  businessId: string;
  board: McpLibraryBoard;
  onChanged: () => Promise<void>;
};

function emptyPayload(config: McpTypeConfig): Record<string, string> {
  const o: Record<string, string> = {};
  for (const f of config.fields) o[f.name] = "";
  return o;
}

/** Brand logos — copied from mcp-installer.tsx */
function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.925.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function NotionLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
    </svg>
  );
}

function Context7Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
      <rect width="28" height="28" rx="4" fill="#059669" />
      <path d="M10.5724 15.2565C10.5724 17.5025 9.6613 19.3778 8.17805 21.1047H11.6319L11.6319 22.7786H6.33459V21.1895C7.95557 19.3566 8.58065 17.8628 8.58065 15.2565L10.5724 15.2565Z" fill="white" />
      <path d="M17.4276 15.2565C17.4276 17.5025 18.3387 19.3778 19.822 21.1047H16.3681V22.7786H21.6654V21.1895C20.0444 19.3566 19.4194 17.8628 19.4194 15.2565H17.4276Z" fill="white" />
      <path d="M10.5724 12.7435C10.5724 10.4975 9.66131 8.62224 8.17807 6.89532L11.6319 6.89532V5.22137L6.33461 5.22137V6.81056C7.95558 8.64343 8.58066 10.1373 8.58066 12.7435L10.5724 12.7435Z" fill="white" />
      <path d="M17.4276 12.7435C17.4276 10.4975 18.3387 8.62224 19.822 6.89532L16.3681 6.89532L16.3681 5.22138L21.6654 5.22138V6.81056C20.0444 8.64343 19.4194 10.1373 19.4194 12.7435H17.4276Z" fill="white" />
    </svg>
  );
}

function McpLogo({ id }: { id: string }) {
  const wrapCls =
    "flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03]";

  if (id === "github") {
    return (
      <span className={wrapCls}>
        <GitHubLogo className="size-5 fill-black dark:fill-white" />
      </span>
    );
  }
  if (id === "notion") {
    return (
      <span className={wrapCls}>
        <NotionLogo className="size-5 fill-black dark:fill-white" />
      </span>
    );
  }
  if (id === "context7") {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center">
        <Context7Logo className="size-[34px] rounded-[5px]" />
      </span>
    );
  }
  return (
    <span className={cn(wrapCls, "font-mono text-[11px] font-semibold text-muted-foreground/50")}>
      {id.slice(0, 2).toUpperCase()}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-40",
        checked ? "bg-primary" : "bg-white/[0.14]",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-[14px] rounded-full bg-white shadow ring-0",
          "transition-transform duration-200",
          checked ? "translate-x-[14px]" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function McpLibrary({ businessId, board, onChanged }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const configs = listMcpTypeConfigs();
  const activeCount = configs.filter((cfg) =>
    board.credentials.some((c) => c.mcpName === cfg.id),
  ).length;

  function openForm(cfg: McpTypeConfig) {
    setError(null);
    setConfiguringId(cfg.id);
    setFormFields(emptyPayload(cfg));
    setVisibleFields({});
  }

  function closeForm() {
    setConfiguringId(null);
    setError(null);
  }

  function handleToggle(cfg: McpTypeConfig) {
    const isInstalled = board.credentials.some((c) => c.mcpName === cfg.id);
    if (!isInstalled) {
      if (configuringId === cfg.id) {
        closeForm();
      } else {
        openForm(cfg);
      }
    }
    // Toggling off a configured integration is a future feature
  }

  function handleGearClick(cfg: McpTypeConfig) {
    if (configuringId === cfg.id) {
      closeForm();
    } else {
      openForm(cfg);
    }
  }

  function handleSaveCredential(cfg: McpTypeConfig) {
    setError(null);
    const payload: Record<string, unknown> = { ...formFields };
    startTransition(async () => {
      try {
        await saveMcpCredential(businessId, cfg.id, payload);
        closeForm();
        await onChanged();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function handleRemove(credId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await deleteMcpCredential(credId);
        closeForm();
        await onChanged();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="flex flex-col" data-testid="mcp-library">
      <div className="mb-3 flex items-center justify-between">
        <p className="section-label">Integrations</p>
        <span className="font-mono text-[11px] text-muted-foreground/40">
          {activeCount} of {configs.length} active
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        {configs.map((cfg, i) => {
          const credential = board.credentials.find((c) => c.mcpName === cfg.id);
          const isInstalled = Boolean(credential);
          const isConfiguring = configuringId === cfg.id;
          const isLast = i === configs.length - 1;

          return (
            <div key={cfg.id} data-testid={`mcp-library-row-${cfg.id}`}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  !isLast && !isConfiguring ? "border-b border-white/[0.05]" : "",
                )}
              >
                <McpLogo id={cfg.id} />

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium tracking-[-0.01em] text-foreground">
                    {cfg.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/50">{cfg.description}</p>
                </div>

                {isInstalled ? (
                  <span className="flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-primary/70">
                    Configured
                  </span>
                ) : (
                  <span className="font-mono text-[10px] tracking-wide text-muted-foreground/35">
                    Not configured
                  </span>
                )}

                <Toggle
                  checked={isInstalled}
                  onChange={() => handleToggle(cfg)}
                  disabled={pending}
                />

                <button
                  type="button"
                  data-testid={`mcp-configure-${cfg.id}`}
                  aria-label={`Configure ${cfg.label}`}
                  onClick={() => handleGearClick(cfg)}
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded p-1.5 transition-colors",
                    isConfiguring
                      ? "bg-white/[0.08] text-foreground"
                      : "text-muted-foreground/35 hover:bg-white/[0.05] hover:text-foreground",
                  )}
                >
                  <Settings className="size-3.5" />
                </button>
              </div>

              {/* Animated inline credential form */}
              <div
                className={cn(
                  "grid transition-all duration-200 ease-in-out",
                  isConfiguring ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {cfg.fields.map((f) => (
                        <div key={f.name} className="flex flex-col gap-1.5">
                          <label
                            htmlFor={`mcp-lib-${cfg.id}-${f.name}`}
                            className="mb-1 block font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground/40"
                          >
                            {f.label}
                          </label>
                          <div className="relative">
                            <input
                              id={`mcp-lib-${cfg.id}-${f.name}`}
                              data-testid={`mcp-library-field-${f.name}`}
                              type={
                                f.type === "password" && !visibleFields[f.name]
                                  ? "password"
                                  : "text"
                              }
                              autoComplete="off"
                              value={formFields[f.name] ?? ""}
                              onChange={(e) =>
                                setFormFields((p) => ({ ...p, [f.name]: e.target.value }))
                              }
                              className={cn(
                                "h-9 w-full rounded-md border border-border bg-white/[0.04]",
                                "px-3 text-[12.5px] text-foreground placeholder:text-muted-foreground/25",
                                "focus:border-white/[0.16] focus:outline-none transition-colors",
                                f.type === "password" && "pr-8",
                              )}
                              placeholder={
                                f.type === "url"
                                  ? "https://"
                                  : f.type === "password"
                                    ? "••••••••"
                                    : ""
                              }
                            />
                            {f.type === "password" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setVisibleFields((p) => ({ ...p, [f.name]: !p[f.name] }))
                                }
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                tabIndex={-1}
                              >
                                {visibleFields[f.name] ? (
                                  <EyeOff className="size-3" />
                                ) : (
                                  <Eye className="size-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {error && (
                      <p className="mt-3 text-[11px] text-destructive" role="alert">
                        {error}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="mcp-library-submit"
                        disabled={pending}
                        onClick={() => handleSaveCredential(cfg)}
                        className={cn(
                          "flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5",
                          "text-[12px] font-medium text-foreground/80 transition-colors",
                          "hover:border-white/[0.16] hover:bg-white/[0.04]",
                          "disabled:pointer-events-none disabled:opacity-40",
                        )}
                      >
                        <Check className="size-3" />
                        {pending ? "Saving…" : "Save credential"}
                      </button>

                      {isInstalled && credential && (
                        <button
                          type="button"
                          disabled={pending}
                          data-testid={`mcp-library-delete-${credential.id}`}
                          onClick={() => handleRemove(credential.id)}
                          className="cursor-pointer rounded-md border border-destructive/25 px-3 py-1.5 text-[12px] text-destructive/70 hover:bg-destructive/10 transition-colors disabled:opacity-40"
                        >
                          Remove
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={closeForm}
                        className="cursor-pointer text-[12px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
