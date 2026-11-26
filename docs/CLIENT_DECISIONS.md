# Client decisions (SRS §9) — status and safe behavior

| ID | Topic | Why it matters | Affected modules | Current safe behavior | To validate |
|----|-------|----------------|------------------|----------------------|-------------|
| ID-01 | Payroll formulas & statutory deductions | Legal correctness of every dinar | engine, rules, payslips | Applied validated DZ-2026 reference (CIDTA art.104) from salary-calculator per client direction; engine id stamped on rule versions | Client rep. confirms barème version + any sector overrides |
| ID-02 | Part-time & contract calculation | Different proration changes net | employees, engine | `employmentType` stored and shown; no proration invented yet (full monthly base applies) | Confirm formulas per type |
| ID-03 | Employees across departments | SRS: one dept only (FR-06) | employees, allocation | Single `departmentId` enforced by FK; no split allocation implemented | Confirm no split-payroll need |
| ID-04 | Permission details & report visibility | Least-privilege access | rbac, permissions, reports | HR full; authorized scoped by UserDepartmentPermission (absences/bonus; salary columns hidden in employee/department lists); approver read-only submitted; employee own-only payslips | Exact per-user matrix |
| ID-05 | Payslip template & legal fields | Legal validity of bulletin | salary-pdf, payslips | Reference bulletin (codes 101/102/110/200+/300/401/404/210+/490+) with configurable `EmployeeInfo` fields | Confirm mandatory legal fields |
| ID-06 | Missing/invalid inputs | Prevent invented final figures | forms, service | Zod client+server validation; incomplete payroll stays IN_REVIEW and is labelled projected/incomplete | Confirm blocking vs. warning policy |
| ID-07 | Entry review step | Error risk on direct feed | absences, bonuses | Direct feed per FR-10/BR-06 (no per-entry approval); entries are logged with recorder id | Confirm no review step wanted |
| ID-08 | Excel import | Migration effort | employees, departments | No importer built; manual entry + seed only | Confirm whether dept files must import |
| ID-09 | Hosting/backups/retention | Data safety, trial → production | infra, database | Cloud (Neon) proposed per SRS; backups = Neon PITR; retention undefined | Confirm provider, RPO/RTO, retention |
| ID-10 | Notifications/integrations | Scope control | all | None built; approval state visible in-app only | Confirm channels (email/SMS) & systems |

No assumption above is presented as a requirement; each needs client sign-off.

## Allowance / deduction conventions implemented (pending sign-off)
- **Taxable allowance** → increases gross; modes: fixed DA or % of base salary.
- **Non-taxable allowance** → added to net; modes: fixed DA, % of base, or
  **% of net** (applied to net-from-gross after CNAS/IRG).
- **Deduction** → fixed DA taken off net (advance, loan, mutual).
- **Allowance is the single canonical input** for primes/allowances (the
  duplicate `recordBonus` action was removed). AUTHORIZED users may add
  allowances only in their granted departments and only when the bonus
  permission is enabled.
- Percentages are stored as rate×100 in `amountCents`; fixed amounts as DA
  centimes. Absences deduct only `UNJUSTIFIED` days; justified/sick/leave are
  recorded but not deducted.
- Departments without an active rule version show an explicit "defaults
  applied" warning instead of silently pretending a rule exists.
These conventions are documented so the client can validate or replace them.

## Scope decisions confirmed in this iteration
- Payroll Processing/History, Payslips, Reports and Settings pages are removed
  for now (deferred, not deleted from the data model).
- Salary rules are managed inside Departments (create + edit, versioned).
- The UI is English-only until further notice (FR-22 deferred).
- Salary Calculation (employee search, allowances, deductions, PDF) is in
  scope; industrial approval/payslip distribution remains deferred.
