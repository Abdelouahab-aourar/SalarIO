"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BadgeDollarSign, CalendarOff, Download, Loader2, Plus, Printer,
  Receipt, Trash2, Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { MonthPicker } from "@/components/ui/month-picker";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { EmployeeCombobox, type EmployeeOption } from "@/components/shared/employee-combobox";
import { calculateSalary, type BonusItem, type DeductionItem } from "@/lib/payroll/salary";
import { createSalaryPdf, salaryPdfFilename } from "@/lib/payroll/salary-pdf";
import { deleteAllowance, deleteDeduction, saveAllowance, saveDeduction } from "@/lib/salary-actions";

export type CalcEmployee = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  departmentName: string;
  position: string;
  category: string;
  echelon: string;
  hireDate: string;
  ssNumber: string;
  cotisantNumber: string;
  maritalStatus: string;
  childrenCount: number;
  paymentMethod: string;
  accountRef: string;
  employmentType: string;
  baseSalaryDA: number;
  iepRate: number;
};

export type CalcRule = {
  departmentId: string;
  divisor: number | null;
  overtimeRate: number;
  components: Array<{ label: string; taxable: boolean; mode: string; value: number }>;
};

export type AdjustmentRow = {
  id: string;
  employeeId: string;
  period: string;
  label: string;
  amountCents: number;
  taxable?: boolean;
  mode?: string;
};

export type AbsenceRow = { id: string; employeeId: string; period: string; days: number; type: string };

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TYPE_LABEL: Record<string, string> = { FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract" };
const MODE_LABEL: Record<string, string> = {
  fixed: "Fixed amount",
  percent_base: "% of base salary",
  percent_net: "% of net salary",
};

export function SalaryCalculator({
  employees,
  rules,
  allowances,
  deductions,
  absences,
  defaultPeriod,
}: {
  employees: CalcEmployee[];
  rules: CalcRule[];
  allowances: AdjustmentRow[];
  deductions: AdjustmentRow[];
  absences: AbsenceRow[];
  defaultPeriod: string;
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [period, setPeriod] = useState(defaultPeriod);
  const [busy, setBusy] = useState<"print" | "download" | null>(null);

  const employee = employees.find((e) => e.id === employeeId) ?? null;
  const rule = rules.find((r) => r.departmentId === employee?.departmentId) ?? null;

  const employeeAllowances = allowances.filter((a) => a.employeeId === employeeId && a.period === period);
  const employeeDeductions = deductions.filter((d) => d.employeeId === employeeId && d.period === period);
  const employeeAbsences = absences.filter((a) => a.employeeId === employeeId && a.period === period);
  const unjustifiedDays = employeeAbsences
    .filter((a) => a.type === "UNJUSTIFIED")
    .reduce((sum, a) => sum + Number(a.days), 0);

  const calculation = (() => {
    if (!employee) return null;

    // Department default components apply only when HR has not entered an
    // explicit allowance for this employee/period (avoids double counting).
    const defaultsActive = employeeAllowances.length === 0 && (rule?.components.length ?? 0) > 0;
    const defaultBonuses: BonusItem[] = defaultsActive
      ? (rule?.components ?? []).map((component, index) => ({
          id: `rule-${index}`,
          label: component.label,
          amount: Number(component.value ?? 0),
          taxable: component.taxable,
          mode: component.mode === "percent" ? ("percent" as const) : ("fixed" as const),
        }))
      : [];

    const taxable: BonusItem[] = [
      ...defaultBonuses.filter((bonus) => bonus.taxable),
      ...employeeAllowances
        .filter((allowance) => allowance.taxable)
        .map((allowance) => ({
          id: allowance.id,
          label: allowance.label,
          amount: allowance.amountCents / 100,
          taxable: true,
          mode: (allowance.mode === "percent_base" ? "percent" : "fixed") as "percent" | "fixed",
        })),
    ];

    const nonTaxable: BonusItem[] = [
      ...defaultBonuses.filter((bonus) => !bonus.taxable),
      ...employeeAllowances
        .filter((allowance) => !allowance.taxable && allowance.mode !== "percent_net")
        .map((allowance) => ({
          id: allowance.id,
          label: allowance.label,
          amount: allowance.amountCents / 100,
          taxable: false,
          mode: (allowance.mode === "percent_base" ? "percent" : "fixed") as "percent" | "fixed",
        })),
    ];

    const percentNet = employeeAllowances.filter(
      (allowance) => !allowance.taxable && allowance.mode === "percent_net",
    );
    const deductionItems: DeductionItem[] = employeeDeductions.map((deduction) => ({
      id: deduction.id,
      label: deduction.label,
      amount: deduction.amountCents / 100,
    }));

    const result = calculateSalary({
      baseSalary: employee.baseSalaryDA,
      iepRate: employee.iepRate,
      overtimeHours: 0,
      absenceDays: unjustifiedDays,
      absenceDivisor: rule?.divisor ?? null,
      overtimeRate: rule?.overtimeRate ?? 1.5,
      bonuses: [...taxable, ...nonTaxable],
      deductions: deductionItems,
      specialRegime: false,
      info: {
        companyName: "SOS GROUPE",
        payMonth: period.toUpperCase(),
        cotisantNumber: employee.cotisantNumber,
        matricule: employee.matricule,
        lastName: employee.lastName,
        firstName: employee.firstName,
        paymentMethod: employee.paymentMethod,
        account: employee.accountRef,
        maritalStatus: employee.maritalStatus,
        childrenCount: employee.childrenCount,
        hireDate: employee.hireDate,
        socialSecurityNumber: employee.ssNumber,
        category: employee.category,
        echelon: employee.echelon,
        position: employee.position,
        department: employee.departmentName,
      },
    });

    // Non-taxable % of net is based on net-from-gross (independent of the
    // allowance itself) and added once to the final net.
    const percentNetTotal = percentNet.reduce(
      (sum, allowance) => sum + (result.netFromGross * (allowance.amountCents / 100)) / 100,
      0,
    );
    return { result, percentNetTotal, finalNet: result.net + percentNetTotal, defaultsActive };
  })();

  async function makePdf() {
    if (!calculation) return null;
    // Fold % of net into the printed non-taxable line so the PDF's NET PAY
    // equals the displayed final net.
    return createSalaryPdf({
      ...calculation.result,
      net: calculation.finalNet,
      nonTaxableBonuses:
        Math.round((calculation.result.nonTaxableBonuses + calculation.percentNetTotal) * 100) / 100,
    });
  }

  async function handlePrint() {
    setBusy("print");
    try {
      const pdf = await makePdf();
      if (!pdf) return;
      pdf.autoPrint();
      const url = String(pdf.output("bloburl"));
      const win = window.open(url, "_blank");
      if (!win) toast.error("Allow pop-ups to open the print view.");
    } catch {
      toast.error("Could not generate the payslip PDF.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload() {
    setBusy("download");
    try {
      const pdf = await makePdf();
      if (!pdf) return;
      pdf.save(salaryPdfFilename(calculation!.result));
      toast.success("Payslip PDF downloaded.");
    } catch {
      toast.error("Could not generate the payslip PDF.");
    } finally {
      setBusy(null);
    }
  }

  const employeeOptions: EmployeeOption[] = employees.map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
    matricule: e.matricule,
    departmentId: e.departmentId,
    departmentName: e.departmentName,
  }));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold text-[#596760]">HR WORKSPACE / SALARY CALCULATION</p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-[#102E29] sm:text-[28px]">Calculate a salary</h1>
        <p className="mt-1 max-w-3xl text-[13px] text-[#62776E]">
          Search an employee, add their allowances and deductions, then calculate and print the payslip.
          Employee details are automatically included on the PDF.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[1.6fr_0.7fr]">
          <Field label="Employee" htmlFor="calc-employee">
            <EmployeeCombobox
              id="calc-employee"
              employees={employeeOptions}
              value={employeeId}
              onChange={setEmployeeId}
            />
          </Field>
          <Field label="Salary month" htmlFor="calc-period">
            <MonthPicker id="calc-period" value={period} onChange={setPeriod} label="Salary month" />
          </Field>
        </CardContent>
      </Card>

      {!employee || !calculation ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[#E7EFE9] text-[#24564B]">
              <Wallet className="size-6" />
            </span>
            <p className="text-[15px] font-bold text-[#102E29]">Select an employee to calculate</p>
            <p className="max-w-md text-[12px] text-[#62776E]">
              The employee record, their department rule and stored absences are loaded automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold tracking-wide text-[#596760]">EMPLOYEE</p>
                  <h2 className="text-[18px] font-extrabold text-[#102E29]">
                    {employee.firstName} {employee.lastName}
                  </h2>
                  <p className="text-[11px] text-[#62776E]">
                    {employee.matricule} · {employee.position || "—"} · {employee.departmentName}
                  </p>
                </div>
                <Badge tone="active">{TYPE_LABEL[employee.employmentType] ?? employee.employmentType}</Badge>
              </CardHeader>
              <CardContent className="grid gap-x-6 gap-y-1.5 text-[12px] sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Base salary" value={`${fmt(employee.baseSalaryDA)} DA`} />
                <Detail label="Experience (IEP)" value={`${employee.iepRate}%`} />
                <Detail label="Hire date" value={employee.hireDate || "—"} />
                <Detail label="Category / step" value={`${employee.category || "—"} / ${employee.echelon || "—"}`} />
                <Detail label="Social security" value={employee.ssNumber || "—"} />
                <Detail label="Contributor No." value={employee.cotisantNumber || "—"} />
                <Detail label="Marital status" value={employee.maritalStatus || "—"} />
                <Detail label="Dependent children" value={String(employee.childrenCount)} />
                <Detail label="Payment" value={`${employee.paymentMethod || "—"}${employee.accountRef ? ` · ${employee.accountRef}` : ""}`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-[15px] font-bold text-[#102E29]">Allowances</h2>
                  <p className="text-[11px] text-[#62776E]">
                    Taxable allowances enter gross; non-taxable are added to net. Fixed, % of base or % of net.
                  </p>
                </div>
                <AllowanceDialog employeeId={employee.id} period={period} baseSalary={employee.baseSalaryDA} />
              </CardHeader>
              <CardContent className="space-y-2">
                {calculation.defaultsActive ? (
                  <p className="rounded-[8px] bg-[#E7EFE9] px-3 py-2 text-[11px] text-[#24564B]">
                    Department defaults are applied. Add an allowance to override them for this employee.
                  </p>
                ) : null}
                {employeeAllowances.length === 0 && !calculation.defaultsActive ? (
                  <EmptyLine icon={<BadgeDollarSign className="size-4" />} text="No allowance for this employee and period." />
                ) : (
                  employeeAllowances.map((allowance) => (
                    <AdjustmentLine
                      key={allowance.id}
                      label={allowance.label}
                      meta={`${allowance.taxable ? "Taxable" : "Non-taxable"} · ${MODE_LABEL[allowance.mode ?? "fixed"]} · ${
                        allowance.mode === "fixed" ? `${fmt(allowance.amountCents / 100)} DA` : `${allowance.amountCents / 100}%`
                      }`}
                      onDelete={async () => {
                        await deleteAllowance(allowance.id);
                        toast.success("Allowance removed.");
                        router.refresh();
                      }}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-[15px] font-bold text-[#102E29]">Deductions</h2>
                  <p className="text-[11px] text-[#62776E]">Advances, loans, insurance — taken off net pay.</p>
                </div>
                <DeductionDialog employeeId={employee.id} period={period} />
              </CardHeader>
              <CardContent className="space-y-2">
                {employeeDeductions.length === 0 ? (
                  <EmptyLine icon={<Receipt className="size-4" />} text="No deduction for this employee and period." />
                ) : (
                  employeeDeductions.map((deduction) => (
                    <AdjustmentLine
                      key={deduction.id}
                      label={deduction.label}
                      meta={`${fmt(deduction.amountCents / 100)} DA off net`}
                      onDelete={async () => {
                        await deleteDeduction(deduction.id);
                        toast.success("Deduction removed.");
                        router.refresh();
                      }}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-[15px] font-bold text-[#102E29]">Stored absences</h2>
                  <p className="text-[11px] text-[#62776E]">Only unjustified days reduce pay.</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href="/absences">Manage absences</a>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {employeeAbsences.length === 0 ? (
                  <EmptyLine icon={<CalendarOff className="size-4" />} text="No absence recorded for this period." />
                ) : (
                  employeeAbsences.map((absence) => (
                    <div key={absence.id} className="flex items-center justify-between rounded-[9px] border border-[#DCE6DF] px-3 py-2 text-[12px]">
                      <span className="font-semibold">{Number(absence.days)} day(s)</span>
                      <Badge tone={absence.type === "UNJUSTIFIED" ? "gold" : "muted"}>
                        {absence.type === "UNJUSTIFIED" ? "Unjustified — deducted" : absence.type.replace("_", " ").toLowerCase()}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="xl:sticky xl:top-24">
            <CardHeader>
              <p className="text-[13px] font-bold text-[#102E29]">Calculation breakdown</p>
              <p className="text-[11px] text-[#62776E]">
                {period} · {unjustifiedDays} unjustified day(s)
                {rule ? "" : " · no rule (defaults)"}
              </p>
            </CardHeader>
            <CardContent className="space-y-2 text-[12px]">
              <Line label="Base salary" value={fmt(calculation.result.input.baseSalary)} />
              <Line label="Experience (IEP)" value={fmt(calculation.result.iepAmount)} />
              <Line label="Taxable allowances" value={fmt(calculation.result.taxableBonuses)} />
              <Line label="Absence deduction" value={`−${fmt(calculation.result.absenceDeduction)}`} tone="neg" />
              <Line label="Gross salary" value={fmt(calculation.result.gross)} strong />
              <Line label="Employee CNAS (9%)" value={`−${fmt(calculation.result.cnas)}`} tone="neg" />
              <Line label="Income tax (IRG)" value={`−${fmt(calculation.result.irg.irg)}`} tone="neg" />
              <Line label="Non-taxable allowances" value={`+${fmt(calculation.result.nonTaxableBonuses)}`} tone="pos" />
              {calculation.percentNetTotal > 0 ? (
                <Line label="Allowances (% of net)" value={`+${fmt(calculation.percentNetTotal)}`} tone="pos" />
              ) : null}
              <Line label="Other deductions" value={`−${fmt(calculation.result.otherDeductions)}`} tone="neg" />
              <div className="mt-2 rounded-[10px] bg-[#173B35] p-3 text-white">
                <p className="text-[10px] tracking-wide text-white/70">NET SALARY · DZD</p>
                <p className="tnum font-mono text-[24px] font-bold">{fmt(calculation.finalNet)}</p>
              </div>
              <p className="rounded-[8px] bg-[#F5F7F4] px-3 py-2 text-[10px] leading-4 text-[#62776E]">
                Employer CNAS 25.5% = {fmt(calculation.result.employerCnas)} DA (on top; total cost{" "}
                {fmt(calculation.result.employerCost)} DA). Engine DZ-2026-IRG-CIDTA-104.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <Button onClick={handlePrint} disabled={busy !== null} className="gap-2">
                  {busy === "print" ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
                  Print payslip
                </Button>
                <Button onClick={handleDownload} disabled={busy !== null} variant="outline" className="gap-2">
                  {busy === "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Download PDF
                </Button>
              </div>
              <p className="text-[10px] leading-4 text-[#62776E]">
                The PDF includes the employee number, name, department, position, category/step, hire date,
                social security and payment details.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
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

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "neg" | "pos" }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${strong ? "border-t border-[#DCE6DF] pt-2 font-bold" : ""}`}>
      <span className={strong ? "text-[#173B32]" : "text-[#596760]"}>{label}</span>
      <span className={`tnum font-mono ${tone === "neg" ? "text-[#a02a2a]" : tone === "pos" ? "text-[#24564B]" : "text-[#173B32]"}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex items-center gap-2 rounded-[9px] border border-dashed border-[#DCE6DF] px-3 py-3 text-[12px] text-[#62776E]">
      {icon} {text}
    </p>
  );
}

function AdjustmentLine({ label, meta, onDelete }: { label: string; meta: string; onDelete: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-[9px] border border-[#DCE6DF] px-3 py-2 text-[12px]">
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#173B32]">{label}</p>
        <p className="truncate text-[11px] text-[#62776E]">{meta}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove ${label}`}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onDelete();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not remove this line.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-[#a02a2a]" />}
      </Button>
    </div>
  );
}

function AllowanceDialog({
  employeeId,
  period,
  baseSalary,
}: {
  employeeId: string;
  period: string;
  baseSalary: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [taxable, setTaxable] = useState(true);
  const [mode, setMode] = useState<"fixed" | "percent_base" | "percent_net">("fixed");
  const [amount, setAmount] = useState("0");
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount) || 0;
  const modeOptions = [
    { value: "fixed", label: "Fixed amount" },
    { value: "percent_base", label: "% of base salary" },
    ...(taxable ? [] : [{ value: "percent_net", label: "% of net salary" }]),
  ];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!label.trim()) {
      setError("Name the allowance.");
      return;
    }
    setSaving(true);
    try {
      await saveAllowance({ employeeId, period, label, taxable, mode, amount: value });
      toast.success("Allowance saved and included in the calculation.");
      setOpen(false);
      setLabel("");
      setAmount("0");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save the allowance.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="size-3.5" /> Add allowance</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add allowance</DialogTitle>
          <DialogDescription>
            Taxable allowances increase gross (CNAS + IRG). Non-taxable allowances are added to net.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Allowance name" htmlFor="allowance-label">
            <Input id="allowance-label" placeholder="Performance bonus, meal allowance, transport…" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={50} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tax treatment">
              <SelectField
                value={taxable ? "taxable" : "non"}
                onValueChange={(v) => {
                  const next = v === "taxable";
                  setTaxable(next);
                  if (next && mode === "percent_net") setMode("fixed");
                }}
                options={[
                  { value: "taxable", label: "Taxable (in gross)" },
                  { value: "non", label: "Non-taxable (to net)" },
                ]}
                aria-label="Tax treatment"
              />
            </Field>
            <Field label="Calculation">
              <SelectField
                value={mode}
                onValueChange={(v) => setMode(v as typeof mode)}
                options={modeOptions}
                aria-label="Calculation mode"
              />
            </Field>
          </div>
          <Field
            label={mode === "fixed" ? "Amount (DA)" : "Percentage (%)"}
            htmlFor="allowance-amount"
            hint={
              mode === "fixed"
                ? undefined
                : mode === "percent_base"
                  ? `≈ ${fmt((baseSalary * value) / 100)} DA on the current base salary`
                  : "Applied to net-after-CNAS/IRG."
            }
          >
            <Input
              id="allowance-amount"
              type="number"
              min={0}
              max={mode === "fixed" ? 10_000_000 : 100}
              step={mode === "fixed" ? 100 : 0.1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          {error ? <p role="alert" className="text-[12px] text-destructive">{error}</p> : null}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {saving ? "Saving…" : "Add allowance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeductionDialog({ employeeId, period }: { employeeId: string; period: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("0");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!label.trim()) {
      setError("Name the deduction.");
      return;
    }
    setSaving(true);
    try {
      await saveDeduction({ employeeId, period, label, amount: Number(amount) || 0 });
      toast.success("Deduction saved and included in the calculation.");
      setOpen(false);
      setLabel("");
      setAmount("0");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save the deduction.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5"><Plus className="size-3.5" /> Add deduction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add deduction</DialogTitle>
          <DialogDescription>Fixed amounts taken off net pay (advance, loan, insurance).</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Deduction name" htmlFor="deduction-label">
            <Input id="deduction-label" placeholder="Salary advance, mutual insurance…" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={50} />
          </Field>
          <Field label="Amount (DA)" htmlFor="deduction-amount">
            <Input id="deduction-amount" type="number" min={0} step={100} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          {error ? <p role="alert" className="text-[12px] text-destructive">{error}</p> : null}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {saving ? "Saving…" : "Add deduction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
