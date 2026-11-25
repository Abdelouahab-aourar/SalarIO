import Link from "next/link";
import { ArrowRight, Building2, CalendarOff, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { OverviewCharts, type OverviewChartsData } from "@/components/overview/overview-charts";

const ABSENCE_LABELS: Record<string, string> = {
  UNJUSTIFIED: "Unjustified",
  JUSTIFIED: "Justified",
  SICK: "Sick",
  PAID_LEAVE: "Paid leave",
};

function monthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleDateString("en-GB", { month: "short" });
}

/**
 * Company overview (HR + approver): live workforce statistics with shadcn
 * charts — stacked radial status, department radar, contract split, absence
 * distribution and a six-month absence trend.
 */
export default async function DashboardPage() {
  const user = await requireRole("HR", "APPROVER");

  let departments: Array<{ id: string; name: string; staff: number; hasRule: boolean }> = [];
  let employeeCount = 0;
  let unconfigured = 0;
  let charts: OverviewChartsData = {
    departments: [],
    absencesByType: [],
    absenceTrend: [],
  };

  if (prisma) {
    const now = new Date();
    const [deptRows, absenceRows] = await Promise.all([
      prisma.department.findMany({
        orderBy: { name: "asc" },
        include: {
          employees: { select: { id: true } },
          rules: {
            where: { status: "ACTIVE" },
            include: { versions: { where: { effectiveFrom: { lte: now } }, take: 1 } },
          },
        },
      }),
      prisma.absence.findMany({ select: { type: true, period: true, days: true } }),
    ]);

    employeeCount = deptRows.reduce((sum, department) => sum + department.employees.length, 0);

    departments = deptRows.map((department) => ({
      id: department.id,
      name: department.name,
      staff: department.employees.length,
      hasRule: department.rules.some((rule) => rule.versions.length > 0),
    }));
    unconfigured = departments.filter((department) => !department.hasRule).length;

    const byType = new Map<string, number>();
    for (const absence of absenceRows) {
      byType.set(absence.type, (byType.get(absence.type) ?? 0) + Number(absence.days));
    }

    const months: OverviewChartsData["absenceTrend"] = [];
    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const days = absenceRows
        .filter((absence) => absence.period === key)
        .reduce((sum, absence) => sum + Number(absence.days), 0);
      months.push({ month: monthLabel(date.getFullYear(), date.getMonth()), days });
    }

    charts = {
      departments: departments.map((department) => ({
        department: department.name.length > 14 ? `${department.name.slice(0, 13)}…` : department.name,
        employees: department.staff,
      })),
      absencesByType: Object.entries(ABSENCE_LABELS).map(([type, label]) => ({
        type,
        label,
        days: byType.get(type) ?? 0,
      })),
      absenceTrend: months,
    };
  }

  const canManageAbsences = user.role === "HR";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#398675]">YOUR WORKSPACE</p>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-[#102E29] sm:text-[30px]">
            Welcome back.
          </h1>
          <p className="mt-1 text-[13px] text-[#62776E]">
            A live view of your people, departments and recorded absences.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/departments">
            Manage departments <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Employees" value={employeeCount} note="All employee records" />
        <StatCard icon={Building2} label="Departments" value={departments.length} note={`${departments.length - unconfigured} with an active rule`} />
        <StatCard
          icon={CalendarOff}
          label="Absence days"
          value={charts.absencesByType.reduce((sum, item) => sum + item.days, 0)}
          note="All recorded periods"
        />
        <StatCard
          icon={Building2}
          label="Rules to configure"
          value={unconfigured}
          note={unconfigured === 0 ? "All departments configured" : "Open a department to add its rule"}
          tone={unconfigured > 0 ? "gold" : "default"}
        />
      </div>

      <OverviewCharts data={charts} />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardContent className="space-y-3">
            <div>
              <h2 className="text-[15px] font-bold text-[#102E29]">Quick actions</h2>
              <p className="text-[11px] text-[#62776E]">Everyday HR tasks</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <ActionLink href="/employees" title="Employee directory" description="Search, review and add employees." />
              <ActionLink href="/departments" title="Department rules" description="Create departments and edit salary rules." />
              {canManageAbsences ? (
                <ActionLink href="/absences" title="Absences" description="Record absences feeding salary calculations." />
              ) : null}
              {canManageAbsences ? (
                <ActionLink href="/salary-calculation" title="Salary calculation" description="Calculate a salary and print its payslip." />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div>
              <h2 className="text-[15px] font-bold text-[#102E29]">Department rule coverage</h2>
              <p className="text-[11px] text-[#62776E]">Departments with an effective salary rule</p>
            </div>
            {departments.length === 0 ? (
              <p className="rounded-[10px] border border-dashed border-[#DCE6DF] px-3 py-6 text-center text-[12px] text-[#596760]">
                No departments yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {departments.map((department) => (
                  <li key={department.id} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="truncate font-semibold text-[#173B32]">{department.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] text-[#62776E]">{department.staff}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          department.hasRule ? "bg-[#E7EFE9] text-[#398675]" : "bg-[#FDF3E3] text-[#8a5a00]"
                        }`}
                      >
                        {department.hasRule ? "Rule" : "No rule"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {unconfigured > 0 ? (
        <p className="rounded-[10px] border border-[#F0D9A8] bg-[#FDF3E3] px-3 py-2 text-[12px] leading-5 text-[#8a5a00]">
          {unconfigured} department{unconfigured > 1 ? "s have" : " has"} no active salary rule yet.
          Open the department and choose <strong>Edit</strong> to create one.
        </p>
      ) : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  note: string;
  tone?: "default" | "gold";
}) {
  return (
    <Card className={tone === "gold" ? "border-[#F0D9A8] bg-[#FDF8EC]" : undefined}>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[#596760]">{label}</p>
          <Icon className="size-4 text-[#398675]" />
        </div>
        <p className="tnum mt-1 font-mono text-3xl font-extrabold text-[#102E29]">{value}</p>
        <p className="mt-1 text-[11px] text-[#62776E]">{note}</p>
      </CardContent>
    </Card>
  );
}

function ActionLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-[10px] border border-[#DCE6DF] px-3 py-2.5 transition-colors hover:bg-[#F5F7F4]"
    >
      <span className="min-w-0">
        <span className="block text-[12px] font-bold text-[#173B32]">{title}</span>
        <span className="block text-[11px] leading-4 text-[#62776E]">{description}</span>
      </span>
      <ArrowRight className="ml-auto mt-1 size-3.5 shrink-0 text-[#62776E]" />
    </Link>
  );
}
