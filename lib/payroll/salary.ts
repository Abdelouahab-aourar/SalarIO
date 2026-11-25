/**
 * Algerian monthly salary calculation - IRG bareme 2026.
 *
 * Source: Winalco bareme IRG 2026 (article 104 CIDTA, Finance Law 2022).
 * All amounts are monthly Algerian dinars (DA).
 */

export const SNMG = 24_000;
export const EMPLOYEE_CNAS_RATE = 0.09;
export const EMPLOYER_CNAS_RATE = 0.255;
export const OVERTIME_RATE = 1.5;
/** Legal monthly basis for a 40-hour week (173.33 hours). */
export const MONTHLY_WORK_HOURS = 173.33;

export const ABATEMENT_MIN = 1_000;
export const ABATEMENT_MAX = 1_500;
export const ABATEMENT_RATE = 0.4;
export const IRG_EXEMPTION_THRESHOLD = 30_000;
export const GENERAL_SMOOTHING_CEILING = 35_000;
export const SPECIAL_SMOOTHING_CEILING = 42_500;

export type IrgBand = {
  /** Lower bound, exclusive (except for the first band). */
  from: number;
  /** Upper bound, inclusive. `null` for the open-ended band. */
  to: number | null;
  rate: number;
  /** Cumulative IRG at the lower bound. */
  cumulative: number;
};

export const IRG_BANDS: readonly IrgBand[] = [
  { from: 0, to: 20_000, rate: 0, cumulative: 0 },
  { from: 20_000, to: 40_000, rate: 0.23, cumulative: 0 },
  { from: 40_000, to: 80_000, rate: 0.27, cumulative: 4_600 },
  { from: 80_000, to: 160_000, rate: 0.3, cumulative: 15_400 },
  { from: 160_000, to: 320_000, rate: 0.33, cumulative: 39_400 },
  { from: 320_000, to: null, rate: 0.35, cumulative: 92_200 },
] as const;

export type SmoothingKind = "none" | "general" | "special";

export type IrgResult = {
  band: IrgBand;
  grossIrg: number;
  abatement: number;
  afterAbatement: number;
  irg: number;
  exempt: boolean;
  smoothing: SmoothingKind;
};

export type BonusItem = {
  id: string;
  label: string;
  /** Flat DA amount when fixed, rate (0-100) when percent. */
  amount: number;
  /** True = subject to CNAS + IRG (in gross). False = added to net (like panier). */
  taxable: boolean;
  /** Fixed DA amount, or percent of the base salary. */
  mode: "fixed" | "percent";
};

/** Resolves a bonus to its DA amount for a given base salary. */
export function resolveBonusAmount(bonus: BonusItem, baseSalary: number): number {
  const base = Math.max(0, baseSalary);
  if (bonus.mode === "percent") {
    return round2((base * Math.max(0, bonus.amount)) / 100);
  }
  return Math.max(0, bonus.amount);
}

export type DeductionItem = {
  id: string;
  label: string;
  /** Flat DA amount, deducted from net pay. */
  amount: number;
};

/** Informational bulletin fields — printed on the PDF, not used in calculations. */
export type EmployeeInfo = {
  companyName: string;
  payMonth: string;
  cotisantNumber: string;
  matricule: string;
  lastName: string;
  firstName: string;
  paymentMethod: string;
  account: string;
  maritalStatus: string;
  childrenCount: number;
  hireDate: string;
  socialSecurityNumber: string;
  category: string;
  echelon: string;
  position: string;
  /** Department name — printed on the payslip. */
  department: string;
};

export const EMPTY_EMPLOYEE_INFO: EmployeeInfo = {
  companyName: "",
  payMonth: "",
  cotisantNumber: "",
  matricule: "",
  lastName: "",
  firstName: "",
  paymentMethod: "",
  account: "",
  maritalStatus: "",
  childrenCount: 0,
  hireDate: "",
  socialSecurityNumber: "",
  category: "",
  echelon: "",
  position: "",
  department: "",
};

/** Default "MONTH OF" label, e.g. "NOVEMBER 2026". */
export function defaultPayPeriod(from: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  })
    .format(from)
    .toUpperCase();
}

export type SalaryInput = {
  baseSalary: number;
  /** Experience allowance (IEP) as a percentage of base salary. */
  iepRate: number;
  overtimeHours: number;
  /** Unjustified absence days, applied with the department's divisor. */
  absenceDays: number;
  bonuses: BonusItem[];
  deductions: DeductionItem[];
  /** Disabled worker or general-scheme retiree. */
  specialRegime: boolean;
  info: EmployeeInfo;
  /**
   * Department rule inputs (FR-05/BR-03). When omitted the validated 2026
   * defaults apply: daily rate = monthly base ÷ 30, no deduction disabled,
   * overtime at 150%.
   */
  absenceDivisor?: number | null;
  overtimeRate?: number;
};

export type SalaryResult = {
  input: SalaryInput;
  hourlyRate: number;
  iepAmount: number;
  overtimeAmount: number;
  /** Sum of taxable bonuses (in gross). */
  taxableBonuses: number;
  /** Sum of non-taxable bonuses (outside gross, added to net). */
  nonTaxableBonuses: number;
  /** Sum of deductions (off net pay). */
  otherDeductions: number;
  /** Unjustified absence deduction (off gross). */
  absenceDeduction: number;
  gross: number;
  cnas: number;
  taxableSalary: number;
  irg: IrgResult;
  netFromGross: number;
  net: number;
  totalWithholdings: number;
  employerCnas: number;
  employerCost: number;
};

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** IRG is rounded to the nearest dinar, matching the worked examples. */
export function roundDinar(value: number): number {
  return Math.round(value + Number.EPSILON);
}

export function getIrgBand(taxableSalary: number): IrgBand {
  if (taxableSalary <= 20_000) return IRG_BANDS[0];
  return (
    IRG_BANDS.find(
      (band) => band.to === null || taxableSalary <= band.to,
    ) ?? IRG_BANDS[IRG_BANDS.length - 1]
  );
}

export function calculateIrg(
  taxableSalary: number,
  specialRegime = false,
): IrgResult {
  const band = getIrgBand(taxableSalary);

  // IRGcalc = C + r (B - L)
  const grossIrg = roundDinar(
    band.cumulative + band.rate * Math.max(0, taxableSalary - band.from),
  );

  // 40% of the tax, bounded between 1,000 and 1,500 DA per month.
  const abatement =
    grossIrg > 0
      ? roundDinar(
          Math.min(
            ABATEMENT_MAX,
            Math.max(ABATEMENT_MIN, grossIrg * ABATEMENT_RATE),
          ),
        )
      : 0;

  const afterAbatement = Math.max(0, grossIrg - abatement);

  // No IRG up to 30,000 DA of taxable salary.
  if (taxableSalary <= IRG_EXEMPTION_THRESHOLD) {
    return {
      band,
      grossIrg,
      abatement,
      afterAbatement,
      irg: 0,
      exempt: true,
      smoothing: "none",
    };
  }

  // The smoothing formulas are applied to the tax after the 40% abatement.
  if (
    specialRegime &&
    taxableSalary <= SPECIAL_SMOOTHING_CEILING
  ) {
    const smoothed = roundDinar(
      afterAbatement * (93 / 61) - 81_213 / 41,
    );
    return {
      band,
      grossIrg,
      abatement,
      afterAbatement,
      irg: Math.max(0, smoothed),
      exempt: false,
      smoothing: "special",
    };
  }

  if (taxableSalary <= GENERAL_SMOOTHING_CEILING) {
    const smoothed = roundDinar(
      afterAbatement * (137 / 51) - 27_925 / 8,
    );
    return {
      band,
      grossIrg,
      abatement,
      afterAbatement,
      irg: Math.max(0, smoothed),
      exempt: false,
      smoothing: "general",
    };
  }

  return {
    band,
    grossIrg,
    abatement,
    afterAbatement,
    irg: afterAbatement,
    exempt: false,
    smoothing: "none",
  };
}

export function calculateSalary(input: SalaryInput): SalaryResult {
  const baseSalary = Math.max(0, input.baseSalary);
  const iepAmount = round2(
    baseSalary * (Math.max(0, input.iepRate) / 100),
  );
  const hourlyRate = baseSalary / MONTHLY_WORK_HOURS;
  const overtimeRate = input.overtimeRate ?? OVERTIME_RATE;
  const overtimeAmount = round2(
    Math.max(0, input.overtimeHours) * hourlyRate * overtimeRate,
  );

  const bonuses = Array.isArray(input.bonuses) ? input.bonuses : [];
  const taxableBonuses = round2(
    bonuses.reduce(
      (sum, bonus) =>
        sum + (bonus.taxable ? resolveBonusAmount(bonus, baseSalary) : 0),
      0,
    ),
  );
  const nonTaxableBonuses = round2(
    bonuses.reduce(
      (sum, bonus) =>
        sum + (!bonus.taxable ? resolveBonusAmount(bonus, baseSalary) : 0),
      0,
    ),
  );

  // Department rule: divisor 30 (default), 26, or null = no absence deduction.
  const absenceDivisor =
    input.absenceDivisor === null ? null : (input.absenceDivisor ?? 30);
  const absenceDeduction =
    absenceDivisor && absenceDivisor > 0
      ? round2((baseSalary / absenceDivisor) * Math.max(0, Math.min(30, input.absenceDays)))
      : 0;

  const gross = round2(
    baseSalary +
      iepAmount +
      overtimeAmount +
      taxableBonuses -
      absenceDeduction,
  );

  // Employee CNAS: 9% of gross, deducted before IRG.
  const cnas = round2(gross * EMPLOYEE_CNAS_RATE);
  const taxableSalary = round2(gross - cnas);
  const irg = calculateIrg(taxableSalary, input.specialRegime);

  const netFromGross = round2(gross - cnas - irg.irg);
  const deductions = Array.isArray(input.deductions) ? input.deductions : [];
  const otherDeductions = round2(
    deductions.reduce((sum, item) => sum + Math.max(0, item.amount), 0),
  );
  const net = round2(
    netFromGross + nonTaxableBonuses - otherDeductions,
  );

  // Employer contribution is paid on top of gross and does not reduce net pay.
  const employerCnas = round2(gross * EMPLOYER_CNAS_RATE);

  return {
    input,
    hourlyRate,
    iepAmount,
    overtimeAmount,
    taxableBonuses,
    nonTaxableBonuses,
    absenceDeduction,
    otherDeductions,
    gross,
    cnas,
    taxableSalary,
    irg,
    netFromGross,
    net,
    totalWithholdings: round2(cnas + irg.irg),
    employerCnas,
    employerCost: round2(gross + employerCnas),
  };
}

/**
 * Worked example 4 from the source document, used as the form's example preset.
 */
export const WORKED_EXAMPLE: SalaryInput = {
  baseSalary: 60_000,
  iepRate: 10,
  overtimeHours: 0,
  absenceDays: 0,
  bonuses: [
    {
      id: "performance",
      label: "Performance bonus",
      amount: 5_000,
      taxable: true,
      mode: "fixed",
    },
    {
      id: "panier",
      label: "Meal allowance (Panier)",
      amount: 5_000,
      taxable: false,
      mode: "fixed",
    },
    {
      id: "transport",
      label: "Transport",
      amount: 3_000,
      taxable: false,
      mode: "fixed",
    },
  ],
  deductions: [{ id: "advance", label: "Salary advance", amount: 1_000 }],
  specialRegime: false,
  info: {
    ...EMPTY_EMPLOYEE_INFO,
    companyName: "SOS GROUPE",
    payMonth: "NOVEMBER 2026",
    cotisantNumber: "23 56724250",
    matricule: "15000",
    lastName: "KEBAS",
    firstName: "Faycel",
    paymentMethod: "Bank transfer",
    maritalStatus: "Married",
    childrenCount: 1,
    hireDate: "01/01/2016",
    socialSecurityNumber: "1234567890",
    category: "E 0",
    echelon: "00",
    position: "HEAD OF DEPARTMENT",
    department: "Operations",
  },
};
