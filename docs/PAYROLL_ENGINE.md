# Payroll engine — Algerian 2026 (from salary-calculator reference)

The client directed that salary rules, allowances, deductions and the payslip
format reuse the desktop `salary-calculator` project. `lib/payroll/*` is
ported **verbatim** from it (`salary.ts`, `salary-schema.ts`, `salary-pdf.ts`,
`format.ts`); `service.ts` + `money.ts` adapt it to multi-employee payroll
with integer-centime persistence.

## Statutory basis (validated, not invented)
Winalco IRG barème 2026, article 104 CIDTA (Finance Law 2022):
- SNMG 24,000 DA · employee CNAS 9% · employer CNAS 25.5% · overtime 150%,
  legal base 173.33 h/month · absence deduction = base ÷ 30 × days.
- IRG bands: ≤20,000 → 0%; 20–40k → 23% (cum. 0); 40–80k → 27% (cum. 4,600);
  80–160k → 30% (15,400); 160–320k → 33% (39,400); >320k → 35% (92,200).
- 40% abatement bounded [1,000, 1,500] · exemption taxable ≤ 30,000 ·
  general smoothing (30,000–35,000]: `after×137/51 − 27,925/8` ·
  special regime smoothing (30,000–42,500]: `after×93/61 − 81,213/41`.
- IRG rounded to the dinar; other lines to 2 dp.

## Component model
- **Taxable bonuses** (performance, responsibility…) enter **gross**:
  `gross = base + IEP + overtime + taxable − absence`.
- **Non-taxable allowances** (panier, transport) are added to **net**:
  `net = (gross − CNAS − IRG) + nonTaxable − otherDeductions`.
- **Deductions** (advances, loans, mutual) reduce net only.
- Bonus modes: `fixed` DA or `percent` of base; capped at 20 lines each.

## Precision
Engine tests (ported) lock every band, abatement bound, smoothing value and
the worked example (base 60,000 + 10% IEP + bonuses → net 61,865 DA).
Storage uses integer centimes via `toCents()` (decimal.js, half-up);
`fromCents()` restores DA for display. No float totals are persisted.

## PDF bulletin (ODF/format)
Payslip PDFs for approved payroll are served by
`/api/payslips/[itemId]/pdf` from the immutable item snapshot (identity fields
come from the linked employee record; amounts from the snapshot). The bulletin
grid uses the rule's absence divisor, so Qty × Rate reconciles with the line.

`salary-pdf.ts` renders the reference bulletin: company box, PAYSLIP +
MONTH OF, contributor No., employee tables, main grid
(Code/DESCRIPTION/Base/Qty/Rate/Earnings/Deductions: 101 basic, 102 IEP,
110 overtime, 200+ taxable, 300 absence, 401 IRG, 404 CNAS 9%, 210+
allowances, 490+ deductions, Totals/To pay/NET PAY), signature boxes,
CNAS footnote, footer. Payslips render **only** from approved snapshots.


## Department rule inputs (Phase C)
`calculateSalary` accepts optional `absenceDivisor` and `overtimeRate`:
- `absenceDivisor = 30` (default), `26`, or `null` (no absence deduction);
  set from the department rule version (`absenceMethod`/`referenceDays`).
- `overtimeRate` defaults to 1.5 and comes from the rule version.
Both `/salary-calculation` and the payroll period calculation pass the
department's effective rule version. Departments without an effective rule
version **cannot** be calculated (explicit error / disabled action).
Department default components apply only when HR has entered no explicit
allowance for that employee and period (avoids double counting).

## Allowances, deductions and net-percent
- Taxable allowance: fixed DA or % of base; enters gross.
- Non-taxable allowance: fixed DA, % of base, or % of **net-from-gross**
  (after CNAS/IRG). Percent-of-net is computed on `netFromGross` and folded
  into `nonTaxableCents` and `netCents`, with details stored in the immutable
  `breakdown.percentNetAllowances` so totals reconcile with the PDF.
- Deductions: fixed DA off net.
- Factored long-term totals are derived from immutable items (`PayrollItem`)
  on read, avoiding 32-bit total-column overflow.
