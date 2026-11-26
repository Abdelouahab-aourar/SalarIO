import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getAccessibleDepartmentIds, getSessionUser, requireRole } from "@/lib/rbac";
import { EmployeesClient, type EmployeeRow } from "@/components/employees/employees-client";

/**
 * Employee directory (FR-04/FR-06). Click a row for the employee's details
 * dialog; HR can create and edit records. Scoped roles only receive employees
 * from their granted departments and never receive salary fields.
 */
export default async function EmployeesPage() {
  await requireRole("HR", "AUTHORIZED", "APPROVER");
  const user = await getSessionUser();
  const scope = user ? await getAccessibleDepartmentIds(user) : "NONE";
  const showSalary = user?.role !== "AUTHORIZED";
  const canEdit = user?.role === "HR";

  let departments: Array<{ id: string; name: string }> = [];
  let employees: EmployeeRow[] = [];

  if (prisma) {
    const [deptRows, empRows] = await Promise.all([
      prisma.department.findMany({
        where: {
          ...(scope === "ALL"
            ? {}
            : scope === "NONE"
              ? { id: "__none__" }
              : { id: { in: scope } }),
        },
        orderBy: { name: "asc" },
      }),
      prisma.employee.findMany({
        where:
          scope === "ALL"
            ? {}
            : scope === "NONE"
              ? { id: "__none__" }
              : { departmentId: { in: scope } },
        include: { department: true },
        orderBy: { lastName: "asc" },
        take: 500,
      }),
    ]);

    departments = deptRows.map((d) => ({ id: d.id, name: d.name }));
    employees = empRows.map((e) => ({
      id: e.id,
      matricule: e.matricule,
      firstName: e.firstName,
      lastName: e.lastName,
      departmentId: e.departmentId,
      departmentName: e.department.name,
      position: e.position,
      employmentType: e.employmentType,
      iepRate: Number(e.iepRate),
      category: e.category,
      echelon: e.echelon,
      hireDate: e.hireDate,
      ssNumber: e.ssNumber,
      cotisantNumber: e.cotisantNumber,
      maritalStatus: e.maritalStatus,
      childrenCount: e.childrenCount,
      paymentMethod: e.paymentMethod,
      accountRef: e.accountRef,
      // Salary is omitted from the payload for scoped accounts (not just hidden).
      ...(showSalary ? { baseSalaryDA: e.baseSalaryCents / 100 } : {}),
    }));
  }

  const baseTotal = employees.reduce((sum, e) => sum + (e.baseSalaryDA ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#102E29] sm:text-[28px]">Employees</h1>
        <p className="mt-1 text-[13px] text-[#62776E]">
          The people behind every payroll. Click an employee to view their full record.
        </p>
      </div>

      <Card className="border-0 bg-gradient-to-r from-[#E7EFE9] to-[#F8F9F6]">
        <CardContent className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <div>
            <p className="text-[11px] font-semibold text-[#596760]">Employees</p>
            <p className="tnum font-mono text-4xl font-extrabold">{employees.length}</p>
            <p className="text-[11px] text-[#62776E]">Across visible departments</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#596760]">Connected departments</p>
            <p className="tnum font-mono text-2xl font-bold">{String(departments.length).padStart(2, "0")}</p>
            {showSalary ? (
              <>
                <p className="mt-2 text-[11px] text-[#596760]">Monthly base salaries</p>
                <p className="tnum font-mono text-xl font-bold">{baseTotal.toLocaleString("en-US")} DZD</p>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-[#596760]">Scope limited to your departments</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <EmployeesClient
            employees={employees}
            departments={departments}
            showSalary={showSalary}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
