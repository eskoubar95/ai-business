# Task 1.2 — P0 UX Fixes + Settings Page Scaffold

**Phase:** 2  
**Stage:** 1  
**Worker:** Frontend Agent  
**Branch:** `phase2/stage1-frontend`  
**Task Log:** `.apm/memory/stage-01/task-01-02.log.md`  
**Report:** `.apm/bus/frontend-agent/report.md`

---

## Context

You are a Frontend Agent Worker in an APM (Agentic Project Management) session for the **AI Business Platform** — a Next.js 15 orchestration cockpit for AI-driven businesses.

**Phase 1 is complete and merged to `main`.** The existing frontend uses:
- Next.js 15 App Router, TypeScript, Tailwind v4, shadcn tokens
- Geist font, Neon Auth UI components
- Key pages: `app/dashboard/`, `app/dashboard/agents/`, `app/dashboard/teams/`, `app/dashboard/approvals/`, `app/dashboard/grill-me/`
- Nav: `app/components/nav-shell.tsx`

**Your task** is to fix all P0 UX blockers identified in the UI/UX review (`docs/phase-2-ui-ux-review.md`), install the shadcn Button component, scaffold the Settings page, and add a brand accent color.

**This task runs in parallel with T1.1 (Backend Agent schema migrations).** Your changes are purely UI/component level and do not depend on T1.1 completing first. However, the `<BusinessSelector>` and Settings forms will call Server Actions that T1.1 will later complete — create **stubs** for those Server Actions now.

---

## Objective

Fix the most critical usability problems in the platform so the app can be used with multiple businesses. Apply the three quick wins from the UI/UX review + Settings page + brand color.

---

## What to Fix (P0 + Quick Wins)

Read `docs/phase-2-ui-ux-review.md` §Kritiske Fejl for full context. Summary:

### Fix 1: Business Selector → `<select>` dropdown

**Problem:** Businesses rendered as inline `<Link>` elements that wrap across multiple lines. With many businesses, pages are unusable.

**Files to update:**
- `app/dashboard/agents/page.tsx`
- `app/dashboard/teams/page.tsx`
- `app/dashboard/approvals/page.tsx`

**Solution:**
1. Run `npx shadcn@latest add select` to install the Select primitive.
2. Create `components/business-selector.tsx` (`"use client"`):
   ```tsx
   "use client";
   import { useRouter } from "next/navigation";
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
   
   interface Props {
     businesses: { id: string; name: string }[];
     currentBusinessId: string | null;
     paramName?: string; // default "businessId"
   }
   
   export function BusinessSelector({ businesses, currentBusinessId, paramName = "businessId" }: Props) {
     const router = useRouter();
     return (
       <Select
         value={currentBusinessId ?? ""}
         onValueChange={(id) => router.push(`?${paramName}=${id}`)}
       >
         <SelectTrigger className="w-[200px]">
           <SelectValue placeholder="Select business" />
         </SelectTrigger>
         <SelectContent>
           {businesses.map((b) => (
             <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
           ))}
         </SelectContent>
       </Select>
     );
   }
   ```
3. In each affected page, replace the `<nav>` business link block with `<BusinessSelector businesses={businesses} currentBusinessId={searchParams.businessId ?? null} />`.
4. Remove the `aria-label="Business scope"` nav and all inline `<Link>` business elements.

### Fix 2: Nav Active State

**Problem:** All nav links look identical regardless of current page. No visual orientation.

**File:** `app/components/nav-shell.tsx`

**Solution:**
1. Extract nav links into `app/components/nav-links.tsx` as a `"use client"` component:
   ```tsx
   "use client";
   import Link from "next/link";
   import { usePathname } from "next/navigation";
   
   const links = [
     { href: "/dashboard", label: "Dashboard" },
     { href: "/dashboard/agents", label: "Agents" },
     { href: "/dashboard/teams", label: "Teams" },
     { href: "/dashboard/tasks", label: "Tasks" },
     { href: "/dashboard/approvals", label: "Approvals" },
     { href: "/dashboard/settings", label: "Settings" },
   ];
   
   export function NavLinks() {
     const pathname = usePathname();
     return (
       <nav className="flex items-center gap-6">
         {links.map(({ href, label }) => {
           const isActive = href === "/dashboard"
             ? pathname === "/dashboard"
             : pathname.startsWith(href);
           return (
             <Link
               key={href}
               href={href}
               className={isActive
                 ? "text-sm font-medium text-foreground border-b-2 border-foreground pb-0.5"
                 : "text-sm text-muted-foreground hover:text-foreground transition-colors"}
             >
               {label}
             </Link>
           );
         })}
       </nav>
     );
   }
   ```
2. Import `<NavLinks>` into `app/components/nav-shell.tsx` and replace the static link list.
3. Add "Tasks" link (for the upcoming Tasks feature) and "Settings" link.

### Fix 3: Dashboard Business Link → Agents

**Problem:** Clicking a business on the dashboard goes to Grill-Me (onboarding) — should go to the agents page for that business.

**File:** `app/dashboard/page.tsx`

**Solution:**
- Change `<Link href={/dashboard/grill-me/${b.id}}>` to `<Link href={/dashboard/agents?businessId=${b.id}}>`.
- Improve the business card: show name + `created_at` formatted as `MMM YYYY` (use `new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })`).
- Style as a proper card (border, hover state, padding).

### Fix 4: shadcn `<Button>` Component

**Problem:** Inline button class string `bg-primary text-primary-foreground hover:bg-primary/90 inline-flex rounded-md px-4 py-2 text-sm font-medium` duplicated on 5+ pages.

**Solution:**
1. Run `npx shadcn@latest add button`.
2. Find and replace all instances of the duplicated class string with `<Button>` from `@/components/ui/button`.
3. Target files:
   - `app/dashboard/page.tsx`
   - `app/dashboard/agents/page.tsx`
   - `app/dashboard/teams/new/page.tsx`
   - `app/dashboard/agents/new/page.tsx`
   - `app/dashboard/onboarding/page.tsx`
4. Use `variant="default"` for primary CTAs, `variant="outline"` for secondary actions.

### Fix 5: Brand Accent Color

**Problem:** All colors are achromatique (black/white/grey). No visual identity.

**File:** `app/globals.css`

**Solution:**
Add a dæmpet blue-violet accent. Find the `:root` and `.dark` CSS blocks and update:
```css
/* In :root */
--accent: oklch(0.55 0.18 260);
--accent-foreground: oklch(0.98 0 0);

/* Also update --primary to a deep indigo instead of pure black */
--primary: oklch(0.35 0.15 265);
--primary-foreground: oklch(0.98 0 0);
```
This gives the platform a "technology + control + intelligence" feel without being loud.

### Fix 6: Settings Page Scaffold

**New files:**

1. `lib/settings/actions.ts` (`"use server"` stub):
   ```typescript
   "use server";
   export async function saveUserSettings(_cursorApiKey: string) {
     // TODO: implement in Task 2.1 (Backend Agent)
     return { success: true };
   }
   export async function saveBusinessSettings(
     _businessId: string,
     _data: { localPath?: string; githubRepoUrl?: string; description?: string }
   ) {
     // TODO: implement in Task 2.1 (Backend Agent)
     return { success: true };
   }
   ```

2. `app/dashboard/settings/page.tsx`:
   ```tsx
   // Server Component
   // Two sections:
   // 1. Account — "Cursor API Key" input (text, type="password")
   // 2. Business — Select business dropdown, "Local Path" input, "GitHub Repo URL" input
   // Form submits to the stub Server Actions
   // Note: real encryption implemented by Backend Agent in Task 2.1
   ```
   - Use `export const dynamic = "force-dynamic"` since it may access auth session.
   - Show a note: "API key is encrypted and stored securely."
   - Install `sonner` for toasts if not already present: `npx shadcn@latest add sonner`.
   - Add `<Toaster>` to the root layout.

---

## Implementation Steps

1. Run: `npx shadcn@latest add button select sonner`
2. Create `components/business-selector.tsx` (as above)
3. Update `app/dashboard/agents/page.tsx`, `app/dashboard/teams/page.tsx`, `app/dashboard/approvals/page.tsx` — replace business link nav with `<BusinessSelector>`
4. Create `app/components/nav-links.tsx` with `usePathname()` active detection
5. Update `app/components/nav-shell.tsx` to use `<NavLinks>`
6. Fix `app/dashboard/page.tsx` business link destination + improve card
7. Refactor all 5 duplicate button class strings to use shadcn `<Button>`
8. Add accent + primary color to `app/globals.css`
9. Create `lib/settings/actions.ts` (stubs)
10. Create `app/dashboard/settings/page.tsx` (scaffold form)
11. Add `<Toaster>` to `app/layout.tsx`
12. Run `npm run build` — fix all TypeScript errors
13. Run `npm test` — all green
14. Run Playwright smoke test: `npx playwright test tests/smoke.spec.ts`

---

## Validation Checklist

- [ ] `npm run build` exits 0
- [ ] `npm test` all green
- [ ] Business selector renders as `<select>` (or shadcn Select) on agents/teams/approvals pages
- [ ] Nav shows active indicator on current page
- [ ] Dashboard business card links to `/dashboard/agents?businessId=...`
- [ ] `<Button>` component used everywhere, no duplicate inline class strings
- [ ] `/dashboard/settings` renders without errors
- [ ] Brand accent color visible (primary buttons should be deep indigo, not pure black)

---

## Deliverables

1. `components/business-selector.tsx`
2. `app/components/nav-links.tsx`
3. Updated `app/components/nav-shell.tsx`
4. Updated `app/dashboard/page.tsx`
5. Updated agents/teams/approvals pages (BusinessSelector)
6. `components/ui/button.tsx` + `components/ui/select.tsx` (from shadcn)
7. Refactored button usage across 5 pages
8. Updated `app/globals.css` with brand color
9. `lib/settings/actions.ts` (stubs)
10. `app/dashboard/settings/page.tsx`
11. Updated `app/layout.tsx` with `<Toaster>`
12. Task Log at `.apm/memory/stage-01/task-01-02.log.md`
13. Report at `.apm/bus/frontend-agent/report.md`

---

## Task Log Format

Write `.apm/memory/stage-01/task-01-02.log.md`:
```markdown
# Task 1.2 Log — P0 UX Fixes + Settings Page Scaffold

**Status:** Done  
**Branch:** phase2/stage1-frontend  

## What was done
[summary]

## Files changed
[list]

## Decisions made
[deviations from spec, rationale]

## Issues encountered
[blockers and resolution]

## Validation results
[build + test output]
```

## Report Format

Write `.apm/bus/frontend-agent/report.md` with 3-5 sentences for the Manager. Include: what was fixed, branch name, any deviations, and readiness for T1.2 PR review.
