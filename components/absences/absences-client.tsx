"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { MonthPicker } from "@/components/ui/month-picker";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { EmployeeCombobox, type EmployeeOption } from "@/components/shared/employee-combobox";
import { deleteAbsence, recordAbsence } from "@/lib/entry-actions";

export type AbsenceRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  matricule: string;
  departmentName: string;
  period: string;
  days: number;
  type: string;
  recordedById: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  UNJUSTIFIED: "Unjustified",
  JUSTIFIED: "Justified",
  SICK: "Sick leave",
  PAID_LEAVE: "Paid leave",
};

export function AbsencesClient({
  absences,
  employees,
  user,
  defaultPeriod,
}: {
  absences: AbsenceRow[];
  employees: EmployeeOption[];
  user: { id: string; role: string };
  defaultPeriod: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(defaultPeriod);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [period, setPeriod] = useState(defaultPeriod);
  const [days, setDays] = useState("1");
  const [type, setType] = useState("UNJUSTIFIED");
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return absences.filter((absence) => {
      if (absence.period !== month) return false;
      if (!q) return true;
      return (
        absence.employeeName.toLowerCase().includes(q) ||
        absence.matricule.toLowerCase().includes(q) ||
        absence.departmentName.toLowerCase().includes(q) ||
        TYPE_LABEL[absence.type]?.toLowerCase().includes(q)
      );
    });
  }, [absences, query, month]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!employeeId) {
      setError("Select an employee.");
      return;
    }
    setSaving(true);
    try {
      await recordAbsence({ employeeId, period, days: Number(days), type: type as "UNJUSTIFIED" });
      toast.success("Absence recorded. It feeds the payroll calculation directly.");
      setOpen(false);
      setEmployeeId("");
      setDays("1");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not record the absence.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: AbsenceRow) {
    try {
      await deleteAbsence(row.id);
      toast.success("Absence removed.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove the absence.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#62776E]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by employee, No., department or type…"
            className="pl-9"
            aria-label="Search absences"
          />
        </div>
        <div className="w-full sm:w-56">
          <MonthPicker value={month} onChange={setMonth} label="Filter absences by month" />
        </div>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) setPeriod(month);
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 sm:ml-auto">
              <CalendarPlus className="size-4" /> Record absence
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Record absence</DialogTitle>
              <DialogDescription>
                Entries feed payroll directly (FR-10 · BR-06). No per-entry approval step.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Employee" htmlFor="absence-employee">
                <EmployeeCombobox
                  id="absence-employee"
                  employees={employees}
                  value={employeeId}
                  onChange={setEmployeeId}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Month / year" htmlFor="absence-period">
                  <MonthPicker id="absence-period" value={period} onChange={setPeriod} label="Absence month" />
                </Field>
                <Field label="Days" htmlFor="absence-days">
                  <Input
                    id="absence-days"
                    type="number"
                    min={0.5}
                    max={30}
                    step={0.5}
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    required
                  />
                </Field>
              </div>
              <Field label="Type" htmlFor="absence-type">
                <SelectField
                  id="absence-type"
                  value={type}
                  onValueChange={setType}
                  aria-label="Absence type"
                  options={[
                    { value: "UNJUSTIFIED", label: "Unjustified" },
                    { value: "JUSTIFIED", label: "Justified" },
                    { value: "SICK", label: "Sick leave" },
                    { value: "PAID_LEAVE", label: "Paid leave" },
                  ]}
                />
              </Field>
              {error ? <p role="alert" className="text-[12px] text-destructive">{error}</p> : null}
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
                  {saving ? "Recording…" : "Record absence"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-[#DCE6DF] md:block">
        <table className="w-full min-w-[400px] text-left text-[12px] md:min-w-[720px]">
          <thead>
            <tr className="border-b border-[#DCE6DF] bg-[#F5F7F4] text-[10px] uppercase tracking-wide text-[#596760]">
              <th className="px-3 py-2.5">Employee</th>
              <th className="hidden px-3 py-2.5 md:table-cell">Department</th>
              <th className="px-3 py-2.5 text-right">Days</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Period</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[13px] text-[#596760]">
                  No absences recorded for this month{query ? " matching your search" : ""}.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const canDelete = user.role === "HR" || row.recordedById === user.id;
                return (
                  <tr key={row.id} className="border-b border-[#DCE6DF]/60 bg-white hover:bg-[#F8F9F6]">
                    <td className="px-3 py-2.5 font-semibold">
                      {row.employeeName}
                      <span className="block text-[10px] font-normal text-[#62776E]">{row.matricule}</span>
                    </td>
                    <td className="hidden px-3 py-2.5 md:table-cell">{row.departmentName}</td>
                    <td className="tnum px-3 py-2.5 text-right font-mono">{row.days}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={row.type === "UNJUSTIFIED" ? "gold" : "muted"}>{TYPE_LABEL[row.type] ?? row.type}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[#62776E]">{row.period}</td>
                    <td className="px-3 py-2.5 text-right">
                      {canDelete ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove absence for ${row.employeeName}`}
                          onClick={() => onDelete(row)}
                        >
                          <Trash2 className="size-4 text-[#a02a2a]" />
                        </Button>
                      ) : (
                        <span className="text-[10px] text-[#62776E]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards: every entry stays fully visible on small screens. */}
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#DCE6DF] bg-white px-3 py-8 text-center text-[13px] text-[#596760] md:hidden">
          No absences recorded for this month{query ? " matching your search" : ""}.
        </p>
      ) : (
        <ul className="grid gap-2 md:hidden" aria-label="Absence list">
          {rows.map((row) => {
            const canDelete = user.role === "HR" || row.recordedById === user.id;
            return (
              <li key={row.id} className="rounded-xl border border-[#DCE6DF] bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-[#173B32]">{row.employeeName}</p>
                    <p className="truncate text-[11px] text-[#62776E]">
                      {row.matricule} · {row.departmentName}
                    </p>
                  </div>
                  <Badge tone={row.type === "UNJUSTIFIED" ? "gold" : "muted"}>
                    {TYPE_LABEL[row.type] ?? row.type}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-[#DCE6DF]/70 pt-2 text-[11px] text-[#596760]">
                  <span>
                    <strong className="text-[#173B32]">{row.days}</strong> day{row.days === 1 ? "" : "s"} · {row.period}
                  </span>
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove absence for ${row.employeeName}`}
                      onClick={() => onDelete(row)}
                    >
                      <Trash2 className="size-4 text-[#a02a2a]" />
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] text-[#62776E]">
        Deduction method: monthly base ÷ 30 × unjustified days, taken off gross before CNAS/IRG.
        Justified, sick and paid-leave entries are stored but do not reduce pay.
      </p>
    </div>
  );
}
