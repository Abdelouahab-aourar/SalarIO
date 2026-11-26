# Security

Payroll data is highly confidential. Enforcement is server-side; UI hiding is
never treated as authorization.

1. **Authentication** — Better Auth email/password, 8h sessions, HR-provisioned
   accounts only (`disableSignUp: true`). Secrets in `.env`, never in git.
2. **Server RBAC** — `lib/rbac.ts`: `requireUser/requireRole` on every
   sensitive route/action; roles HR/AUTHORIZED/APPROVER/EMPLOYEE.
3. **Department scope** — `getAccessibleDepartmentIds()` gates absence/bonus
   writes; IDOR blocked by re-checking ownership on each read/write.
4. **Payslip isolation** — employees resolve only via their linked
   `employeeId`; HR sees all; no unpublished (non-APPROVED) data to employees.
5. **Validation** — Zod on client and server for every form (salary schema
   ported from the reference project).
6. **Passwords** — hashed by Better Auth (scrypt); seed uses a documented dev
   password to be rotated.
7. **State machine** — `PAYROLL_TRANSITIONS` enforced server-side;
   approvers cannot edit payroll rows; decisions + reasons logged.
8. **Immutability** — APPROVED items/snapshots never updated; rule versions
   append-only.
9. **Audit** — `AuditLog` for calculate/submit/approve/reject/provision.
10. **Transport/files** — PDF/Excel generated from snapshots; downloads carry
    no extra scope; no salary data in logs.

## Adversarial review log
- STAGE 1 (architecture): schema + RBAC boundaries reviewed before build.
- STAGE 4 (security): IDOR on payslips, mass-assignment on user provisioning,
  transition bypass, and float-money risks checked.
- STAGE 5 (final): verdict CHANGES_REQUIRED with 7 blocking items — all fixed
  and re-verified live:
  - ADV-001 payslip isolation → `/payslips` server-gated; employees query only
    their own APPROVED items; verified live (employee sees own-only).
  - ADV-002 route RBAC → `requireRole` on every sensitive route; client pages
    (salary-rules, reports) split into server gate + client body; verified
    live (employee → /unauthorized, unauthenticated → /login).
  - ADV-003 department scope → absence entry + listing scoped by
    `getAccessibleDepartmentIds` + per-flag checks; fail-closed on DB outage.
  - ADV-004 rules/versions → `calculatePeriod` resolves the ACTIVE rule
    version per department at period end and pins `ruleVersionId` on every
    item; employment type recorded; part-time/contract proration stays open
    (ID-02, no invented math).
  - ADV-005 workflow atomicity → all status changes via `canTransition`
    (recalculation only from IN_REVIEW/REJECTED); calculate + decide each run
    in a single `$transaction` (payslips via `createMany` inside); extended
    timeouts for Neon latency.
  - ADV-006 secrets → `BETTER_AUTH_SECRET` rotated to 32 random bytes;
    per-user seed passwords; `.env` gitignored. NOTE: rotate the Neon
    database password in the Neon dashboard as well (plaintext in local .env).
  - ADV-008 entry flows → `lib/entry-actions.ts`: recordAbsence/recordBonus
    (scoped, Zod, recordedById, audited), createDepartment/createEmployee,
    provisionUser (HR-only, direct User+Account insert, BR-01 guard),
    saveRuleVersion (append-only + effective date).
  - ADV-007 fail-closed scope; ADV-009 explicit bonus convention + tests;
    ADV-010 reports/payslips read live APPROVED records with labelled demo
    fallback and disabled exports off-DB.
- Residual: ADV-011 (i18n full-page coverage beyond nav/status/actions),
  ADV-012 (single-rounding engine hardening) — tracked, non-blocking.


## Phase B/C hardening
- Salary fields are removed from the RSC payload for department-scoped
  (AUTHORIZED) users — not merely hidden in the UI.
- Payroll status changes are compare-and-set writes inside the transaction
  (`updateMany` guarded by the allowed source status); concurrent approvals or
  recalculation cannot overwrite a submitted/approved period.
- Allowances are the single input source for primes/allowances; AUTHORIZED
  users may add/remove only their own entries within granted departments and
  with the bonus permission. HR remains the only role that can edit rules,
  departments and settings.
- Departments without an effective rule version block calculation and
  submission; items with `ruleVersionId = null` cannot be submitted.
- Rule-version config is strictly validated (enums, ranges, real calendar
  date, component shape) and version numbers are allocated transactionally.
- Duplicate allowance/deduction entries are rejected for the same
  employee/period/label/amount.

## Payslip downloads
`GET /api/payslips/[itemId]/pdf` authenticates the session, requires an
APPROVED period with a materialized Payslip row, blocks AUTHORIZED roles, and
for EMPLOYEE requires `item.employeeId === session.user.employeeId`. It renders
only from the stored `PayrollItem.breakdown` (no recalculation) and sets
`Cache-Control: private, no-store`.

## Privilege fields are not client-writable
Better Auth `user.additionalFields` declares `role` and `employeeId` with
`input: false`, so `POST /api/auth/update-user` rejects attempts to set them
(`FIELD_NOT_ALLOWED`). Verified live with an employee session: the role stayed
`EMPLOYEE` and `/overview` still redirected to `/unauthorized`.
