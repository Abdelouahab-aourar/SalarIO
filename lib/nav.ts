import {
  LayoutDashboard, Users, Building2, CalendarOff, UserRound, Calculator,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Role = "HR" | "AUTHORIZED" | "APPROVER" | "EMPLOYEE";

export type NavItem = {
  key: "overview" | "employees" | "departments" | "salaryCalculation" | "absences" | "account";
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
};

/**
 * Single source of truth for workspace navigation.
 * Modules temporarily out of scope (payroll processing/history, payslips,
 * reports, settings) were removed per the client's request; departments now
 * own their salary rules.
 */
export const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Overview", href: "/overview", icon: LayoutDashboard, roles: ["HR", "APPROVER"] },
  { key: "employees", label: "Employees", href: "/employees", icon: Users, roles: ["HR", "AUTHORIZED", "APPROVER"] },
  { key: "departments", label: "Departments", href: "/departments", icon: Building2, roles: ["HR", "AUTHORIZED", "APPROVER"] },
  { key: "salaryCalculation", label: "Salary Calculation", href: "/salary-calculation", icon: Calculator, roles: ["HR"] },
  { key: "absences", label: "Absences", href: "/absences", icon: CalendarOff, roles: ["HR", "AUTHORIZED"] },
  { key: "account", label: "My account", href: "/account", icon: UserRound, roles: ["EMPLOYEE"] },
];

/** Landing route per role — used by the logo and post-login redirect. */
export function homeForRole(role: string): string {
  if (role === "EMPLOYEE") return "/account";
  if (role === "AUTHORIZED") return "/absences";
  return "/overview";
}
