"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { createDepartment } from "@/lib/entry-actions";
import { updateDepartment } from "@/lib/admin-actions";

const componentSchema = z.object({
  label: z.string().trim().min(1, "Name the component.").max(40),
  taxable: z.boolean(),
  mode: z.enum(["fixed", "percent"]),
  value: z.number().min(0).max(10_000_000),
});

const schema = z.object({
  name: z.string().trim().min(1, "Department name is required.").max(60),
  description: z.string().trim().max(200),
  basePayMethod: z.enum(["MONTHLY_BASE", "DAILY_BASE"]),
  absenceMethod: z.enum(["DAILY_BASE_DIV_30", "DAILY_BASE_DIV_26", "NONE"]),
  referenceDays: z.number().int().min(26).max(31),
  overtimeRate: z.number().min(1).max(2),
  components: z.array(componentSchema).max(10),
});

type Values = z.infer<typeof schema>;

const BASE_OPTIONS = [
  { value: "MONTHLY_BASE", label: "Monthly base salary" },
  { value: "DAILY_BASE", label: "Daily base rate" },
];
const ABSENCE_OPTIONS = [
  { value: "DAILY_BASE_DIV_30", label: "Daily rate = base ÷ 30" },
  { value: "DAILY_BASE_DIV_26", label: "Daily rate = base ÷ 26" },
  { value: "NONE", label: "No absence deduction" },
];

export type EditableDepartment = {
  id: string;
  name: string;
  description: string;
  basePayMethod: string;
  absenceMethod: string;
  referenceDays: number;
  overtimeRate: number;
  components: Array<{ label: string; taxable: boolean; mode: string; value: number }>;
};

/** Shared create/edit form for a department and its salary calculation rule. */
export function DepartmentFormDialog({
  companyId,
  department,
  trigger,
}: {
  companyId?: string;
  department?: EditableDepartment;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(department);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: department?.name ?? "",
      description: department?.description ?? "",
      basePayMethod: (department?.basePayMethod as Values["basePayMethod"]) ?? "MONTHLY_BASE",
      absenceMethod: (department?.absenceMethod as Values["absenceMethod"]) ?? "DAILY_BASE_DIV_30",
      referenceDays: department?.referenceDays ?? 30,
      overtimeRate: department?.overtimeRate ?? 1.5,
      components: (department?.components ?? []).map((component) => ({
        label: component.label,
        taxable: component.taxable,
        mode: component.mode === "percent" ? ("percent" as const) : ("fixed" as const),
        value: component.value,
      })),
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: department?.name ?? "",
      description: department?.description ?? "",
      basePayMethod: (department?.basePayMethod as Values["basePayMethod"]) ?? "MONTHLY_BASE",
      absenceMethod: (department?.absenceMethod as Values["absenceMethod"]) ?? "DAILY_BASE_DIV_30",
      referenceDays: department?.referenceDays ?? 30,
      overtimeRate: department?.overtimeRate ?? 1.5,
      components: (department?.components ?? []).map((component) => ({
        label: component.label,
        taxable: component.taxable,
        mode: component.mode === "percent" ? ("percent" as const) : ("fixed" as const),
        value: component.value,
      })),
    });
  }, [open, department, form]);

  const components = form.watch("components");
  const errors = form.formState.errors;

  async function onSubmit(values: Values) {
    setSaving(true);
    try {
      if (isEdit && department) {
        await updateDepartment({
          departmentId: department.id,
          name: values.name,
          description: values.description,
          basePayMethod: values.basePayMethod,
          absenceMethod: values.absenceMethod,
          referenceDays: values.referenceDays,
          overtimeRate: values.overtimeRate,
          components: values.components,
        });
        toast.success("Department updated. A new rule version was recorded.");
      } else {
        if (!companyId) throw new Error("Company workspace not found.");
        await createDepartment(companyId, values);
        toast.success(`Department "${values.name}" created with its payroll rule.`);
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the department.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Building2 className="size-4" /> Add department
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit department" : "Add department"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Changes to the calculation rule create a new dated version; existing versions stay intact."
              : "Create the department with its name and salary calculation rules."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#596760]">Department</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" htmlFor="dept-name" error={errors.name?.message}>
                <Input id="dept-name" placeholder="Engineering" {...form.register("name")} />
              </Field>
              <Field label="Description" htmlFor="dept-description">
                <Input id="dept-description" placeholder="Monthly base + project bonuses" {...form.register("description")} />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#596760]">Salary calculation rules</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Base pay method">
                <Controller
                  control={form.control}
                  name="basePayMethod"
                  render={({ field }) => (
                    <SelectField value={field.value} onValueChange={field.onChange} options={BASE_OPTIONS} />
                  )}
                />
              </Field>
              <Field label="Absence deduction">
                <Controller
                  control={form.control}
                  name="absenceMethod"
                  render={({ field }) => (
                    <SelectField value={field.value} onValueChange={field.onChange} options={ABSENCE_OPTIONS} />
                  )}
                />
              </Field>
              <Field label="Reference days / month" htmlFor="dept-days" error={errors.referenceDays?.message}>
                <Input id="dept-days" type="number" min={26} max={31} step={1} {...form.register("referenceDays", { valueAsNumber: true })} />
              </Field>
              <Field label="Overtime rate" htmlFor="dept-overtime" error={errors.overtimeRate?.message} hint="1.5 = 150% of the hourly rate">
                <Input id="dept-overtime" type="number" min={1} max={2} step="0.1" {...form.register("overtimeRate", { valueAsNumber: true })} />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#596760]">Default allowances (optional)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => form.setValue("components", [...components, { label: "", taxable: false, mode: "fixed", value: 0 }])}
                  disabled={components.length >= 10}
                >
                  <Plus className="size-3.5" /> Add
                </Button>
              </div>
              {components.length === 0 ? (
                <p className="rounded-[10px] border border-dashed border-[#DCE6DF] px-3 py-4 text-center text-[12px] text-[#62776E]">
                  No default allowances.
                </p>
              ) : (
                <div className="space-y-2">
                  {components.map((component, index) => (
                    <div key={index} className="grid gap-2 rounded-[10px] border border-[#DCE6DF] p-3 sm:grid-cols-[1.4fr_0.9fr_0.9fr_0.8fr_auto]">
                      <Field label="Name" error={errors.components?.[index]?.label?.message}>
                        <Input placeholder="Meal allowance" {...form.register(`components.${index}.label`)} />
                      </Field>
                      <Field label="Type">
                        <Controller
                          control={form.control}
                          name={`components.${index}.mode`}
                          render={({ field }) => (
                            <SelectField
                              value={field.value}
                              onValueChange={field.onChange}
                              options={[{ value: "fixed", label: "Fixed" }, { value: "percent", label: "% of base" }]}
                            />
                          )}
                        />
                      </Field>
                      <Field label={component.mode === "percent" ? "Rate %" : "Amount DA"}>
                        <Input type="number" min={0} step={component.mode === "percent" ? "0.1" : "100"} {...form.register(`components.${index}.value`, { valueAsNumber: true })} />
                      </Field>
                      <Field label="Taxable">
                        <Controller
                          control={form.control}
                          name={`components.${index}.taxable`}
                          render={({ field }) => (
                            <SelectField
                              value={field.value ? "true" : "false"}
                              onValueChange={(v) => field.onChange(v === "true")}
                              options={[{ value: "false", label: "No" }, { value: "true", label: "Yes" }]}
                            />
                          )}
                        />
                      </Field>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove component"
                          onClick={() => form.setValue("components", components.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="size-4 text-[#a02a2a]" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </section>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : isEdit ? <Pencil className="size-4" /> : <Building2 className="size-4" />}
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
