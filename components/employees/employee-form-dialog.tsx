"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { createEmployee } from "@/lib/entry-actions";
import { updateEmployee } from "@/lib/admin-actions";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(40),
  lastName: z.string().trim().min(1, "Last name is required.").max(40),
  matricule: z.string().trim().max(20).optional(),
  departmentId: z.string().min(1, "Select a department."),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
  baseSalaryDA: z
    .number({ error: "Enter the monthly base salary." })
    .min(24000, "Base salary cannot be below the SNMG of 24,000 DA.")
    .max(10_000_000, "Amount is too large."),
  iepRate: z.number().min(0).max(100),
  position: z.string().trim().max(60),
  category: z.string().trim().max(10),
  echelon: z.string().trim().max(10),
  hireDate: z.string().trim().max(20),
  ssNumber: z.string().trim().max(30),
  cotisantNumber: z.string().trim().max(30),
  maritalStatus: z.string().trim().max(20),
  childrenCount: z.number().int().min(0).max(20),
  paymentMethod: z.string().trim().max(20),
  accountRef: z.string().trim().max(40),
});

type Values = z.infer<typeof schema>;

export type EditableEmployee = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  employmentType: string;
  baseSalaryDA: number;
  iepRate: number;
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
};

const TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
];
const MARITAL_OPTIONS = [
  { value: "", label: "—" },
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" },
];
const PAYMENT_OPTIONS = [
  { value: "Bank transfer", label: "Bank transfer" },
  { value: "Cheque", label: "Cheque" },
  { value: "Cash", label: "Cash" },
];

/** Create or edit an employee (HR only). Shared form, two modes. */
export function EmployeeFormDialog({
  departments,
  employee,
  trigger,
}: {
  departments: Array<{ id: string; name: string }>;
  employee?: EditableEmployee;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(employee);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const defaults: Values = {
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    matricule: employee?.matricule ?? "",
    departmentId: employee?.departmentId ?? departments[0]?.id ?? "",
    employmentType: (employee?.employmentType as Values["employmentType"]) ?? "FULL_TIME",
    baseSalaryDA: employee?.baseSalaryDA ?? 60000,
    iepRate: employee?.iepRate ?? 0,
    position: employee?.position ?? "",
    category: employee?.category ?? "",
    echelon: employee?.echelon ?? "",
    hireDate: employee?.hireDate ?? "",
    ssNumber: employee?.ssNumber ?? "",
    cotisantNumber: employee?.cotisantNumber ?? "",
    maritalStatus: employee?.maritalStatus ?? "",
    childrenCount: employee?.childrenCount ?? 0,
    paymentMethod: employee?.paymentMethod || "Bank transfer",
    accountRef: employee?.accountRef ?? "",
  };

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });

  useEffect(() => {
    if (open) form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const errors = form.formState.errors;
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  async function onSubmit(values: Values) {
    setSaving(true);
    try {
      if (isEdit && employee) {
        await updateEmployee({ ...values, employeeId: employee.id, matricule: values.matricule ?? "" });
        toast.success("Employee updated.");
      } else {
        const result = await createEmployee({ ...values, matricule: values.matricule ?? "" });
        toast.success(`Employee created · ${result.matricule}`);
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the employee.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <UserPlus className="size-4" /> Add Employee
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit employee" : "Add employee"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the HR record. Changes are audited."
              : "Create the HR record used by payroll. One employee belongs to exactly one department."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#596760]">Identity</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name" htmlFor="emp-first" error={errors.firstName?.message}>
                <Input id="emp-first" placeholder="Lina" {...form.register("firstName")} />
              </Field>
              <Field label="Last name" htmlFor="emp-last" error={errors.lastName?.message}>
                <Input id="emp-last" placeholder="Boudiaf" {...form.register("lastName")} />
              </Field>
              <Field label="Employee No." htmlFor="emp-matricule" hint={isEdit ? undefined : "Auto-generated when empty"}>
                <Input id="emp-matricule" placeholder="SOS-0248" {...form.register("matricule")} />
              </Field>
              <Field label="Department" error={errors.departmentId?.message}>
                <Controller
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <SelectField value={field.value} onValueChange={field.onChange} options={departmentOptions} aria-label="Department" />
                  )}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#596760]">Employment</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Employment type">
                <Controller
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <SelectField value={field.value} onValueChange={field.onChange} options={TYPE_OPTIONS} aria-label="Employment type" />
                  )}
                />
              </Field>
              <Field label="Position" htmlFor="emp-position">
                <Input id="emp-position" placeholder="Software Engineer" {...form.register("position")} />
              </Field>
              <Field label="Category" htmlFor="emp-category">
                <Input id="emp-category" placeholder="E 0" {...form.register("category")} />
              </Field>
              <Field label="Grade / step" htmlFor="emp-echelon">
                <Input id="emp-echelon" placeholder="00" {...form.register("echelon")} />
              </Field>
              <Field label="Hire date" htmlFor="emp-hire" hint="DD/MM/YYYY">
                <Input id="emp-hire" placeholder="01/01/2016" {...form.register("hireDate")} />
              </Field>
              <Field label="Marital status">
                <Controller
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <SelectField value={field.value || ""} onValueChange={field.onChange} options={MARITAL_OPTIONS} aria-label="Marital status" />
                  )}
                />
              </Field>
              <Field label="Dependent children" htmlFor="emp-children" error={errors.childrenCount?.message}>
                <Input id="emp-children" type="number" min={0} max={20} step={1} {...form.register("childrenCount", { valueAsNumber: true })} />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#596760]">Salary</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Monthly base salary (DA)" htmlFor="emp-base" error={errors.baseSalaryDA?.message} hint="SNMG minimum 24,000 DA">
                <Input id="emp-base" type="number" min={24000} step={100} {...form.register("baseSalaryDA", { valueAsNumber: true })} />
              </Field>
              <Field label="Experience IEP (%)" htmlFor="emp-iep" error={errors.iepRate?.message}>
                <Input id="emp-iep" type="number" min={0} max={100} step="0.1" {...form.register("iepRate", { valueAsNumber: true })} />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#596760]">Social & payment</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Social security number" htmlFor="emp-ss">
                <Input id="emp-ss" placeholder="1234567890" {...form.register("ssNumber")} />
              </Field>
              <Field label="Contributor No." htmlFor="emp-cotisant">
                <Input id="emp-cotisant" placeholder="23 56724250" {...form.register("cotisantNumber")} />
              </Field>
              <Field label="Payment method">
                <Controller
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <SelectField value={field.value} onValueChange={field.onChange} options={PAYMENT_OPTIONS} aria-label="Payment method" />
                  )}
                />
              </Field>
              <Field label="Account reference" htmlFor="emp-account">
                <Input id="emp-account" placeholder="Account number" {...form.register("accountRef")} />
              </Field>
            </div>
          </section>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : isEdit ? <Pencil className="size-4" /> : <UserPlus className="size-4" />}
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
