# Architecture — SALARIO Payroll Management

## Stack (client-confirmed)
Next.js 16 (App Router) + React 19 + TypeScript strict, Tailwind CSS 4,
**Prisma ORM + PostgreSQL on Neon**, **Better Auth** (email/password),
React Hook Form + Zod, jsPDF + jspdf-autotable (payslip/report PDF),
xlsx (Excel export), next-intl-ready custom dictionaries (fr/ar/en + RTL),
decimal.js (money boundary), Bun runtime.

## Architectural decision (DB/ORM)
The SRS prescribes no database or ORM. An early proposal suggested Drizzle;
the client explicitly chose **Prisma + Neon Postgres**. Prisma gives versioned
migrations (`prisma/migrations`), strict relations, and a maintained Better
Auth adapter. Monetary amounts are stored as **integer minor units
(centimes)**; the calculation engine computes in DA and converts losslessly
at the persistence boundary.

## Structure
- `app/(marketing)/page.tsx` — public SALARIO landing page (`/`), rendered
  from the Figma "SALARIO · Landing page" frame with assets exported into
  `public/landing/` (logo, 3D artwork, module icons). Motion (`motion/react`)
  drives entrance/scroll reveals, floating artwork, hovers and the FAQ
  accordion; `components/ui/skeleton.tsx` provides route + image skeletons.
- `app/(auth)/login` — Figma split-screen login (client form → Better Auth).
- `app/(workspace)/*` — shadcn Sidebar shell (collapsible + mobile sheet,
  role-filtered nav from `lib/nav.ts`, sign-out with failure handling):
  overview (`/overview`), employees, departments, salary-rules,
  salary-calculation, absences, payroll, history, payslips, reports,
  settings. `proxy.ts` gates anonymous requests to `/login`; layouts/pages
  enforce sessions and roles. `/overview` is HR + approver only (company
  payroll totals); authorized users land on `/absences`, employees on
  `/payslips`.
- Dialogs — employee creation (full salary-calculator record), department
  creation (name + rule details + default components), absence entry with a
  searchable employee combobox, allowance and deduction entry, and rule
  versioning. All dialogs use RHF + Zod and call server actions that
  re-validate identity, role and scope.
- Salary calculation (`/salary-calculation`, HR) — choose department →
  search employee → record, department rule, stored absences, allowances and
  deductions load automatically; the engine breakdown updates live and payslip
  PDFs render from the calculation.
- `lib/payroll/salary.ts` — Algerian 2026 engine, ported verbatim from the
  validated `salary-calculator` reference (CNAS 9/25.5%, IRG barème art.104
  CIDTA, abatement, smoothing, overtime 150%/173.33h, absence ÷30).
- `lib/payroll/service.ts` — engine → integer-centime rows + immutable
  `breakdown` snapshots (FR-20).
- `lib/payroll/salary-pdf.ts` — bulletin PDF (Code/Description/Base/Qty/Rate/
  Earnings/Deductions), same format as the reference project.
- `lib/auth.ts`, `lib/rbac.ts` — server-side session + role/department scope
  + `PAYROLL_TRANSITIONS` state machine.
- `lib/db.ts` — Prisma + Neon serverless (pool, graceful no-DB build).
- `lib/i18n/provider.tsx` — fr/ar/en dictionaries, RTL for Arabic.
- `prisma/schema.prisma` — Better Auth tables + payroll domain.

## Key flows
Login → role routing → HR manages org → authorized entries feed payroll
directly (BR-06) → calculate (engine) → HR review (IN_REVIEW) → submit
(PENDING) → approver approves/rejects → APPROVED snapshot immutable;
REJECTED returns to HR for correction → resubmit.


## Overview charts (shadcn/ui + Recharts)
`components/overview/overview-charts.tsx` renders five animated charts on the
HR/approver overview:
- **Radial stacked** — active vs inactive workforce with a centre total.
- **Radar with dots** — active headcount per department (top 8).
- **Donut** — full-time / part-time / contract split with legend.
- **Bar** — absence days by type.
- **Area** — recorded absence days for the last six months.
Chart data is aggregated server-side in `app/(workspace)/overview/page.tsx`
from employees and absences; the client component only renders (no data
mutations). Recharts mount animations are enabled and the palette follows the
Premium Forest tokens.


## Workforce, absences and navigation updates
- Employees are always active; the status filter, badges and edit toggle were
  removed. Queries no longer hide "inactive" rows.
- Absences are grouped by payroll period (`YYYY-MM`). The Absences page uses a
  shadcn/react-day-picker month picker (Calendar + Popover) to select a month,
  lists only that month, and records entries into it. The salary calculator
  uses the same picker so absence deductions come from the selected month.
- Logout moved into the HR profile card: clicking the arrow opens a dropdown
  (shadcn DropdownMenu) with the account identity and Sign out.
- Overview keeps the department radar, absence-type bar and six-month absence
  trend; the workforce radial and contract donut were removed by request.


## Responsive workspace shell
- `app/(workspace)/layout.tsx` uses shadcn `SidebarProvider` + `SidebarInset`
  (no custom footer). The workspace ends after the page content.
- The collapsed icon rail is 48px. `SidebarContent` drops its horizontal
  padding in icon mode so the shadcn menu buttons (32px) center exactly;
  the header logo and footer avatar are likewise full-width, centered, and
  sized to the 32px content box (`px-2`).
- Employees, departments and absences render as stacked cards below `md`
  and as tables from `md` up, so no viewport shows a clipped table or needs
  horizontal scrolling. Mobile controls are full-width and dialogs remain
  within the viewport.
