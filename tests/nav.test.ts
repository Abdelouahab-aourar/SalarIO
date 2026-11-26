/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homeForRole, NAV_ITEMS, type Role } from "@/lib/nav";

const ROLES: Role[] = ["HR", "AUTHORIZED", "APPROVER", "EMPLOYEE"];

describe("workspace navigation manifest", () => {
  test("every nav href resolves to a real page file", () => {
    for (const item of NAV_ITEMS) {
      const page = join(process.cwd(), "app", "(workspace)", item.href.slice(1), "page.tsx");
      expect(existsSync(page)).toBe(true);
    }
  });

  test("removed modules are absent from navigation", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    for (const removed of ["/payroll", "/history", "/payslips", "/reports", "/settings", "/salary-rules"]) {
      expect(hrefs).not.toContain(removed);
    }
  });

  test("each role only sees permitted modules", () => {
    const visible = (role: Role) => NAV_ITEMS.filter((i) => i.roles.includes(role)).map((i) => i.href);
    expect(visible("HR")).toEqual(["/overview", "/employees", "/departments", "/salary-calculation", "/absences"]);
    expect(visible("EMPLOYEE")).toEqual(["/account"]);
    expect(visible("APPROVER")).toContain("/overview");
    expect(visible("APPROVER")).not.toContain("/absences");
    expect(visible("AUTHORIZED")).toContain("/departments");
    expect(visible("AUTHORIZED")).not.toContain("/overview");
  });
});

describe("role home routing", () => {
  test("routes each role to a module it can access", () => {
    expect(homeForRole("HR")).toBe("/overview");
    expect(homeForRole("APPROVER")).toBe("/overview");
    expect(homeForRole("AUTHORIZED")).toBe("/absences");
    expect(homeForRole("EMPLOYEE")).toBe("/account");
    for (const role of ROLES) {
      const home = homeForRole(role);
      const item = NAV_ITEMS.find((i) => i.href === home);
      expect(item?.roles).toContain(role);
    }
  });
});
