"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";

/**
 * Department + employee administration (HR only).
 * Departments own their salary rule: editing the rule creates a NEW version
 * (effective now) instead of overwriting history.
 */
async function actor() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated.");
  return user;
}

const componentSchema = z.object({
  label: z.string().trim().min(1).max(40),
  taxable: z.boolean().default(true),
  mode: z.enum(["fixed", "percent"]).default("fixed"),
  value: z.number().min(0).max(10_000_000).default(0),
});

const departmentUpdateSchema = z.object({
  departmentId: z.string().min(1),
  name: z.string().trim().min(1, "Department name is required.").max(60),
  description: z.string().trim().max(200).default(""),
  basePayMethod: z.enum(["MONTHLY_BASE", "DAILY_BASE"]).default("MONTHLY_BASE"),
  absenceMethod: z.enum(["DAILY_BASE_DIV_30", "DAILY_BASE_DIV_26", "NONE"]).default("DAILY_BASE_DIV_30"),
  referenceDays: z.number().int().min(26).max(31).default(30),
  overtimeRate: z.number().min(1).max(2).default(1.5),
  components: z.array(componentSchema).max(10).optional(),
});

/** Edit department identity + its calculation rule (new dated version). */
export async function updateDepartment(input: z.infer<typeof departmentUpdateSchema>) {
  const user = await actor();
  if (user.role !== "HR") throw new Error("Only HR can edit departments.");
  const data = departmentUpdateSchema.parse(input);
  const db = requireDb();

  const current = await db.department.findUniqueOrThrow({ where: { id: data.departmentId } });
  const duplicate = await db.department.findFirst({
    where: { companyId: current.companyId, name: data.name, NOT: { id: data.departmentId } },
  });
  if (duplicate) throw new Error("Another department already uses this name.");

  await db.$transaction(
    async (tx) => {
      const department = await tx.department.update({
        where: { id: data.departmentId },
        data: { name: data.name, description: data.description },
      });

      const rule = await tx.payrollRule.findFirst({
        where: { departmentId: department.id, status: "ACTIVE" },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });

      const config = {
        basePayMethod: data.basePayMethod,
        absenceMethod: data.absenceMethod,
        referenceDays: data.referenceDays,
        overtimeRate: data.overtimeRate,
        bonusComponents:
          data.components ??
          (rule?.versions[0]?.config as { bonusComponents?: unknown } | undefined)?.bonusComponents ??
          [],
        calculationOrder: "MONTHLY_BASE + INCLUDED_BONUSES - INCLUDED_DEDUCTIONS = NET",
        engine: "DZ-2026-IRG-CIDTA-104",
        note: "Department details updated by HR",
        savedAt: new Date().toISOString(),
      };

      if (rule) {
        const next = (rule.versions[0]?.version ?? 0) + 1;
        await tx.payrollRuleVersion.create({
          data: { ruleId: rule.id, version: next, effectiveFrom: new Date(), config },
        });
        await tx.payrollRule.update({
          where: { id: rule.id },
          data: { name: `${data.name} · Monthly rule`, appliesTo: `${data.name} employees`, basePayMethod: data.basePayMethod },
        });
        await tx.auditLog.create({
          data: { actorId: user.id, action: "RULE_VERSION_EDIT", entity: "Department", entityId: department.id, metadata: { version: next } },
        });
      } else {
        const created = await tx.payrollRule.create({
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
          data: { ruleId: created.id, version: 1, effectiveFrom: new Date(), config },
        });
        await tx.auditLog.create({
          data: { actorId: user.id, action: "RULE_CREATE", entity: "Department", entityId: department.id, metadata: { ruleId: created.id } },
        });
      }

      await tx.auditLog.create({
        data: { actorId: user.id, action: "DEPARTMENT_UPDATE", entity: "Department", entityId: department.id, metadata: { name: data.name } },
      });
    },
    { maxWait: 15000, timeout: 40000 },
  );

  revalidatePath("/departments");
  revalidatePath("/overview");
}

const employeeUpdateSchema = z.object({
  employeeId: z.string().min(1),
  matricule: z.string().trim().min(1, "Employee No. is required.").max(20),
  firstName: z.string().trim().min(1, "First name is required.").max(40),
  lastName: z.string().trim().min(1, "Last name is required.").max(40),
  departmentId: z.string().min(1, "Select a department."),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
  baseSalaryDA: z
    .number({ error: "Enter the monthly base salary." })
    .min(24000, "Base salary cannot be below the SNMG of 24,000 DA.")
    .max(10_000_000, "Amount is too large."),
  iepRate: z.number().min(0).max(100),
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
});

/** Edit an employee's HR record (HR only). */
export async function updateEmployee(input: z.infer<typeof employeeUpdateSchema>) {
  const user = await actor();
  if (user.role !== "HR") throw new Error("Only HR can edit employees.");
  const data = employeeUpdateSchema.parse(input);
  const db = requireDb();

  const clash = await db.employee.findFirst({
    where: { matricule: data.matricule, NOT: { id: data.employeeId } },
  });
  if (clash) throw new Error("Another employee already uses this employee number.");
  await db.department.findUniqueOrThrow({ where: { id: data.departmentId } });

  await db.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: data.employeeId },
      data: {
        matricule: data.matricule,
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
      },
    });
    await tx.auditLog.create({
      data: { actorId: user.id, action: "EMPLOYEE_UPDATE", entity: "Employee", entityId: data.employeeId, metadata: { matricule: data.matricule } },
    });
  });

  revalidatePath("/employees");
  revalidatePath("/absences");
  revalidatePath("/overview");
}
