# Agent workflow

The orchestrator (lead architect) coordinated specialist agents with clear
ownership; the adversarial agent reviewed read-only at every stage.

- **ui-ux** — Figma MCP inspection (7 frames), Premium Forest tokens,
  sidebar/topbar/cards/badges/tables, responsive + RTL-safe layouts.
- **backend** — Prisma schema, Neon wiring, Better Auth, server RBAC,
  department scoping, audit infrastructure.
- **payroll-domain** — verbatim port of the validated salary-calculator
  engine (no invented statutes), rule versioning, immutable snapshots,
  calculation tests.
- **i18n** — fr/ar/en dictionaries, language switcher, `dir=rtl` for Arabic,
  translated nav/status/actions/validation.
- **test-engineer** — engine vectors, money precision, transition and scope
  tests, workflow checks.
- **adversarial** — read-only reviews (architecture → modules → integration →
  security → final) with severity/file/evidence/impact/correction per finding.

## Coordination rules applied
Main orchestrator owns integration; schemas and engine interfaces were fixed
before parallel page work; no two agents edited the same file concurrently;
every subagent output was verified (tests + build) before integration;
no APPROVED verdict was accepted without evidence.

## Phase B/C build-out (dialogs, search, salary calculation)
1. **Phase A** — shadcn/ui adoption (sidebar, dialog, command, select,
   popover, sheet, tabs…), Premium Forest token mapping, responsive shell,
   logout. Adversarial review returned CHANGES_REQUIRED with 4 blocking
   findings; fixes applied: AUTHORIZED department scoping + salary column
   hiding, logout error handling, nav i18n, auth base URL derived from the
   actual origin, Figma sidebar gradient/width, mobile close button,
   `aria-current`, topbar identity, landing CTA copy/contrast, table overflow.
2. **Phase B** — Prisma `Allowance`/`Deduction` models, employee dialog
   (full salary-calculator record), department dialog (name + rule details +
   default components, transactionally creating department + rule +
   version 1), real employee/department search, HR-only actions.
3. **Phase C** — searchable employee combobox, absence dialog + stored
   entries feeding salary calculation (only unjustified days deducted),
   salary calculation workspace (department → employee → auto record, rule,
   absences, allowances and deductions with live engine breakdown + payslip
   PDF), allowance/deduction dialogs, payroll period calculation consuming
   allowances/deductions, real department-rule management page with dated
   versioning and first-rule creation.
4. Evidence: builds and typecheck green; 16 unit tests; live browser probes
   verified dialogs, employee fetch, allowance persistence (gross 110,000 →
   net 80,170), absence deduction (net 77,940), role redirects and logout
   session invalidation. A second adversarial review is run after Phase C.
5. **Phase C adversarial review** — CHANGES_REQUIRED with 5 blocking items
   (rule config not applied, percent-net unreconciled, RSC salary leakage,
   seeded-rule crash, non-atomic status changes). All five fixed and verified:
   rule-aware engine (absence divisor/overtime rate/default components),
   percent-net folded into persisted totals + breakdown + PDF, salary fields
   omitted server-side for scoped roles, normalized rule components, guarded
   compare-and-set transitions with approval in one transaction. A verification
   pass then flagged future-dated versions being applied in the HR calculator
   and inert payslip buttons; both fixed (effective-date filter, snapshot PDF
   route with role/ownership checks). Build + 16 tests + typecheck green.

## Phase D — module restructure (client request)
Removed Payroll Processing, Payroll History, Payslips, Reports, Settings and
the standalone Salary Management page. Salary rules now live inside
Departments: create with name + rules, row-click details dialog, edit creates
a new dated rule version, default allowances editable. Employees gained a
row-click details dialog and an edit dialog. Inputs/selects use shadcn
components; the sidebar is the collapsible shadcn sidebar with rail/trigger;
the UI is English-only (language switcher and i18n provider removed).
A salary calculation page was added back (search employee → allowances and
deductions → live calculation → print/download PDF with employee details).

The adversarial review of this phase found a CRITICAL privilege escalation:
Better Auth allowed `role` in update-user. Fixed with `input: false` and
verified live (400 FIELD_NOT_ALLOWED, role unchanged). Also fixed: non-HR
department mutation controls, dead APPROVER absence link, fake login controls,
French copy leftovers, department allowance editing, and duplicate checks.

## Phase E — overview analytics
Added shadcn/ui chart wrappers (Recharts): stacked radial workforce status,
department headcount radar with dots, contract-type donut, absence-days bar
and six-month absence area chart, all animated and fed by live aggregates.
Verified in the browser: five `.recharts-surface` nodes render on `/overview`.

## Phase F — month-based absences and UI cleanup
Removed the workforce/contract charts, eliminated the employee active-state UI,
added a reusable shadcn month picker (react-day-picker) to Absences and Salary
Calculation, grouped absence queries by month, and moved logout into the
sidebar profile dropdown. Build, typecheck, 16 tests and browser probes pass.

## Phase G — shell cleanup and responsive tables
Removed the workspace footer, migrated the content shell to shadcn
`SidebarInset`, centered the collapsed logo/menu icons/avatar in the 48px rail,
and replaced the clipped mobile employee/department/absence tables with
shadcn-styled card lists. Verified at 390px and 1440px (no horizontal
overflow), collapsed-rail centres at x=24, all workspace routes 200.
