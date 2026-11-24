import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getAccessibleDepartmentIds, getSessionUser, requireRole, type AuthUser } from "@/lib/rbac";
import { AbsencesClient, type AbsenceRow } from "@/components/absences/absences-client";
import type { EmployeeOption } from "@/components/shared/employee-combobox";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Absence management (FR-09/FR-10/BR-06): searchable list, dialog entry with
 * employee search, department scope enforced server-side, entries stored and
 * reused by salary calculation.
 */
export default async function AbsencesPage() {
  await requireRole("HR", "AUTHORIZED");
  const user = (await getSessionUser()) as AuthUser;
  const scope = await getAccessibleDepartmentIds(user);

  let absences: AbsenceRow[] = [];
  let employees: EmployeeOption[] = [];

  if (prisma) {
    const deptFilter =
      scope === "ALL" ? {} : scope === "NONE" ? { departmentId: "__none__" } : { departmentId: { in: scope } };
    const [absenceRows, employeeRows] = await Promise.all([
      prisma.absence.findMany({
        where: { employee: deptFilter },
        include: { employee: { include: { department: true } } },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
      prisma.employee.findMany({
        where: { ...deptFilter },
        include: { department: true },
        orderBy: [{ lastName: "asc" }],
        take: 500,
      }),
    ]);
    absences = absenceRows.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
      matricule: r.employee.matricule,
      departmentName: r.employee.department.name,
      period: r.period,
      days: Number(r.days),
      type: r.type,
      recordedById: r.recordedById,
    }));
    employees = employeeRows.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      matricule: e.matricule,
      departmentId: e.departmentId,
      departmentName: e.department.name,
    }));
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#102E29] sm:text-[28px]">Absences</h1>
        <p className="mt-1 max-w-3xl text-[13px] text-[#62776E]">
          Absences are grouped by month. Pick a month to review it; entries recorded for that month
          feed the salary calculation for the same month.
        </p>
      </div>
      <Card>
        <CardContent>
          <AbsencesClient
            absences={absences}
            employees={employees}
            user={{ id: user.id, role: user.role }}
            defaultPeriod={currentPeriod()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
