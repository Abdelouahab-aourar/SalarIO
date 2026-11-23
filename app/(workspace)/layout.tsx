import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireUser } from "@/lib/rbac";

// Authenticated workspace: session access blocks instant nav validation.
// (Next 16 cacheComponents: `instant = false` opts the segment out.)
export const instant = false;

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication gate: every workspace route redirects to
  // /login without a valid Better Auth session.
  const user = await requireUser();

  return (
    <SidebarProvider style={{ "--sidebar-width": "14.5rem" } as React.CSSProperties}>
      <AppSidebar user={{ name: user.name, email: user.email, role: user.role }} />
      <SidebarInset className="min-h-svh min-w-0 bg-[#F8F9F6]">
        <Topbar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
