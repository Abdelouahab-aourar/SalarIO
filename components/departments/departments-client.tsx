"use client";

import { useMemo, useState } from "react";
import { Search, Users, Wallet, CalendarDays, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DepartmentFormDialog, type EditableDepartment } from "./department-form-dialog";

export type DepartmentComponent = {
  label: string;
  taxable: boolean;
  mode: string;
  value: number;
};

export type DepartmentListRow = {
  id: string;
  name: string;
  description: string;
  staff: number;
  base?: number;
  rule: {
    id: string;
    name: string;
    version: number;
    effectiveFrom: string;
    basePayMethod: string;
    absenceMethod: string;
    referenceDays: number;
    overtimeRate: number;
    components: DepartmentComponent[];
  } | null;
};

const ABSENCE_LABEL: Record<string, string> = {
  DAILY_BASE_DIV_30: "Daily rate = base ÷ 30",
  DAILY_BASE_DIV_26: "Daily rate = base ÷ 26",
  NONE: "No absence deduction",
};
const BASE_LABEL: Record<string, string> = {
  MONTHLY_BASE: "Monthly base",
  DAILY_BASE: "Daily base",
};

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Department directory: search, row click → details dialog, create and edit
 * (name + salary calculation rules). Editing a rule creates a new version.
 */
export function DepartmentsClient({
  departments,
  showSalary,
  canEdit,
  companyId,
}: {
  departments: DepartmentListRow[];
  showSalary: boolean;
  canEdit: boolean;
  companyId: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DepartmentListRow | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return departments.filter(
      (d) =>
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.rule?.name ?? "").toLowerCase().includes(q),
    );
  }, [departments, query]);

  const editable: EditableDepartment | undefined = selected?.rule
    ? {
        id: selected.id,
        name: selected.name,
        description: selected.description,
        basePayMethod: selected.rule.basePayMethod,
        absenceMethod: selected.rule.absenceMethod,
        referenceDays: selected.rule.referenceDays,
        overtimeRate: selected.rule.overtimeRate,
        components: selected.rule.components,
      }
    : selected
      ? {
          id: selected.id,
          name: selected.name,
          description: selected.description,
          basePayMethod: "MONTHLY_BASE",
          absenceMethod: "DAILY_BASE_DIV_30",
          referenceDays: 30,
          overtimeRate: 1.5,
          components: [],
        }
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#62776E]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments…"
            className="pl-9"
            aria-label="Search departments"
          />
        </div>
        {canEdit ? (
          <div className="sm:ml-auto">
            <DepartmentFormDialog companyId={companyId} />
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-[#DCE6DF] md:block">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-[#DCE6DF] bg-[#F5F7F4] text-[10px] uppercase tracking-wide text-[#596760]">
              <th className="px-3 py-2.5">Department</th>
              <th className="px-3 py-2.5 text-right">People</th>
              {showSalary ? <th className="hidden px-3 py-2.5 text-right sm:table-cell">Base salaries</th> : null}
              <th className="px-3 py-2.5">Rule</th>
              <th className="px-3 py-2.5 text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showSalary ? 5 : 4} className="px-3 py-8 text-center text-[13px] text-[#596760]">
                  {query ? "No departments match your search." : "No departments yet. Add the first one."}
                </td>
              </tr>
            ) : (
              rows.map((department) => (
                <tr
                  key={department.id}
                  className="cursor-pointer border-b border-[#DCE6DF]/60 bg-white hover:bg-[#F8F9F6]"
                  onClick={() => setSelected(department)}
                >
                  <td className="px-3 py-3">
                    <p className="font-bold text-[#173B32]">{department.name}</p>
                    <p className="text-[11px] text-[#62776E]">{department.description || "No description"}</p>
                  </td>
                  <td className="tnum px-3 py-3 text-right font-mono">{department.staff}</td>
                  {showSalary ? (
                    <td className="tnum hidden px-3 py-3 text-right font-mono sm:table-cell">
                      {typeof department.base === "number" ? fmt(department.base) : "—"}
                    </td>
                  ) : null}
                  <td className="px-3 py-3">
                    {department.rule ? (
                      <>
                        <Badge tone="active">Active · v{department.rule.version}</Badge>
                        <span className="mt-1 block text-[10px] text-[#62776E]">
                          {ABSENCE_LABEL[department.rule.absenceMethod] ?? department.rule.absenceMethod}
                        </span>
                      </>
                    ) : (
                      <Badge tone="gold">No rule</Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Open ${department.name} details`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(department);
                      }}
                    >
                      <Pencil className="size-4 text-[#24564B]" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list avoids a clipped table on narrow screens. */}
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#DCE6DF] bg-white px-3 py-8 text-center text-[13px] text-[#596760] md:hidden">
          {query ? "No departments match your search." : "No departments yet. Add the first one."}
        </p>
      ) : (
        <ul className="grid gap-2 md:hidden" aria-label="Department list">
          {rows.map((department) => (
            <li key={department.id}>
              <button
                type="button"
                onClick={() => setSelected(department)}
                className="w-full rounded-xl border border-[#DCE6DF] bg-white p-3 text-left transition-colors hover:bg-[#F8F9F6] focus-visible:ring-2 focus-visible:ring-[#398675] focus-visible:outline-none"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-[#173B32]">{department.name}</span>
                    <span className="block truncate text-[11px] text-[#62776E]">
                      {department.description || "No description"}
                    </span>
                  </span>
                  {department.rule ? (
                    <Badge tone="active">v{department.rule.version}</Badge>
                  ) : (
                    <Badge tone="gold">No rule</Badge>
                  )}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#DCE6DF]/70 pt-2 text-[11px] text-[#596760]">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5 text-[#398675]" /> {department.staff} people
                  </span>
                  {showSalary && typeof department.base === "number" ? (
                    <span className="tnum inline-flex items-center gap-1 font-mono">
                      <Wallet className="size-3.5 text-[#398675]" /> {fmt(department.base)} DZD base
                    </span>
                  ) : null}
                  {department.rule ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5 text-[#398675]" />
                      {ABSENCE_LABEL[department.rule.absenceMethod] ?? department.rule.absenceMethod}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-[#62776E]">
        Showing {rows.length} of {departments.length} departments. Click a department to view or edit it.
      </p>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.name}
                  {selected.rule ? <Badge tone="active">Active · v{selected.rule.version}</Badge> : <Badge tone="gold">No rule</Badge>}
                </DialogTitle>
                <DialogDescription>{selected.description || "No description"}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-[12px]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[10px] bg-[#F5F7F4] p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#596760]">
                      <Users className="size-3.5" /> EMPLOYEES
                    </p>
                    <p className="tnum mt-1 font-mono text-xl font-bold">{selected.staff}</p>
                  </div>
                  <div className="rounded-[10px] bg-[#F5F7F4] p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#596760]">
                      <Wallet className="size-3.5" /> MONTHLY BASE
                    </p>
                    <p className="tnum mt-1 font-mono text-xl font-bold">
                      {showSalary && typeof selected.base === "number" ? `${fmt(selected.base)} DA` : "Restricted"}
                    </p>
                  </div>
                </div>

                {selected.rule ? (
                  <>
                    <div className="rounded-[10px] border border-[#DCE6DF] p-3">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#173B32]">
                        <CalendarDays className="size-3.5" /> Salary calculation rule
                      </p>
                      <dl className="mt-2 space-y-1.5">
                        <DetailRow label="Base pay" value={BASE_LABEL[selected.rule.basePayMethod] ?? selected.rule.basePayMethod} />
                        <DetailRow label="Absence method" value={ABSENCE_LABEL[selected.rule.absenceMethod] ?? selected.rule.absenceMethod} />
                        <DetailRow label="Reference days" value={String(selected.rule.referenceDays)} />
                        <DetailRow label="Overtime rate" value={`×${selected.rule.overtimeRate}`} />
                        <DetailRow label="Effective from" value={new Date(selected.rule.effectiveFrom).toLocaleDateString("en-GB")} />
                      </dl>
                    </div>

                    <div className="rounded-[10px] border border-[#DCE6DF] p-3">
                      <p className="text-[10px] font-bold tracking-wide text-[#596760]">DEFAULT ALLOWANCES</p>
                      {selected.rule.components.length === 0 ? (
                        <p className="mt-1 text-[11px] text-[#62776E]">None configured.</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {selected.rule.components.map((component, index) => (
                            <li key={`${component.label}-${index}`} className="flex items-center justify-between gap-2 rounded-[8px] bg-[#F5F7F4] px-2.5 py-1.5 text-[11px]">
                              <span className="font-semibold">{component.label}</span>
                              <span className="text-[#62776E]">
                                {component.taxable ? "Taxable" : "Non-taxable"} ·{" "}
                                {component.mode === "percent" ? `${component.value}%` : `${fmt(component.value)} DA`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="rounded-[10px] bg-[#FDF3E3] px-3 py-2 text-[11px] leading-4 text-[#8a5a00]">
                    No salary rule yet. Use Edit to add one — a version 1 will be created.
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setSelected(null)}>Close</Button>
                {canEdit && editable ? (
                  <DepartmentFormDialog
                    companyId={companyId}
                    department={editable}
                    trigger={
                      <Button className="gap-1.5">
                        <Pencil className="size-3.5" /> Edit department
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[#62776E]">{label}</dt>
      <dd className="text-right font-semibold text-[#173B32]">{value}</dd>
    </div>
  );
}
