import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getAccessibleDepartmentIds, getSessionUser, requireRole } from "@/lib/rbac";
import { DepartmentsClient, type DepartmentListRow } from "@/components/departments/departments-client";

/**
 * Departments (HR module). Each department owns its employees and its
 * versioned salary calculation rules. Clicking a row opens its details dialog;
 * HR can create and edit departments from there.
 */
export default async function DepartmentsPage() {
  await requireRole("HR", "AUTHORIZED", "APPROVER");
  const user = await getSessionUser();
  const scope = user ? await getAccessibleDepartmentIds(user) : "NONE";
  const showSalary = user?.role !== "AUTHORIZED";
  const canEdit = user?.role === "HR";

  let companyId = "";
  let departments: DepartmentListRow[] = [];
  let live = false;

  if (prisma) {
    const company = await prisma.company.findFirst();
    companyId = company?.id ?? "";
    if (company) {
      const now = new Date();
      const deptRows = await prisma.department.findMany({
        where: {
          companyId: company.id,
          ...(scope === "ALL"
            ? {}
            : scope === "NONE"
              ? { id: "__none__" }
              : { id: { in: scope } }),
        },
        orderBy: { name: "asc" },
        include: {
          employees: { select: { baseSalaryCents: true } },
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
      });

      departments = deptRows.map((department) => {
        const rule = department.rules[0];
        const version = rule?.versions[0];
        const config = (version?.config ?? {}) as {
          basePayMethod?: string;
          absenceMethod?: string;
          referenceDays?: number;
          overtimeRate?: number;
          bonusComponents?: Array<{ label?: string; taxable?: boolean; mode?: string; value?: number }>;
        };
        return {
          id: department.id,
          name: department.name,
          description: department.description ?? "",
          staff: department.employees.length,
          ...(showSalary
            ? { base: department.employees.reduce((sum, e) => sum + e.baseSalaryCents / 100, 0) }
            : {}),
          rule: version
            ? {
                id: rule.id,
                name: rule.name,
                version: version.version,
                effectiveFrom: version.effectiveFrom.toISOString(),
                basePayMethod: config.basePayMethod ?? "MONTHLY_BASE",
                absenceMethod: config.absenceMethod ?? "DAILY_BASE_DIV_30",
                referenceDays: config.referenceDays ?? 30,
                overtimeRate: Number(config.overtimeRate ?? 1.5),
                components: (config.bonusComponents ?? []).map((c) => ({
                  label: String(c.label ?? "Allowance"),
                  taxable: Boolean(c.taxable),
                  mode: c.mode === "percent" ? "percent" : "fixed",
                  value: Number(c.value ?? 0),
                })),
              }
            : null,
        };
      });
      live = true;
    }
  }

  const people = departments.reduce((sum, d) => sum + d.staff, 0);
  const base = departments.reduce((sum, d) => sum + (d.base ?? 0), 0);
  const configured = departments.filter((d) => d.rule).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#102E29] sm:text-[28px]">Departments</h1>
        <p className="mt-1 text-[13px] text-[#62776E]">
          Create departments with their salary calculation rules. Click a department to review or edit it.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-0 bg-gradient-to-r from-[#E7EFE9] to-[#F8F9F6]">
          <CardContent>
            <p className="text-[11px] font-semibold text-[#596760]">Departments</p>
            <p className="tnum font-mono text-3xl font-extrabold">{String(departments.length).padStart(2, "0")}</p>
            <p className="text-[11px] text-[#62776E]">{live ? "Live workspace" : "No database configured"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-[11px] font-semibold text-[#596760]">Employees</p>
            <p className="tnum font-mono text-3xl font-extrabold">{people}</p>
            <p className="text-[11px] text-[#62776E]">Across visible departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-[11px] font-semibold text-[#596760]">Rules configured</p>
            <p className="tnum font-mono text-3xl font-extrabold text-[#24564B]">
              {configured}/{departments.length || 0}
            </p>
            <p className="text-[11px] text-[#62776E]">
              {showSalary && base > 0 ? `Base salaries: ${base.toLocaleString("en-US")} DA` : "Salary figures restricted"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          {!live ? (
            <p className="py-8 text-center text-[13px] text-[#596760]">
              Connect the database to manage departments.
            </p>
          ) : (
            <DepartmentsClient
              departments={departments}
              showSalary={showSalary}
              canEdit={canEdit}
              companyId={canEdit ? companyId : ""}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
