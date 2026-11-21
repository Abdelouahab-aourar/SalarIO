# SRS traceability — every FR/BR mapped to implementation

## Functional requirements
- FR-01 (login email/password): `lib/auth.ts`, `app/(auth)/login/page.tsx`, `app/api/auth/[...all]/route.ts` · test: sign-in flow.
- FR-02 (permissions after login): `lib/rbac.ts` (`getSessionUser`, `requireRole`, `getAccessibleDepartmentIds`).
- FR-03 (one company workspace): `Company` model, sidebar org block, `prisma/seed.ts`.
- FR-04 (HR manages departments/rules): Department + PayrollRule models,
  `/departments` (search + add dialog writing name, base method, absence
  method, reference days, default components in one transaction), HR-gated.
- FR-05 (dept-specific rules): `PayrollRule.departmentId` + versioned
  `config`; `/salary-rules` lists live versions; `/salary-calculation` and
  payroll apply the department's currently effective rule (absence divisor,
  overtime rate, default components). Partial: `DAILY_BASE` base method is
  stored but proration awaits ID-02; calculation is blocked without a rule.
- FR-06 (one dept per employee): `Employee.departmentId` single FK, Restrict;
  employee creation dialog assigns exactly one department.
- FR-07 (confidential HR rule management): HR-only routes + actions for rules,
  departments, settings.
- FR-08 (HR controls access): `provisionUser` server action (HR-only, BR-01
  guard) + `UserDepartmentPermission`, `disableSignUp`, wired `/settings`.
- FR-09 (authorized entries in scope): `/absences` searchable dialog +
  `recordAbsence`/`recordBonus` scoped by department permissions.
- FR-10 (direct feed, no per-entry approval): Bonus/Absence/Allowance/
  Deduction consumed directly by salary calculation and payroll; recorder
  stamped + audited.
- FR-11 (automatic calculation): `lib/payroll/salary.ts` + `/salary-calculation`
  (department → employee → auto record + absences + allowances/deductions),
  `/payroll` period calculation.
- FR-12 (contract/part-time/full-time): `EmploymentType` in the employee
  dialog and record.
- FR-13/14/15 (submit/approve/reject + resubmit): `PayrollStatus`,
  `PAYROLL_TRANSITIONS`, approval records, `/payroll` + `/history`.
- FR-16 (payslip visibility): `/payslips` (HR all / employee own via
  `employeeId`), with `/api/payslips/[itemId]/pdf` serving approved snapshots;
  employees can only fetch their own item, AUTHORIZED blocked.
- FR-17 (company + dept totals): `/reports` from approved records.
- FR-18 (month-over-month): reports comparison card.
- FR-19 (PDF + Excel export): reports exports; payslip PDF from salary
  calculation and payroll snapshots.
- FR-20 (immutable history): `PayrollItem.breakdown` snapshots + version
  pinning (including percent-of-net details), totals derived from items;
  `/history`.
- FR-21 (rule effective dates): `effectiveFrom` on rules/versions; HR appends
  versions from `/salary-rules` with a date and note; department creation
  starts version 1.
- FR-22 (fr/ar/en): `lib/i18n/provider.tsx`, switcher in topbar, RTL
  handling, translated nav/common labels. **Partial**: Phase B/C module copy
  is still English; RTL uses some physical spacing utilities. Tracked as an
  open item — not claimed complete.

## Business rules
BR-01 one HR operator · BR-02 one workspace · BR-03 rules differ by dept ·
BR-04 one dept per employee · BR-05 HR controls rules/access · BR-06 direct
feed · BR-07 history immutable · BR-08 effective-dated rules — all enforced
in schema (`DATABASE.md`) + `rbac.ts` + `service.ts`, covered by tests.

## Statuses
IN_REVIEW / PENDING / REJECTED / APPROVED rendered via `.status-*` badges
and `StatusBadge`, labelled in all three locales.


## Scope update (client request, current build)
Temporarily out of scope: Payroll Processing, Payroll History, Payslips,
Reports, Settings, standalone Salary Management, multilingual UI (English
only). Their database models, engine and audit infrastructure remain in place;
the corresponding pages were removed. Departments own salary rules (create +
edit with versioning). A Salary Calculation page provides employee search,
custom allowances/deductions, live calculation and printable PDF payslips
with full employee details. Requirements touching removed modules are marked
**deferred**, not complete.
