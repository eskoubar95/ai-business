# Phase 2 — UI/UX Review: AI Business Platform

**Dato:** 30. april 2026  
**Reviewer:** AI Design Agent (via ui-ux-pro-max skill)  
**Scope:** Fuld gennemgang af alle dashboard-sider, navigation, komponenter og UX-flow  
**Stack:** Next.js 15, React 19, Tailwind v4, shadcn tokens, Geist, Neon Auth

---

## Overordnet diagnose

Platformen har et **solidt teknisk fundament** — shadcn design tokens, Tailwind v4, Geist-font, korrekt server/client-opdeling og fornuftig komponentstruktur. Men det er bygget af AI-agenter med fokus på funktionalitet, ikke brugbarhed. Der er:

- **Nul information architecture** — ingen klar user journey fra login til kerneopgaver
- **Nul visuel identitet** — alle farver er achromatiske (sort/hvid/grå), ingen brand-accent
- **Brudt UX-flow** på tværs af sider — business-kontekst mistes, navigationen er passiv, handlinger er skjulte
- **Manglende primitiver** — button-styling, card-styling og page-layout duplikeres på tværs af alle sider

Appen kan bruges — men den er ikke designet til at bruges.

---

## Kritiske fejl (P0 — blockers)

### 1. Business-selector er fuldstændig broken

Det mest synlige problem på tværs af Agents, Teams og Approvals. Alle businesses (60+ i test-miljø) er renderet som inline-links der wrapper ud over 4-5 linjer:

```tsx
// Nuværende kode — app/dashboard/agents/page.tsx linje 49-65
<nav aria-label="Business scope" className="text-muted-foreground flex flex-wrap gap-2 text-sm">
  <span className="font-medium text-foreground">Business:</span>
  {businesses.map((b) => (
    <Link key={b.id} href={`/dashboard/agents?businessId=${...}`}>
      {b.name}
    </Link>
  ))}
</nav>
```

Med mange businesses er siden **ubrugelig**. Løsning: erstat med en `<select>`-dropdown eller combobox der navigerer via `router.push()` ved ændring.

**Berørte filer:**
- `app/dashboard/agents/page.tsx`
- `app/dashboard/teams/page.tsx`
- `app/dashboard/approvals/page.tsx`

---

### 2. Navigation mangler aktiv state

Alle nav-links i `nav-shell.tsx` ser ens ud uanset hvilken side brugeren er på. Der er ingen visuel indikation af "her er du nu". Brugere mister orienteringen i appen.

**Berørt fil:** `app/components/nav-shell.tsx`  
**Fix:** Brug `usePathname()` i en client-wrapper og tilføj en aktiv klasse (f.eks. `text-foreground font-medium border-b border-foreground`).

---

### 3. Dashboard linker til Grill-Me — forkert destination

Når en bruger klikker en business på Dashboard, bliver de sendt til Grill-Me (onboarding-chatten):

```tsx
// app/dashboard/page.tsx linje 61-67
<Link href={`/dashboard/grill-me/${b.id}`}>
  {b.name}
</Link>
```

Grill-Me er et **onboarding-tool** — det hører hjemme i oprettelses-flowet, ikke som primær CTA fra Dashboard. En bruger der allerede har onboardet sin business forventer en **business-oversigt**, ikke en tom chat.

**Fix:** Link til `/dashboard/agents?businessId=...` eller opret en dedikeret business-oversigtsside.

---

## Høj prioritet (P1 — UX-flow)

### 4. Manglende information architecture

Der er ingen klar brugerrejse efter login. Hierarkiet er uklart på flere niveauer:

| Spørgsmål | Status |
|-----------|--------|
| Hvad gør en bruger efter de logger ind? | Uklart — dashboard viser bare en liste |
| Hvad er Grill-Me's plads i flowet? | Fremgår ikke — er det onboarding? Et ongoing tool? |
| Hvad er en "business" i kontekst af agents og teams? | Ingen forklaring |
| Hvad sker der efter Grill-Me er afsluttet? | Ingen "next step" |

Business-konteksten er heller ikke persistent — skifter man fra Agents til Teams mister man den valgte business og vælger back til default.

**Foreslået IA:**
```
Login
  └── Dashboard (oversigt over alle dine businesses)
        └── [Vælg business]
              ├── Business Overview (agents, teams, recent activity, pending approvals)
              ├── Agents → Agent Detail/Edit
              ├── Teams → Team Detail
              └── Approvals (filtreret til business)
```

Grill-Me flyttes til "Ny business"-flowet, ikke til hoveddashboardet.

---

### 5. Grill-Me chat er uinviterende og tom

Den nuværende UI består af: én unlabeled input øverst, en `<textarea>` med `"Describe your business..."` og en Send-knap. Der mangler:

- **Velkomstbesked fra AI-agenten** — hvem er det der "griller"? Hvad sker der?
- **Agent-identitet/avatar** — ingen karakter, ingen personlighed
- **Chathistorik** — tidligere beskeder vises ikke i UI (eller starter altid tom)
- **Progress-indikation** — er onboarding i gang? Hvad er næste skridt?
- **Label på første input** — det øverste felt (formentlig business-navn) har ingen `<label>`

---

### 6. Empty states mangler kontekst

Nuværende empty states giver ingen hjælp til nye brugere:

| Side | Nuværende tekst | Problem |
|------|----------------|---------|
| Teams | "No teams yet. Create one." | Hvad er et team? Hvorfor skal jeg lave ét? |
| Approvals | "Queue is empty — nothing awaiting approval." | Hvad er approvals for? Hvornår dukker de op? |
| Agents | "No agents yet. Create one." | Hvad laver en agent? Hvad sker der efter man opretter en? |

Empty states bør forklare **formålet** og give en **klar handling** med kontekst.

---

## Middel prioritet (P2 — visuel kvalitet)

### 7. Ingen visuel identitet / brand-farve

Alle farvetokens er achromatiske:

```css
/* globals.css */
--primary: oklch(0.205 0 0);   /* sort */
--secondary: oklch(0.97 0 0);  /* næsten hvid */
--muted: oklch(0.97 0 0);      /* næsten hvid */
--accent: oklch(0.97 0 0);     /* næsten hvid */
```

En AI-orchestration-platform burde have én stærk accent-farve der signalerer "teknologi + kontrol + intelligens" — f.eks. en dæmpet blå/violet (`oklch(0.55 0.18 260)`) eller en varm indigo. Det er én linje at ændre i `globals.css`, men det transformerer oplevelsen.

---

### 8. Dashboard business-liste mangler metadata

Businesses vises kun med navn — ingen kontekst:

```tsx
// app/dashboard/page.tsx linje 58-70
<ul className="flex flex-col gap-2">
  {rows.map((b) => (
    <li key={b.id}>
      <Link href={`/dashboard/grill-me/${b.id}`}>
        {b.name}
      </Link>
    </li>
  ))}
</ul>
```

Hvert business-kort bør vise: antal agents, antal teams, pending approvals, hvornår oprettet. En liste med kun et navn har ingen brugsværdi.

---

### 9. Agent-kort: edit-interaktion er skjult

Hele `AgentCard` er et link til edit-siden, men der er ingen eksplicit "Edit"-knap eller visuel affordance. Fra en brugers perspektiv ser det ud som et info-kort. Tilføj en tydelig "Edit"-knap eller et pencil-ikon.

---

### 10. Instructions-editor er overdimensioneret

`@uiw/react-md-editor` viser et split-panel markdown-editor (tekst venstre, preview højre) til agent-instructions. Det er en tung komponent til hvad der i praksis er en tekst-felt med markdown. Overvej en simpel `<textarea>` med en preview-toggle i stedet.

---

### 11. Ingen shared UI-primitiver

I har shadcn tokens men ingen `components/ui/`-primitives. Button-styling er duplikeret på mindst 5 steder:

```
app/dashboard/page.tsx linje 39-44
app/dashboard/agents/page.tsx linje 41-46
app/dashboard/teams/new/page.tsx
app/dashboard/agents/new/page.tsx
app/dashboard/onboarding/page.tsx
```

Samme klasse-streng: `bg-primary text-primary-foreground hover:bg-primary/90 inline-flex rounded-md px-4 py-2 text-sm font-medium`.

En `<Button>` komponent via `shadcn add button` løser dette.

---

## Lav prioritet (P3 — polish)

### 12. "New business" er et nav-item — det bør være en CTA-knap

I `nav-shell.tsx` er "New business" på linje med Dashboard og Agents. Det er en **handling**, ikke en destination. Det bør visuelt adskilles — f.eks. en outlined button eller en `+`-ikon-knap.

### 13. Dark mode tokens er defineret men aldrig aktiveret

`.dark` CSS-tokens og `dark:` Tailwind-utilities er defineret, men der er ingen `next-themes`-provider eller toggle i UI. `dark:bg-green-950` i `agent-status-badge.tsx` er dead code. Enten implementér dark mode fuldt ud eller ryd op i tokens.

### 14. Formularer mangler feedback efter submit

"Save changes" på Edit Agent giver ingen visuel bekræftelse (toast, success-state på knappen, farveændring). Brugeren ved ikke om det lykkedes.

---

## Prioriteret handlingsplan

| Prioritet | Opgave | Estimat |
|-----------|--------|---------|
| **P0** | Erstat business-selector med `<select>` dropdown på agents/teams/approvals | 1-2t |
| **P0** | Tilføj aktiv state i nav via `usePathname()` | 30 min |
| **P0** | Fix dashboard business-klik → gå til agents (ikke Grill-Me) | 30 min |
| **P1** | Tilføj én brand accent-farve i `globals.css` | 30 min |
| **P1** | Opret shared `<Button>` komponent, refaktorér alle duplikater | 1-2t |
| **P1** | Grill-Me: velkomstbesked, chathistorik, progress-indikation | 3-4t |
| **P1** | Forbedrede empty states med formål + kontekst | 2t |
| **P1** | Business-kort på dashboard: tilføj agent/approval counts | 2t |
| **P2** | Persistent business-kontekst via cookie/URL-state | 3t |
| **P2** | Agent-kort: eksplicit edit-knap, tydeligere affordance | 1t |
| **P2** | Save-feedback på alle formularer (toast eller inline) | 1-2t |
| **P3** | "New business" → CTA-knap i nav | 30 min |
| **P3** | Dark mode: implementér fuldt ud eller ryd op | 2-4t |

---

## Quick wins (kan laves på <2 timer samlet)

Disse tre ting alene løfter oplevelsen markant:

1. **Business selector → `<select>`** — løser det mest synlige UI-brud
2. **Nav aktiv state** — giver brugeren orientering
3. **Brand accent-farve** — giver platformen identitet

---

*Rapport genereret som del af Phase 2 design-gennemgang. Næste skridt: prioriter P0-opgaverne og implementér iterativt.*
