"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@neondatabase/auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { NavNewBusinessButton } from "./nav-new-business-button";

const SIDEBAR_COLLAPSED_KEY = "ai-business-sidebar-collapsed";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/agents", label: "Agents", icon: Bot },
  { href: "/dashboard/teams", label: "Teams", icon: Users },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/skills", label: "Skills", icon: BookOpen },
  {
    href: "/dashboard/approvals",
    label: "Approvals",
    icon: ShieldCheck,
    badge: true as const,
  },
] as const;

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
  pendingApprovalsCount,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  isActive: boolean;
  collapsed: boolean;
  pendingApprovalsCount?: number;
}) {
  const showBadge = href === "/dashboard/approvals" && (pendingApprovalsCount ?? 0) > 0;

  return (
    <Link
      href={href}
      className={cn(
        "text-muted-foreground hover:bg-accent hover:text-foreground group relative flex cursor-pointer items-center gap-3 rounded-md py-2 pr-2 pl-2 text-sm transition-colors duration-150",
        collapsed && "justify-center px-2",
        isActive &&
          "bg-accent text-primary border-primary border-l-[3px] pl-[calc(0.5rem-3px)] font-medium",
        !isActive && "border-l-[3px] border-transparent",
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span
        className={cn(
          "truncate transition-[opacity,width] duration-200",
          collapsed ? "hidden w-0 opacity-0" : "inline opacity-100",
        )}
      >
        {label}
      </span>
      {showBadge ? (
        <span
          data-testid="nav-approvals-pending-count"
          className={cn(
            "bg-destructive text-destructive-foreground inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
            collapsed && "absolute -top-0.5 -right-0.5",
          )}
        >
          {(pendingApprovalsCount ?? 0) > 99 ? "99+" : pendingApprovalsCount}
        </span>
      ) : null}
    </Link>
  );
}

export function AppSidebar({
  pendingApprovalsCount = 0,
  userEmail,
}: {
  pendingApprovalsCount?: number;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "1") {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed, hydrated]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspaceOpen(false);
      }
    }
    if (workspaceOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [workspaceOpen]);

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  const sidebarInner = (
    <>
      <div
        className={cn(
          "border-sidebar-border flex h-14 shrink-0 items-center gap-2 border-b px-3",
          collapsed && "justify-center px-2",
        )}
      >
        <div className={cn("relative min-w-0 flex-1", collapsed && "flex-initial")} ref={workspaceRef}>
          <button
            type="button"
            onClick={() => setWorkspaceOpen((o) => !o)}
            className={cn(
              "hover:bg-sidebar-accent flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150",
              collapsed && "justify-center p-2",
            )}
            aria-expanded={workspaceOpen}
            aria-haspopup="true"
          >
            <span
              className={cn(
                "bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold",
              )}
            >
              AI
            </span>
            {!collapsed ? (
              <span className="text-sidebar-foreground min-w-0 flex-1 truncate font-medium">
                Workspace
              </span>
            ) : null}
          </button>
          {workspaceOpen && !collapsed ? (
            <div className="bg-popover text-popover-foreground border-border absolute top-full left-0 z-50 mt-1 w-56 rounded-md border p-2 text-sm shadow-md">
              <div className="text-muted-foreground border-border mb-2 border-b px-1 pb-2 text-xs">
                {userEmail ? (
                  <>
                    Signed in as
                    <div className="text-foreground mt-0.5 truncate font-medium">{userEmail}</div>
                  </>
                ) : (
                  "Not signed in"
                )}
              </div>
              <Link
                href="/dashboard"
                className="hover:bg-accent block cursor-pointer rounded px-2 py-1.5 transition-colors"
                onClick={() => setWorkspaceOpen(false)}
              >
                Switch workspace
              </Link>
              <Link
                href="/dashboard/settings"
                className="hover:bg-accent block cursor-pointer rounded px-2 py-1.5 transition-colors"
                onClick={() => setWorkspaceOpen(false)}
              >
                Profile settings
              </Link>
            </div>
          ) : null}
        </div>
        {!collapsed ? (
          <div className="flex shrink-0 items-center gap-1">
            <NavNewBusinessButton />
          </div>
        ) : (
          <Button variant="ghost" size="icon" asChild className="size-8 shrink-0" title="New business">
            <Link href="/dashboard/onboarding" data-testid="nav-new-business">
              <Plus className="size-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Primary">
        {mainNav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
            isActive={isActive(item.href)}
            pendingApprovalsCount={item.badge ? pendingApprovalsCount : undefined}
          />
        ))}
      </nav>

      <div className="border-sidebar-border mt-auto flex flex-col gap-1 border-t p-3">
        <Link
          href="/dashboard/settings"
          className={cn(
            "text-muted-foreground hover:bg-accent hover:text-foreground flex cursor-pointer items-center gap-3 rounded-md py-2 pr-2 pl-2 text-sm transition-colors duration-150",
            collapsed && "justify-center px-2",
            isActive("/dashboard/settings") &&
              "bg-accent text-primary border-primary border-l-[3px] pl-[calc(0.5rem-3px)] font-medium",
            !isActive("/dashboard/settings") && "border-l-[3px] border-transparent",
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="size-4 shrink-0" aria-hidden />
          <span
            className={cn(
              "truncate transition-[opacity,width] duration-200",
              collapsed ? "hidden w-0 opacity-0" : "inline opacity-100",
            )}
          >
            Settings
          </span>
        </Link>

        <div className={cn("flex items-center gap-2 pt-1", collapsed && "justify-center")}>
          <SignedIn>
            <UserButton />
            {!collapsed ? (
              <span className="text-muted-foreground truncate text-xs">Account</span>
            ) : null}
          </SignedIn>
          <SignedOut>
            <div className={cn("flex flex-col gap-1", collapsed ? "items-center" : "w-full")}>
              <Link
                href="/auth/sign-in"
                className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors"
              >
                Sign in
              </Link>
              {!collapsed ? (
                <Link
                  href="/auth/sign-up"
                  className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors"
                >
                  Sign up
                </Link>
              ) : null}
            </div>
          </SignedOut>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("text-muted-foreground mt-1 cursor-pointer", collapsed && "px-2")}
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          {!collapsed ? <span className="ml-1">Collapse</span> : null}
        </Button>
      </div>
    </>
  );

  return (
    <div className="md:flex md:h-svh md:shrink-0">
      {/* Mobile top bar */}
      <div className="border-border bg-background md:hidden fixed top-0 right-0 left-0 z-40 flex h-12 items-center border-b px-3">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <Link href="/dashboard" className="text-foreground ml-2 text-sm font-semibold">
          AI Business
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          type="button"
          className="bg-background/80 md:hidden fixed inset-0 z-40 backdrop-blur-sm"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "border-sidebar-border bg-sidebar text-sidebar-foreground md:border-sidebar-border flex flex-col border-r transition-transform duration-200 ease-out",
          "fixed top-0 left-0 z-50 h-svh w-[240px] md:relative md:z-0 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          hydrated && collapsed ? "md:w-14" : "md:w-[240px]",
        )}
      >
        <div className="flex h-12 items-center justify-between border-b px-2 md:hidden">
          <span className="text-sm font-medium">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>
        <div className="flex h-full min-h-0 flex-1 flex-col">{sidebarInner}</div>
      </aside>
    </div>
  );
}
