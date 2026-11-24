"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/lib/db";
import { canEnterInputs, getSessionUser } from "@/lib/rbac";

/**
 * Per-employee allowances and deductions used by the salary calculator.
 * HR can enter any; AUTHORIZED users only within granted departments with the
 * bonus permission. All writes are audited and scoped server-side.
 */
async function actor() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated.");
  if (!canEnterInputs(user)) throw new Error("Not permitted to change salary inputs.");
  return user;
}

async function assertDepartmentAccess(userId: string, role: string, departmentId: string) {
  const db = requireDb();
  if (role === "HR") return;
  const permission = await db.userDepartmentPermission.findUnique({
    where: { userId_departmentId: { userId, departmentId } },
  });
  if (!permission || !permission.canEnterBonus) {
    throw new Error("Department outside your granted access.");
  }
}

const allowanceSchema = z
  .object({
    employeeId: z.string().min(1),
    period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM."),
    label: z.string().trim().min(1, "Name the allowance.").max(50),
    taxable: z.boolean().default(true),
    mode: z.enum(["fixed", "percent_base", "percent_net"]),
    amount: z.number().min(0).max(10_000_000),
  })
  .refine((value) => value.mode === "fixed" || (value.amount > 0 && value.amount <= 100), {
    message: "Percentage must be between 0 and 100.",
    path: ["amount"],
  })
  .refine((value) => !(value.taxable && value.mode === "percent_net"), {
    message: "Taxable allowances cannot be a percentage of net salary.",
    path: ["mode"],
  });

export async function saveAllowance(input: z.infer<typeof allowanceSchema>) {
  const user = await actor();
  const data = allowanceSchema.parse(input);
  const db = requireDb();
  const employee = await db.employee.findUniqueOrThrow({ where: { id: data.employeeId } });
  await assertDepartmentAccess(user.id, user.role, employee.departmentId);

  const amountCents = Math.round(data.amount * 100);
  const duplicate = await db.allowance.findFirst({
    where: {
      employeeId: data.employeeId,
      period: data.period,
      label: data.label,
      amountCents,
      mode: data.mode,
    },
  });
  if (duplicate) throw new Error("This allowance already exists for that employee and period.");

  const id = await db.$transaction(async (tx) => {
    const created = await tx.allowance.create({
      data: {
        employeeId: data.employeeId,
        period: data.period,
        label: data.label,
        taxable: data.taxable,
        mode: data.mode,
        amountCents,
        recordedById: user.id,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "ALLOWANCE_ADD",
        entity: "Employee",
        entityId: employee.id,
        metadata: { ...data },
      },
    });
    return created.id;
  });

  revalidatePath("/salary-calculation");
  return id;
}

export async function deleteAllowance(id: string) {
  const user = await actor();
  const db = requireDb();
  const row = await db.allowance.findUniqueOrThrow({ where: { id }, include: { employee: true } });
  await assertDepartmentAccess(user.id, user.role, row.employee.departmentId);
  if (user.role === "AUTHORIZED" && row.recordedById !== user.id) {
    throw new Error("You can only remove allowances you recorded.");
  }
  await db.$transaction([
    db.allowance.delete({ where: { id } }),
    db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ALLOWANCE_DELETE",
        entity: "Employee",
        entityId: row.employeeId,
        metadata: { id },
      },
    }),
  ]);
  revalidatePath("/salary-calculation");
}

const deductionSchema = z.object({
  employeeId: z.string().min(1),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM."),
  label: z.string().trim().min(1, "Name the deduction.").max(50),
  amount: z.number().min(0).max(10_000_000),
});

export async function saveDeduction(input: z.infer<typeof deductionSchema>) {
  const user = await actor();
  const data = deductionSchema.parse(input);
  const db = requireDb();
  const employee = await db.employee.findUniqueOrThrow({ where: { id: data.employeeId } });
  await assertDepartmentAccess(user.id, user.role, employee.departmentId);

  const amountCents = Math.round(data.amount * 100);
  const duplicate = await db.deduction.findFirst({
    where: { employeeId: data.employeeId, period: data.period, label: data.label, amountCents },
  });
  if (duplicate) throw new Error("This deduction already exists for that employee and period.");

  const id = await db.$transaction(async (tx) => {
    const created = await tx.deduction.create({
      data: {
        employeeId: data.employeeId,
        period: data.period,
        label: data.label,
        amountCents,
        recordedById: user.id,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "DEDUCTION_ADD",
        entity: "Employee",
        entityId: employee.id,
        metadata: { ...data },
      },
    });
    return created.id;
  });

  revalidatePath("/salary-calculation");
  return id;
}

export async function deleteDeduction(id: string) {
  const user = await actor();
  const db = requireDb();
  const row = await db.deduction.findUniqueOrThrow({ where: { id }, include: { employee: true } });
  await assertDepartmentAccess(user.id, user.role, row.employee.departmentId);
  if (user.role === "AUTHORIZED" && row.recordedById !== user.id) {
    throw new Error("You can only remove deductions you recorded.");
  }
  await db.$transaction([
    db.deduction.delete({ where: { id } }),
    db.auditLog.create({
      data: {
        actorId: user.id,
        action: "DEDUCTION_DELETE",
        entity: "Employee",
        entityId: row.employeeId,
        metadata: { id },
      },
    }),
  ]);
  revalidatePath("/salary-calculation");
}
