/**
 * Development seed — SOS Groupe workspace (Figma-aligned demo data).
 * Run: `bun prisma/seed.ts` (DATABASE_URL must be set).
 * Trial credentials are printed at the end of the run; rotate them before
 * production use.
 */
import { hashPassword } from "better-auth/crypto";
import { requireDb } from "../lib/db";

const prisma = requireDb();

const PASSWORDS: Record<string, string> = {
  "faycel.kebas@ensia.edu.dz": "borntodie@1712",
  "approver@sosgroupe.com": "Appr-Sos-2026-Trial!",
  "authorized@sosgroupe.com": "Auth-Sos-2026-Trial!",
  "lina.boudiaf@sosgroupe.com": "Lina-Sos-2026-Trial!",
};

async function userWithPassword(email: string, name: string, role: "HR" | "AUTHORIZED" | "APPROVER" | "EMPLOYEE", employeeId?: string) {
  const hashed = await hashPassword(PASSWORDS[email]!);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role: role as never, employeeId: employeeId ?? null },
    create: { email, name, emailVerified: true, role: role as never, employeeId: employeeId ?? null },
  });
  await prisma.account.upsert({
    where: { id: `cred-${user.id}` },
    update: { password: hashed, accountId: user.id },
    create: { id: `cred-${user.id}`, accountId: user.id, providerId: "credential", userId: user.id, password: hashed },
  });
  return user;
}

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "sos-groupe" },
    update: { name: "SOS Groupe" },
    create: { id: "sos-groupe", name: "SOS Groupe" },
  });

  const deptDefs = [
    { id: "dept-ops", name: "Operations", description: "Monthly base + shift bonuses" },
    { id: "dept-eng", name: "Engineering", description: "Monthly base + project bonuses" },
    { id: "dept-sales", name: "Sales", description: "Monthly base + sales bonuses" },
    { id: "dept-fin", name: "Finance", description: "Monthly base + fixed bonuses" },
    { id: "dept-hr", name: "HR & Administration", description: "Monthly base + fixed bonuses" },
  ];
  for (const d of deptDefs) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: { name: d.name, description: d.description },
      create: { id: d.id, companyId: company.id, name: d.name, description: d.description },
    });
  }

  const employees = [
    { matricule: "SOS-0012", firstName: "Amine", lastName: "Benali", dept: "dept-ops", position: "Operations Supervisor", type: "FULL_TIME" as const, base: 9_500_000 },
    { matricule: "SOS-0038", firstName: "Lina", lastName: "Boudiaf", dept: "dept-eng", position: "Software Engineer", type: "FULL_TIME" as const, base: 12_000_000 },
    { matricule: "SOS-0081", firstName: "Yacine", lastName: "Meziane", dept: "dept-sales", position: "Key Account Executive", type: "FULL_TIME" as const, base: 9_000_000 },
    { matricule: "SOS-0072", firstName: "Sarah", lastName: "Ait Ahmed", dept: "dept-fin", position: "Senior Accountant", type: "FULL_TIME" as const, base: 10_500_000 },
    { matricule: "SOS-0089", firstName: "Riad", lastName: "Khelifi", dept: "dept-ops", position: "Logistics Coordinator", type: "FULL_TIME" as const, base: 7_500_000 },
    { matricule: "SOS-0103", firstName: "Nesrine", lastName: "Hamidi", dept: "dept-hr", position: "HR Specialist", type: "FULL_TIME" as const, base: 6_500_000 },
    { matricule: "SOS-0127", firstName: "Karim", lastName: "Belkacem", dept: "dept-eng", position: "DevOps Engineer", type: "FULL_TIME" as const, base: 14_000_000 },
    { matricule: "SOS-0155", firstName: "Meriem", lastName: "Saidi", dept: "dept-sales", position: "Sales Representative", type: "CONTRACT" as const, base: 7_000_000 },
    { matricule: "SOS-0184", firstName: "Sofiane", lastName: "Bouzid", dept: "dept-ops", position: "Quality Technician", type: "FULL_TIME" as const, base: 8_000_000 },
    { matricule: "SOS-0219", firstName: "Inès", lastName: "Mansouri", dept: "dept-fin", position: "Financial Analyst", type: "PART_TIME" as const, base: 10_000_000 },
  ];
  const employeeIds: Record<string, string> = {};
  for (const e of employees) {
    const row = await prisma.employee.upsert({
      where: { matricule: e.matricule },
      update: { firstName: e.firstName, lastName: e.lastName, departmentId: e.dept, position: e.position, employmentType: e.type, baseSalaryCents: e.base },
      create: { matricule: e.matricule, firstName: e.firstName, lastName: e.lastName, departmentId: e.dept, position: e.position, employmentType: e.type, baseSalaryCents: e.base },
    });
    employeeIds[e.matricule] = row.id;
  }

  await userWithPassword("faycel.kebas@ensia.edu.dz", "HR Team", "HR");
  await userWithPassword("approver@sosgroupe.com", "General Manager", "APPROVER");
  const authorized = await userWithPassword("authorized@sosgroupe.com", "Authorized User", "AUTHORIZED");
  const linaId = employeeIds["SOS-0038"]!;
  await userWithPassword("lina.boudiaf@sosgroupe.com", "Lina Boudiaf", "EMPLOYEE", linaId);

  await prisma.userDepartmentPermission.upsert({
    where: { userId_departmentId: { userId: authorized.id, departmentId: "dept-eng" } },
    update: { canEnterAbsence: true, canEnterBonus: true },
    create: { userId: authorized.id, departmentId: "dept-eng", canEnterAbsence: true, canEnterBonus: true },
  });

  // Engineering rule + version 1 (effective Oct 2026) — immutable recipe snapshot.
  const rule = await prisma.payrollRule.upsert({
    where: { id: "rule-eng" },
    update: {},
    create: { id: "rule-eng", departmentId: "dept-eng", name: "Engineering · Monthly project rule", appliesTo: "Engineering · 64 staff", status: "ACTIVE", effectiveFrom: new Date("2026-10-01") },
  });
  await prisma.payrollRuleVersion.upsert({
    where: { ruleId_version: { ruleId: rule.id, version: 1 } },
    update: {},
    create: {
      ruleId: rule.id, version: 1, effectiveFrom: new Date("2026-10-01"),
      config: {
        basePayMethod: "MONTHLY_BASE",
        absenceMethod: "DAILY_BASE_DIV_30",
        referenceDays: 30,
        bonusComponents: [
          { label: "Performance bonus", taxable: true, mode: "fixed", value: 0 },
          { label: "Meal allowance (Panier)", taxable: false, mode: "fixed", value: 0 },
          { label: "Transport", taxable: false, mode: "fixed", value: 0 },
        ],
        calculationOrder: "MONTHLY_BASE + INCLUDED_BONUSES - INCLUDED_DEDUCTIONS = NET",
        engine: "DZ-2026-IRG-CIDTA-104",
      },
    },
  });

  // October 2026 period in review + September approved (history demo).
  await prisma.payrollPeriod.upsert({
    where: { companyId_year_month: { companyId: company.id, year: 2026, month: 10 } },
    update: {},
    create: { companyId: company.id, year: 2026, month: 10, label: "OCTOBER 2026", status: "IN_REVIEW", employeeCount: 248 },
  });
  await prisma.payrollPeriod.upsert({
    where: { companyId_year_month: { companyId: company.id, year: 2026, month: 9 } },
    update: {},
    create: { companyId: company.id, year: 2026, month: 9, label: "SEPTEMBER 2026", status: "APPROVED", totalNetCents: 1_998_000_000, employeeCount: 248 },
  });

  await prisma.auditLog.create({
    data: { action: "SEED", entity: "Company", entityId: company.id, metadata: { note: "SOS Groupe demo workspace seeded" } },
  });

  console.log("Seed complete: SOS Groupe, 5 departments, 10 employees, 4 users, Engineering rule v1, Oct 2026 (IN_REVIEW), Sep 2026 (APPROVED).");
  console.log("Trial logins (rotate before production):");
  for (const [email, pw] of Object.entries(PASSWORDS)) console.log(`  ${email} / ${pw}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
