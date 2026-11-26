import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/rbac";

const TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
};

/**
 * Employee self-service landing (temporary, since company payroll modules are
 * out of scope for now): shows only the signed-in employee's own record.
 */
export default async function AccountPage() {
  await requireRole("EMPLOYEE");
  const user = await requireUser();

  const employee = prisma && user.employeeId
    ? await prisma.employee.findUnique({
        where: { id: user.employeeId },
        include: { department: true },
      })
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#102E29] sm:text-[28px]">My account</h1>
        <p className="mt-1 text-[13px] text-[#62776E]">
          Your personal record. Company payroll is managed by HR.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-[#E7EFE9] text-[14px] font-extrabold text-[#24564B]">
                {(user.name || user.email).slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-[16px] font-bold text-[#102E29]">{user.name}</p>
                <p className="text-[12px] text-[#62776E]">{user.email}</p>
              </div>
              <Badge tone="active" className="ml-auto">Employee</Badge>
            </div>

            {employee ? (
              <dl className="grid gap-x-6 gap-y-2 pt-2 text-[12px] sm:grid-cols-2">
                <Row label="Employee No." value={employee.matricule} />
                <Row label="Department" value={employee.department.name} />
                <Row label="Position" value={employee.position || "—"} />
                <Row label="Employment type" value={TYPE_LABEL[employee.employmentType] ?? employee.employmentType} />
                <Row label="Hire date" value={employee.hireDate || "—"} />
                <Row label="Category / grade" value={`${employee.category || "—"} / ${employee.echelon || "—"}`} />
                <Row label="Social security" value={employee.ssNumber || "—"} />
                <Row label="Contributor No." value={employee.cotisantNumber || "—"} />
              </dl>
            ) : (
              <p className="rounded-[10px] bg-[#FDF3E3] px-3 py-2 text-[12px] text-[#8a5a00]">
                No employee record is linked to this account yet. Contact your HR administrator.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 text-[12px] leading-5 text-[#596760]">
            <p className="text-[13px] font-bold text-[#102E29]">Access</p>
            <p>
              You can view your own record and update nothing else. Salary rules, department
              configuration and company payroll remain restricted to HR.
            </p>
            <p className="rounded-[8px] bg-[#F5F7F4] px-3 py-2 text-[11px]">
              Need a correction? Contact your HR administrator — changes are audited.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#DCE6DF]/60 py-1.5">
      <dt className="text-[#62776E]">{label}</dt>
      <dd className="truncate text-right font-semibold text-[#173B32]">{value}</dd>
    </div>
  );
}
