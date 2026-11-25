import { calculateSalary, type BonusItem, type DeductionItem, type SalaryResult } from "@/lib/payroll/salary";
import { toCents } from "@/lib/payroll/money";

/**
 * Bonus storage convention: Bonus.amountCents is an integer.
 * - mode "fixed"   → centimes of DA (5,000 DA → 500000).
 * - mode "percent" → rate × 100 (10% → 1000), so amountCents/100 = engine rate.
 */
export function bonusToEngineAmount(b: { amountCents: number; mode: string }): number {
  return b.amountCents / 100;
}

export type PeriodEmployeeInput = {  employeeId: string;
  baseSalary: number; // DA
  iepRate: number;
  overtimeHours: number;
  absenceDays: number;
  taxableBonuses: BonusItem[];
  nonTaxableBonuses: BonusItem[];
  deductions: DeductionItem[];
  specialRegime: boolean;
  absenceDivisor?: number | null;
  overtimeRate?: number;
};

/**
 * Payroll service: maps HR inputs → validated engine → integer-centime rows.
 * One SalaryResult per employee; the caller persists PayrollItem.breakdown as
 * the immutable snapshot (FR-20) together with the applied rule version id.
 */
export function calculateEmployee(input: PeriodEmployeeInput): {
  result: SalaryResult;
  row: Record<string, number>;
} {
  const result = calculateSalary({
    baseSalary: input.baseSalary,
    iepRate: input.iepRate,
    overtimeHours: input.overtimeHours,
    absenceDays: input.absenceDays,
    bonuses: [...input.taxableBonuses, ...input.nonTaxableBonuses],
    deductions: input.deductions,
    specialRegime: input.specialRegime,
    absenceDivisor: input.absenceDivisor,
    overtimeRate: input.overtimeRate,
    info: {
      companyName: "", payMonth: "", cotisantNumber: "", matricule: "",
      lastName: "", firstName: "", paymentMethod: "", account: "",
      maritalStatus: "", childrenCount: 0, hireDate: "", socialSecurityNumber: "",
      category: "", echelon: "", position: "", department: "",
    },
  });
  return {
    result,
    row: {
      baseSalaryCents: toCents(result.input.baseSalary),
      iepCents: toCents(result.iepAmount),
      overtimeCents: toCents(result.overtimeAmount),
      taxableBonusesCents: toCents(result.taxableBonuses),
      nonTaxableCents: toCents(result.nonTaxableBonuses),
      absenceDeductionCents: toCents(result.absenceDeduction),
      grossCents: toCents(result.gross),
      cnasCents: toCents(result.cnas),
      taxableCents: toCents(result.taxableSalary),
      irgCents: toCents(result.irg.irg),
      netFromGrossCents: toCents(result.netFromGross),
      otherDeductionsCents: toCents(result.otherDeductions),
      netCents: toCents(result.net),
      employerCnasCents: toCents(result.employerCnas),
      employerCostCents: toCents(result.employerCost),
    },
  };
}

export function summarizePeriod(rows: Array<Record<string, number>>): {
  totalGrossCents: number;
  totalNetCents: number;
  employeeCount: number;
} {
  return {
    totalGrossCents: rows.reduce((s, r) => s + r["grossCents"]!, 0),
    totalNetCents: rows.reduce((s, r) => s + r["netCents"]!, 0),
    employeeCount: rows.length,
  };
}
