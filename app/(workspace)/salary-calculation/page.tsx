import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import {
  SalaryCalculator,
  type AbsenceRow,
  type AdjustmentRow,
  type CalcEmployee,
  type CalcRule,
} from "@/components/salary/salary-calculator";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Salary calculation workspace (HR): search an employee, add allowances and
 * deductions, compute the salary from the department rule + stored absences,
 * and print/download the payslip PDF with full employee details.
 */
export default async function SalaryCalculationPage() {
  await requireRole("HR");

  let employees: CalcEmployee[] = [];
  let rules: CalcRule[] = [];
  let allowances: AdjustmentRow[] = [];
  let deductions: AdjustmentRow[] = [];
  let absences: AbsenceRow[] = [];

  if (prisma) {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 12);
    const cutoff = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, "0")}`;

    const [employeeRows, departmentRows, allowanceRows, deductionRows, absenceRows] = await Promise.all([
      prisma.employee.findMany({
        include: { department: true },
        orderBy: [{ lastName: "asc" }],
        take: 1000,
      }),
      prisma.department.findMany({
        include: {
          rules: {
            where: { status: "ACTIVE" },
            orderBy: { updatedAt: "desc" },
            take: 1,
            include: {
              versions: {
                where: { effectiveFrom: { lte: now } },
                orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
                take: 1,
              },
            },
          },
        },
      }),
      prisma.allowance.findMany({ where: { period: { gte: cutoff } }, orderBy: { createdAt: "desc" }, take: 5000 }),
      prisma.deduction.findMany({ where: { period: { gte: cutoff } }, orderBy: { createdAt: "desc" }, take: 5000 }),
      prisma.absence.findMany({ where: { period: { gte: cutoff } }, orderBy: { createdAt: "desc" }, take: 5000 }),
    ]);

    employees = employeeRows.map((employee) => ({
      id: employee.id,
      matricule: employee.matricule,
      firstName: employee.firstName,
      lastName: employee.lastName,
      departmentId: employee.departmentId,
      departmentName: employee.department.name,
      position: employee.position,
      category: employee.category,
      echelon: employee.echelon,
      hireDate: employee.hireDate,
      ssNumber: employee.ssNumber,
      cotisantNumber: employee.cotisantNumber,
      maritalStatus: employee.maritalStatus,
      childrenCount: employee.childrenCount,
      paymentMethod: employee.paymentMethod,
      accountRef: employee.accountRef,
      employmentType: employee.employmentType,
      baseSalaryDA: employee.baseSalaryCents / 100,
      iepRate: Number(employee.iepRate),
    }));

    rules = departmentRows.map((department) => {
      const version = department.rules[0]?.versions[0];
      const config = (version?.config ?? {}) as {
        absenceMethod?: string;
        referenceDays?: number;
        overtimeRate?: number;
        bonusComponents?: Array<{ label?: string; taxable?: boolean; mode?: string; value?: number }>;
      };
      const divisor =
        config.absenceMethod === "NONE"
          ? null
          : config.absenceMethod === "DAILY_BASE_DIV_26"
            ? 26
            : config.absenceMethod === "DAILY_BASE_DIV_30"
              ? 30
              : (config.referenceDays ?? 30);
      return {
        departmentId: department.id,
        divisor,
        overtimeRate: Number(config.overtimeRate ?? 1.5),
        components: (config.bonusComponents ?? []).map((component) => ({
          label: String(component.label ?? "Allowance"),
          taxable: Boolean(component.taxable),
          mode: component.mode === "percent" ? "percent" : "fixed",
          value: Number(component.value ?? 0),
        })),
      };
    });

    allowances = allowanceRows.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      period: row.period,
      label: row.label,
      amountCents: row.amountCents,
      taxable: row.taxable,
      mode: row.mode,
    }));
    deductions = deductionRows.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      period: row.period,
      label: row.label,
      amountCents: row.amountCents,
    }));
    absences = absenceRows.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      period: row.period,
      days: Number(row.days),
      type: row.type,
    }));
  }

  return (
    <SalaryCalculator
      employees={employees}
      rules={rules}
      allowances={allowances}
      deductions={deductions}
      absences={absences}
      defaultPeriod={currentPeriod()}
    />
  );
}
