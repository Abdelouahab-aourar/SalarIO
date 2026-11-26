/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { calculateIrg, calculateSalary, round2, WORKED_EXAMPLE, EMPTY_EMPLOYEE_INFO, type SalaryInput } from "@/lib/payroll/salary";
import { toCents, fromCents } from "@/lib/payroll/money";
import { canTransition } from "@/lib/rbac";
import { calculateEmployee, bonusToEngineAmount } from "@/lib/payroll/service";

const base: SalaryInput = { baseSalary: 30_000, iepRate: 0, overtimeHours: 0, absenceDays: 0, bonuses: [], deductions: [], specialRegime: false, info: EMPTY_EMPLOYEE_INFO };

describe("engine vectors (ported from validated reference)", () => {
  test("30,000 DA gross is IRG-exempt", () => {
    const r = calculateSalary({ ...base });
    expect(r.gross).toBe(30_000);
    expect(r.cnas).toBe(2_700);
    expect(r.irg.irg).toBe(0);
    expect(r.net).toBe(27_300);
  });
  test("worked example nets 61,865 DA", () => {
    const r = calculateSalary(WORKED_EXAMPLE);
    expect(r.gross).toBe(71_000);
    expect(r.irg.irg).toBe(9_745);
    expect(r.net).toBe(61_865);
    expect(r.employerCost).toBe(89_105);
  });
  test("IRG bands + smoothing anchors", () => {
    expect(calculateIrg(40_000).grossIrg).toBe(4_600);
    expect(calculateIrg(32_500).irg).toBe(1_143);
    expect(calculateIrg(40_000, true).irg).toBe(2_745);
  });
});

describe("decimal-safe persistence boundary", () => {
  test("DA→centimes is lossless for 2dp engine outputs", () => {
    const r = calculateSalary(WORKED_EXAMPLE);
    expect(fromCents(toCents(r.net))).toBe(r.net);
    expect(toCents(61_865)).toBe(6_186_500);
  });
  test("service row carries every persisted component in cents", () => {
    const { row } = calculateEmployee({ employeeId: "e1", baseSalary: 60_000, iepRate: 10, overtimeHours: 0, absenceDays: 0, taxableBonuses: [{ id: "p", label: "Perf", amount: 5_000, taxable: true, mode: "fixed" }], nonTaxableBonuses: [], deductions: [], specialRegime: false });
    expect(row["grossCents"]).toBe(7_100_000); // 60,000 + 10% IEP + 5,000 taxable
    expect(row["netCents"]).toBeGreaterThan(0);
  });
});

describe("bonus storage convention (ADV-009)", () => {
  test("fixed stores DA centimes, percent stores rate×100", () => {
    expect(bonusToEngineAmount({ amountCents: 500000, mode: "fixed" })).toBe(5000);
    expect(bonusToEngineAmount({ amountCents: 1000, mode: "percent" })).toBe(10);
  });
  test("percent bonus round-trips through the engine", () => {
    const { result } = calculateEmployee({
      employeeId: "e1", baseSalary: 60_000, iepRate: 0, overtimeHours: 0, absenceDays: 0,
      taxableBonuses: [{ id: "p", label: "Perf", amount: bonusToEngineAmount({ amountCents: 1000, mode: "percent" }), taxable: true, mode: "percent" }],
      nonTaxableBonuses: [], deductions: [], specialRegime: false,
    });
    expect(result.taxableBonuses).toBe(6_000); // 10% of 60,000
    expect(result.gross).toBe(66_000);
  });
});

describe("payroll state machine (FR-13/14/15)", () => {
  test("only valid transitions pass", () => {
    expect(canTransition("IN_REVIEW", "PENDING")).toBe(true);
    expect(canTransition("PENDING", "APPROVED")).toBe(true);
    expect(canTransition("PENDING", "REJECTED")).toBe(true);
    expect(canTransition("REJECTED", "PENDING")).toBe(true);
    expect(canTransition("IN_REVIEW", "APPROVED")).toBe(false);
    expect(canTransition("APPROVED", "PENDING")).toBe(false);
  });
});

describe("department rule inputs (FR-05/ADV-101)", () => {
  const baseRule: SalaryInput = { ...base, baseSalary: 60_000, absenceDays: 3 };

  test("default divisor remains base / 30", () => {
    const r = calculateSalary(baseRule);
    expect(r.absenceDeduction).toBe(6_000);
  });

  test("divisor 26 changes the deduction", () => {
    const r = calculateSalary({ ...baseRule, absenceDivisor: 26 });
    expect(r.absenceDeduction).toBe(round2((60_000 / 26) * 3));
    expect(r.absenceDeduction).not.toBe(6_000);
  });

  test("null divisor means no absence deduction", () => {
    const r = calculateSalary({ ...baseRule, absenceDivisor: null });
    expect(r.absenceDeduction).toBe(0);
    expect(r.gross).toBe(60_000);
  });

  test("custom overtime rate is applied", () => {
    const standard = calculateSalary({ ...base, baseSalary: 60_000, overtimeHours: 10 });
    const double = calculateSalary({ ...base, baseSalary: 60_000, overtimeHours: 10, overtimeRate: 2 });
    expect(double.overtimeAmount).toBeCloseTo(standard.overtimeAmount * (2 / 1.5), 2);
  });
});
