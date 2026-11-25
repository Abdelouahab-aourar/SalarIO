import { z } from "zod";
import { defaultPayPeriod } from "./salary";

const amount = z
  .number({ error: "Enter a valid amount." })
  .min(0, { error: "Amount cannot be negative." })
  .max(100_000_000, { error: "Amount is too large." });

const infoText = (max: number) =>
  z.string().max(max, { error: "Value is too long." });

export const employeeInfoSchema = z.object({
  companyName: infoText(60),
  payMonth: infoText(30),
  cotisantNumber: infoText(30),
  matricule: infoText(20),
  lastName: infoText(40),
  firstName: infoText(40),
  paymentMethod: infoText(20),
  account: infoText(40),
  maritalStatus: infoText(20),
  childrenCount: z
    .number({ error: "Enter a valid number." })
    .min(0, { error: "Cannot be negative." })
    .max(20, { error: "Too many." }),
  hireDate: infoText(20),
  socialSecurityNumber: infoText(30),
  category: infoText(10),
  echelon: infoText(10),
  position: infoText(60),
});

export const deductionSchema = z.object({
  id: z.string().min(1).max(50),
  label: z
    .string({ error: "Enter a deduction name." })
    .trim()
    .min(1, { error: "Enter a deduction name." })
    .max(50, { error: "Name is too long." }),
  amount: amount,
});
export const bonusSchema = z
  .object({
    id: z.string().min(1).max(50),
    label: z
      .string({ error: "Enter a bonus name." })
      .trim()
      .min(1, { error: "Enter a bonus name." })
      .max(50, { error: "Name is too long." }),
    amount: amount,
    taxable: z.boolean(),
    mode: z.enum(["fixed", "percent"]),
  })
  .refine((bonus) => bonus.mode !== "percent" || bonus.amount <= 100, {
    error: "Percentage cannot exceed 100%.",
    path: ["amount"],
  });

export const salaryFormSchema = z.object({
  baseSalary: z
    .number({ error: "Enter the monthly base salary." })
    .min(24_000, {
      error: "Base salary cannot be below the SNMG of 24,000 DA.",
    })
    .max(100_000_000, { error: "Amount is too large." }),
  iepRate: z
    .number({ error: "Enter the IEP percentage." })
    .min(0, { error: "Percentage cannot be negative." })
    .max(100, { error: "Percentage cannot exceed 100%." }),
  overtimeHours: z
    .number({ error: "Enter the overtime hours." })
    .min(0, { error: "Hours cannot be negative." })
    .max(744, { error: "Hours cannot exceed 744 in a month." }),
  absenceDays: z
    .number({ error: "Enter the absence days." })
    .min(0, { error: "Days cannot be negative." })
    .max(30, { error: "Days cannot exceed 30 in a month." }),
  bonuses: z
    .array(bonusSchema)
    .max(20, { error: "Too many bonuses (max 20)." }),
  deductions: z
    .array(deductionSchema)
    .max(20, { error: "Too many deductions (max 20)." }),
  specialRegime: z.boolean(),
  info: employeeInfoSchema,
});

export type SalaryFormValues = z.infer<typeof salaryFormSchema>;

export const DEFAULT_FORM_VALUES: SalaryFormValues = {
  baseSalary: 60_000,
  iepRate: 0,
  overtimeHours: 0,
  absenceDays: 0,
  bonuses: [],
  deductions: [],
  specialRegime: false,
  info: {
    companyName: "",
    payMonth: defaultPayPeriod(),
    cotisantNumber: "",
    matricule: "",
    lastName: "",
    firstName: "",
    paymentMethod: "",
    account: "",
    maritalStatus: "",
    childrenCount: 0,
    hireDate: "",
    socialSecurityNumber: "",
    category: "",
    echelon: "",
    position: "",
  },
};

export const EXAMPLE_FORM_VALUES: SalaryFormValues = {
  baseSalary: 60_000,
  iepRate: 10,
  overtimeHours: 0,
  absenceDays: 0,
  bonuses: [
    {
      id: "performance",
      label: "Performance bonus",
      amount: 5_000,
      taxable: true,
      mode: "fixed",
    },
    {
      id: "panier",
      label: "Meal allowance (Panier)",
      amount: 5_000,
      taxable: false,
      mode: "fixed",
    },
    {
      id: "transport",
      label: "Transport",
      amount: 3_000,
      taxable: false,
      mode: "fixed",
    },
  ],
  deductions: [{ id: "advance", label: "Salary advance", amount: 1_000 }],
  specialRegime: false,
  info: {
    companyName: "SOS GROUPE",
    payMonth: "NOVEMBER 2026",
    cotisantNumber: "23 56724250",
    matricule: "15000",
    lastName: "KEBAS",
    firstName: "Faycel",
    paymentMethod: "Bank transfer",
    account: "",
    maritalStatus: "Married",
    childrenCount: 1,
    hireDate: "01/01/2016",
    socialSecurityNumber: "1234567890",
    category: "E 0",
    echelon: "00",
    position: "HEAD OF DEPARTMENT",
  },
};
