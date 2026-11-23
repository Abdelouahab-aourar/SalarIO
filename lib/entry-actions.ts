"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/lib/db";
import { canEnterInputs, getAccessibleDepartmentIds, getSessionUser } from "@/lib/rbac";

/**
 * HR data-entry actions for the modules currently in scope:
 * departments (with their rule), employees and absences.
 * Every mutation validates identity, role and department scope server-side
 * and writes an audit record in the same transaction.
 */
async function actor() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated.");
  return user;
}

async function assertDeptScope(
  userId: string,
  role: string,
  departmentId: string,
  kind: "absence" | "bonus",
) {
  const user = { id: userId, role: role as never, email: "", name: "", employeeId: null };
  const scope = await getAccessibleDepartmentIds(user);
  if (scope === "NONE") throw new Error("No department access.");
  if (scope !== "ALL" && !scope.includes(departmentId)) {
    throw new Error("Department outside your granted access.");
  }
  const db = requireDb();
  if (role === "AUTHORIZED") {
    const perm = await db.userDepartmentPermission.findUnique({
      where: { userId_departmentId: { userId, departmentId } },
    });
    if (!perm) throw new Error("Department outside your granted access.");
    if (kind === "absence" && !perm.canEnterAbsence) throw new Error("Absence entry not granted for this department.");
    if (kind === "bonus" && !perm.canEnterBonus) throw new Error("Bonus entry not granted for this department.");
  }
}

// ---------------------------------------------------------------------------
// Absences (FR-09/FR-10, BR-06)
// ---------------------------------------------------------------------------
const absenceSchema = z.object({
  employeeId: z.string().min(1),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM."),
  days: z.number().min(0.5).max(30),
  type: z.enum(["UNJUSTIFIED", "JUSTIFIED", "SICK", "PAID_LEAVE"]),
});

export async function recordAbsence(input: z.infer<typeof absenceSchema>) {
  const user = await actor();
  if (!canEnterInputs(user)) throw new Error("Not permitted to record absences.");
  const data = absenceSchema.parse(input);
  const db = requireDb();
  const employee = await db.employee.findUniqueOrThrow({ where: { id: data.employeeId } });
  await assertDeptScope(user.id, user.role, employee.departmentId, "absence");

  await db.$transaction([
    db.absence.create({
      data: {
        employeeId: data.employeeId,
        period: data.period,
        days: data.days,
        type: data.type,
        recordedById: user.id,
      },
    }),
    db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ABSENCE_RECORD",
        entity: "Employee",
        entityId: data.employeeId,
        metadata: { ...data },
      },
    }),
  ]);

  revalidatePath("/absences");
  revalidatePath("/overview");
}

export async function deleteAbsence(absenceId: string) {
  const user = await actor();
  if (!canEnterInputs(user)) throw new Error("Not permitted to change absences.");
  const db = requireDb();
  const row = await db.absence.findUniqueOrThrow({ where: { id: absenceId }, include: { employee: true } });
  await assertDeptScope(user.id, user.role, row.employee.departmentId, "absence");
  if (user.role === "AUTHORIZED" && row.recordedById !== user.id) {
    throw new Error("You can only remove entries you recorded.");
  }
  await db.$transaction([
    db.absence.delete({ where: { id: absenceId } }),
    db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ABSENCE_DELETE",
        entity: "Employee",
        entityId: row.employeeId,
        metadata: { absenceId },
      },
    }),
  ]);
  revalidatePath("/absences");
  revalidatePath("/overview");
}

// ---------------------------------------------------------------------------
// Departments (FR-04/FR-05): name + calculation rules + version 1.
// ---------------------------------------------------------------------------
const componentSchema = z.object({
  label: z.string().trim().min(1).max(40),
  taxable: z.boolean().default(true),
  mode: z.enum(["fixed", "percent"]).default("fixed"),
  value: z.number().min(0).max(10_000_000).default(0),
});

const departmentSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().max(200).default(""),
  basePayMethod: z.enum(["MONTHLY_BASE", "DAILY_BASE"]).default("MONTHLY_BASE"),
  absenceMethod: z.enum(["DAILY_BASE_DIV_30", "DAILY_BASE_DIV_26", "NONE"]).default("DAILY_BASE_DIV_30"),
  referenceDays: z.number().int().min(26).max(31).default(30),
  overtimeRate: z.number().min(1).max(2).default(1.5),
  components: z.array(componentSchema).max(10).default([]),
});

export async function createDepartment(companyId: string, input: z.infer<typeof departmentSchema>) {
  const user = await actor();
  if (user.role !== "HR") throw new Error("Only HR can manage departments.");
  const data = departmentSchema.parse(input);
  const db = requireDb();
  const existing = await db.department.findFirst({ where: { companyId, name: data.name } });
  if (existing) throw new Error("A department with this name already exists.");

  const dept = await db.$transaction(
    async (tx) => {
      const department = await tx.department.create({
        data: { companyId, name: data.name, description: data.description },
      });
      const rule = await tx.payrollRule.create({
        data: {
          departmentId: department.id,
          name: `${data.name} · Monthly rule`,
          appliesTo: `${data.name} employees`,
          status: "ACTIVE",
          basePayMethod: data.basePayMethod,
          effectiveFrom: new Date(),
          createdById: user.id,
        },
      });
      await tx.payrollRuleVersion.create({
        data: {
          ruleId: rule.id,
          version: 1,
          effectiveFrom: new Date(),
          config: {
            basePayMethod: data.basePayMethod,
            absenceMethod: data.absenceMethod,
            referenceDays: data.referenceDays,
            overtimeRate: data.overtimeRate,
            bonusComponents: data.components,
            calculationOrder: "MONTHLY_BASE + INCLUDED_BONUSES - INCLUDED_DEDUCTIONS = NET",
            engine: "DZ-2026-IRG-CIDTA-104",
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "DEPARTMENT_CREATE",
          entity: "Department",
          entityId: department.id,
          metadata: { name: data.name },
        },
      });
      return department;
    },
    { maxWait: 15000, timeout: 40000 },
  );

  revalidatePath("/departments");
  revalidatePath("/overview");
  return dept.id;
}

// ---------------------------------------------------------------------------
// Employees (FR-06/FR-12)
// ---------------------------------------------------------------------------
const employeeSchema = z.object({
  matricule: z.string().trim().max(20).optional().default(""),
  firstName: z.string().trim().min(1, "First name is required.").max(40),
  lastName: z.string().trim().min(1, "Last name is required.").max(40),
  departmentId: z.string().min(1, "Select a department."),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
  baseSalaryDA: z
    .number({ error: "Enter the monthly base salary." })
    .min(24000, "Base salary cannot be below the SNMG of 24,000 DA.")
    .max(10_000_000, "Amount is too large."),
  iepRate: z.number().min(0).max(100).default(0),
  position: z.string().trim().max(60).default(""),
  category: z.string().trim().max(10).default(""),
  echelon: z.string().trim().max(10).default(""),
  hireDate: z.string().trim().max(20).default(""),
  ssNumber: z.string().trim().max(30).default(""),
  cotisantNumber: z.string().trim().max(30).default(""),
  maritalStatus: z.string().trim().max(20).default(""),
  childrenCount: z.number().int().min(0).max(20).default(0),
  paymentMethod: z.string().trim().max(20).default(""),
  accountRef: z.string().trim().max(40).default(""),
  active: z.boolean().default(true),
});

export async function createEmployee(input: z.input<typeof employeeSchema>) {
  const user = await actor();
  if (user.role !== "HR") throw new Error("Only HR can manage employees.");
  const data = employeeSchema.parse(input);
  const db = requireDb();
  await db.department.findUniqueOrThrow({ where: { id: data.departmentId } });

  let matricule = data.matricule?.trim() ?? "";
  if (matricule) {
    const clash = await db.employee.findUnique({ where: { matricule } });
    if (clash) throw new Error("Another employee already uses this employee number.");
  }
  if (!matricule) {
    const count = await db.employee.count();
    matricule = `SOS-${String(count + 1).padStart(4, "0")}`;
    for (let i = 1; i < 50; i++) {
      const clash = await db.employee.findUnique({ where: { matricule } });
      if (!clash) break;
      matricule = `SOS-${String(count + 1 + i).padStart(4, "0")}`;
    }
  }

  const employee = await db.$transaction(
    async (tx) => {
      const created = await tx.employee.create({
        data: {
          matricule,
          firstName: data.firstName,
          lastName: data.lastName,
          departmentId: data.departmentId,
          employmentType: data.employmentType,
          baseSalaryCents: Math.round(data.baseSalaryDA * 100),
          iepRate: data.iepRate,
          position: data.position,
          category: data.category,
          echelon: data.echelon,
          hireDate: data.hireDate,
          ssNumber: data.ssNumber,
          cotisantNumber: data.cotisantNumber,
          maritalStatus: data.maritalStatus,
          childrenCount: data.childrenCount,
          paymentMethod: data.paymentMethod,
          accountRef: data.accountRef,
          active: data.active,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "EMPLOYEE_CREATE",
          entity: "Employee",
          entityId: created.id,
          metadata: { matricule },
        },
      });
      return created;
    },
    { maxWait: 15000, timeout: 40000 },
  );

  revalidatePath("/employees");
  revalidatePath("/absences");
  revalidatePath("/overview");
  return { id: employee.id, matricule };
}
