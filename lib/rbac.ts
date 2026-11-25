import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type Role = "HR" | "AUTHORIZED" | "APPROVER" | "EMPLOYEE";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  employeeId: string | null;
};

/** Server-side session resolution. Never trust client-supplied role claims. */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    const u = session.user as unknown as Record<string, unknown>;
    const role = (u["role"] as Role | undefined) ?? "EMPLOYEE";
    return {
      id: String(u["id"] ?? ""),
      email: String(u["email"] ?? ""),
      name: String(u["name"] ?? ""),
      role: ["HR", "AUTHORIZED", "APPROVER", "EMPLOYEE"].includes(role)
        ? role
        : "EMPLOYEE",
      employeeId: (u["employeeId"] as string | null | undefined) ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser(loginPath = "/login"): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect(loginPath);
  return user;
}

/** Enforce one-or-more roles server-side. Throws/redirects on denial. */
export async function requireRole(...roles: Role[]): Promise<AuthUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/unauthorized");
  return user;
}

/**
 * Department scope for the current user (server-side, IDOR protection).
 * - HR: every department.
 * - AUTHORIZED: only departments granted in UserDepartmentPermission.
 * - APPROVER: every department, read-only on submitted payroll.
 * - EMPLOYEE: none (own payslip only).
 * Returns null when the DB is unavailable (demo mode → open scope for HR demo).
 */
export async function getAccessibleDepartmentIds(
  user: AuthUser,
): Promise<string[] | "ALL" | "NONE"> {
  if (user.role === "HR" || user.role === "APPROVER") return "ALL";
  if (user.role === "EMPLOYEE") return "NONE";
  if (!prisma) return "NONE"; // fail closed: no DB → no scope (ADV-007)
  const rows = await prisma.userDepartmentPermission.findMany({
    where: { userId: user.id },
    select: { departmentId: true },
  });
  return rows.map((r) => r.departmentId);
}

export function canEnterInputs(user: AuthUser): boolean {
  return user.role === "HR" || user.role === "AUTHORIZED";
}

export function canManageRules(user: AuthUser): boolean {
  return user.role === "HR";
}

export function canApprove(user: AuthUser): boolean {
  return user.role === "APPROVER";
}

/** Valid payroll state transitions (server-enforced, FR-13/14/15). */
export const PAYROLL_TRANSITIONS: Record<string, string[]> = {
  IN_REVIEW: ["PENDING"],
  PENDING: ["APPROVED", "REJECTED"],
  // HR may correct (recalculate) a rejected payroll before resubmitting.
  REJECTED: ["IN_REVIEW", "PENDING"],
  APPROVED: [],
};

export function canTransition(from: string, to: string): boolean {
  return (PAYROLL_TRANSITIONS[from] ?? []).includes(to);
}
