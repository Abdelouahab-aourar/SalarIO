# Database — Prisma + Neon Postgres

## Connection
`DATABASE_URL` in `.env`. Use the **direct** compute endpoint (hostname
without `-pooler`): the pooled/pgbouncer endpoint intermittently hangs query
startup. `lib/db.ts` adds three resilience measures for the trial network:
`dns.setDefaultResultOrder("ipv4first")` (broken IPv6 path), a TCP pool with
`keepAlive`, and a Prisma `$extends` retry for connection-class errors
(ETIMEDOUT/P1001/P1002/P2024/P2037, 5 attempts, ~5s). `instrumentation.ts`
runs `SELECT 1` every 45s so the Neon compute and one pooled socket stay warm
(the first request after idle no longer fails). Retries only cover failures
where no statement ran — never mid-statement errors, to keep writes safe.
`prisma.config.ts` carries the datasource URL (Prisma 7 format).
`lib/db.ts` builds `PrismaClient` over `@prisma/adapter-pg` (node-postgres
TCP pool). The earlier serverless-HTTP adapter was replaced: on networks
whose IPv6 path is broken, DNS returns AAAA first and undici fetch fails
instead of falling back, which produced intermittent sign-in 500s. TCP via
`pg` honors lookup ordering, and `lib/db.ts` additionally forces an explicit
IPv4 lookup (plus `NODE_OPTIONS=--dns-result-order=ipv4first` in npm scripts).
Builds succeed without a live DB (client creation is lazy/guarded);
runtime DB features throw a clear error when unconfigured.

## Migrations
- `bunx prisma db push` — used for the initial trial sync.
- `bunx prisma migrate dev --name <change>` — versioned migrations for every
  subsequent schema change (commit `prisma/migrations/*`).
- `bun prisma/seed.ts` — SOS Groupe demo workspace.

## Entities & constraints
- **User/Session/Account/Verification** — Better Auth standard; `User.role`
  (HR, AUTHORIZED, APPROVER, EMPLOYEE), `User.locale`, `User.employeeId`
  (unique, nullable → employee self-service link).
- **Company → Department** — one workspace (BR-02); `@@unique([companyId, name])`.
- **Employee** — `matricule @unique`; exactly one `departmentId` (BR-04,
  `onDelete: Restrict`); `baseSalaryCents Int` (no floats in storage);
  employment types FULL_TIME/PART_TIME/CONTRACT (FR-12).
- **UserDepartmentPermission** — `@@unique([userId, departmentId])`; per-dept
  absence/bonus/report flags (ID-04 interim).
- **PayrollRule → PayrollRuleVersion** — header + immutable `config Json`
  versions; `@@unique([ruleId, version])`; `effectiveFrom` (BR-08, FR-21).
  Approved items reference the version, never the live rule (BR-07).
- **Bonus/Absence** — keyed by `period "YYYY-MM"` + `employeeId` index;
  direct-feed semantics (BR-06). Only `UNJUSTIFIED` absences reduce pay.
- **Allowance/Deduction** — per employee + period allowances (taxable,
  `mode`: fixed | percent_base | percent_net; `amountCents` stores DA
  centimes for fixed and rate×100 for percentages) and fixed deductions.
  HR-only writes, audited; consumed by salary calculation and payroll.
- **PayrollPeriod** — `@@unique([companyId, year, month])`; status
  IN_REVIEW/PENDING/REJECTED/APPROVED. Legacy total columns exist but
  reporting now **derives totals from immutable PayrollItem rows** (avoids
  32-bit overflow at company scale).
- **PayrollItem** — `@@unique([periodId, employeeId])`; all components in
  cents + `breakdown Json` immutable snapshot (FR-20) + optional
  `ruleVersionId`.
- **PayrollApproval** — approver, decision, reason, timestamp (audit of FR-14).
- **Payslip** — 1:1 with approved `PayrollItem`; PDFs render from the
  snapshot, never recalculated.
- **AuditLog** — actor/action/entity/metadata for sensitive operations.

## Integrity
Foreign keys with Restrict on employee-linked rows; transactions for
calculate/submit/decide; indexes on all scope and lookup columns.
