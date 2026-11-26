"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmployeeFormDialog, type EditableEmployee } from "./employee-form-dialog";

export type EmployeeRow = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  departmentName: string;
  position: string;
  employmentType: string;
  baseSalaryDA?: number;
  iepRate: number;
  category: string;
  echelon: string;
  hireDate: string;
  ssNumber: string;
  cotisantNumber: string;
  maritalStatus: string;
  childrenCount: number;
  paymentMethod: string;
  accountRef: string;
};

const TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Permanent",
  PART_TIME: "Part-time",
  CONTRACT: "Fixed-term",
};
const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Employee directory: search + filters, click a row for the employee's
 * details dialog, with create and edit dialogs for HR.
 */
export function EmployeesClient({
  employees,
  departments,
  showSalary,
  canEdit,
}: {
  employees: EmployeeRow[];
  departments: Array<{ id: string; name: string }>;
  showSalary: boolean;
  canEdit: boolean;
}) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [selected, setSelected] = useState<EmployeeRow | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (department !== "all" && e.departmentId !== department) return false;
      if (!q) return true;
      return (
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.matricule.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q)
      );
    });
  }, [employees, query, department]);

  const departmentOptions = [
    { value: "all", label: "All departments" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const editable: EditableEmployee | undefined = selected
    ? {
        id: selected.id,
        matricule: selected.matricule,
        firstName: selected.firstName,
        lastName: selected.lastName,
        departmentId: selected.departmentId,
        employmentType: selected.employmentType,
        baseSalaryDA: selected.baseSalaryDA ?? 0,
        iepRate: selected.iepRate,
        position: selected.position,
        category: selected.category,
        echelon: selected.echelon,
        hireDate: selected.hireDate,
        ssNumber: selected.ssNumber,
        cotisantNumber: selected.cotisantNumber,
        maritalStatus: selected.maritalStatus,
        childrenCount: selected.childrenCount,
        paymentMethod: selected.paymentMethod,
        accountRef: selected.accountRef,
      }
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#62776E]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, employee No., position…"
            className="pl-9"
            aria-label="Search employees"
          />
        </div>
        <div className="w-full sm:w-48">
          <SelectField value={department} onValueChange={setDepartment} options={departmentOptions} aria-label="Filter by department" />
        </div>
        {canEdit ? (
          <div className="sm:ml-auto">
            <EmployeeFormDialog departments={departments} />
          </div>
        ) : null}
      </div>

      <p className="text-[12px]">
        <span className="font-bold text-[#398675]">All employees {rows.length}</span>
        <span className="ml-3 text-[#62776E]">
          {new Set(rows.map((r) => r.departmentId)).size} departments
          {showSalary ? " · Base salaries in DZD" : ""}
        </span>
      </p>

      <div className="hidden overflow-x-auto rounded-xl border border-[#DCE6DF] md:block">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-[#DCE6DF] bg-[#F5F7F4] text-[10px] uppercase tracking-wide text-[#596760]">
              <th className="px-3 py-2.5">Employee</th>
              <th className="hidden px-3 py-2.5 md:table-cell">Department</th>
              <th className="hidden px-3 py-2.5 lg:table-cell">Position</th>
              <th className="hidden px-3 py-2.5 lg:table-cell">Type</th>
              {showSalary ? <th className="px-3 py-2.5 text-right">Base salary · DZD</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showSalary ? 5 : 4} className="px-3 py-8 text-center text-[13px] text-[#596760]">
                  {query ? "No employees match your search." : "No employees yet."}
                </td>
              </tr>
            ) : (
              rows.map((employee) => (
                <tr
                  key={employee.id}
                  className="cursor-pointer border-b border-[#DCE6DF]/60 bg-white hover:bg-[#F8F9F6]"
                  onClick={() => setSelected(employee)}
                >
                  <td className="px-3 py-2.5">
                    <span className="mr-2 inline-flex size-7 items-center justify-center rounded-full bg-[#E7EFE9] text-[10px] font-bold text-[#24564B]">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </span>
                    <span className="font-semibold">{employee.firstName} {employee.lastName}</span>
                    <span className="block pl-9 text-[10px] text-[#62776E]">{employee.matricule}</span>
                  </td>
                  <td className="hidden px-3 py-2.5 md:table-cell">{employee.departmentName}</td>
                  <td className="hidden px-3 py-2.5 lg:table-cell">{employee.position || "—"}</td>
                  <td className="hidden px-3 py-2.5 text-[#62776E] lg:table-cell">
                    {TYPE_LABEL[employee.employmentType] ?? employee.employmentType}
                  </td>
                  {showSalary && typeof employee.baseSalaryDA === "number" ? (
                    <td className="tnum px-3 py-2.5 text-right font-mono font-semibold">{fmt(employee.baseSalaryDA)}</td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list keeps every field readable without horizontal scroll. */}
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#DCE6DF] bg-white px-3 py-8 text-center text-[13px] text-[#596760] md:hidden">
          {query ? "No employees match your search." : "No employees yet."}
        </p>
      ) : (
        <ul className="grid gap-2 md:hidden" aria-label="Employee list">
          {rows.map((employee) => (
            <li key={employee.id}>
              <button
                type="button"
                onClick={() => setSelected(employee)}
                className="w-full rounded-xl border border-[#DCE6DF] bg-white p-3 text-left transition-colors hover:bg-[#F8F9F6] focus-visible:ring-2 focus-visible:ring-[#398675] focus-visible:outline-none"
              >
                <span className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E7EFE9] text-[11px] font-bold text-[#24564B]">
                    {employee.firstName[0]}{employee.lastName[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-[#173B32]">
                      {employee.firstName} {employee.lastName}
                    </span>
                    <span className="block truncate text-[11px] text-[#62776E]">
                      {employee.matricule} · {employee.departmentName}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      {employee.position ? (
                        <span className="truncate text-[11px] text-[#596760]">{employee.position}</span>
                      ) : null}
                      <Badge tone="active">{TYPE_LABEL[employee.employmentType] ?? employee.employmentType}</Badge>
                    </span>
                  </span>
                  {showSalary && typeof employee.baseSalaryDA === "number" ? (
                    <span className="shrink-0 text-right">
                      <span className="tnum block font-mono text-[12px] font-bold text-[#173B32]">
                        {fmt(employee.baseSalaryDA)}
                      </span>
                      <span className="block text-[9px] text-[#62776E]">DZD</span>
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-[#62776E]">Showing {rows.length} of {employees.length} employees.</p>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.firstName} {selected.lastName}
                </DialogTitle>
                <DialogDescription>
                  {selected.matricule} · {selected.position || "No position"} · {selected.departmentName}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-x-6 gap-y-1 text-[12px] sm:grid-cols-2">
                <Detail label="Employment type" value={TYPE_LABEL[selected.employmentType] ?? selected.employmentType} />
                {showSalary ? (
                  <Detail
                    label="Base salary"
                    value={typeof selected.baseSalaryDA === "number" ? `${fmt(selected.baseSalaryDA)} DA` : "—"}
                  />
                ) : null}
                {showSalary ? <Detail label="Experience (IEP)" value={`${selected.iepRate}%`} /> : null}
                <Detail label="Hire date" value={selected.hireDate || "—"} />
                <Detail label="Category / grade" value={`${selected.category || "—"} / ${selected.echelon || "—"}`} />
                <Detail label="Marital status" value={selected.maritalStatus || "—"} />
                <Detail label="Dependent children" value={String(selected.childrenCount)} />
                <Detail label="Social security" value={selected.ssNumber || "—"} />
                <Detail label="Contributor No." value={selected.cotisantNumber || "—"} />
                <Detail label="Payment method" value={selected.paymentMethod || "—"} />
                <Detail label="Account" value={selected.accountRef || "—"} />
              </div>

              <div className="rounded-[10px] bg-[#F5F7F4] px-3 py-2 text-[11px] text-[#596760]">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" /> Belongs to {selected.departmentName}
                </span>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                {canEdit && editable ? (
                  <EmployeeFormDialog
                    departments={departments}
                    employee={editable}
                    trigger={
                      <Button className="gap-1.5">
                        <Pencil className="size-3.5" /> Edit employee
                      </Button>
                    }
                  />
                ) : null}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#DCE6DF]/60 py-1.5">
      <span className="text-[#62776E]">{label}</span>
      <span className="truncate text-right font-semibold text-[#173B32]">{value}</span>
    </div>
  );
}
