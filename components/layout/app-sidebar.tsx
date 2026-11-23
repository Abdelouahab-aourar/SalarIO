"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LockKeyhole, LogOut, ChevronsUpDown, Loader2, Ban } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Logo } from "@/components/marketing/logo";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { homeForRole, NAV_ITEMS } from "@/lib/nav";

const ROLE_LABEL: Record<string, string> = {
  HR: "HR operator",
  AUTHORIZED: "Authorized user",
  APPROVER: "Approver",
  EMPLOYEE: "Employee",
};

export function AppSidebar({ user }: { user: { name: string; email: string; role: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role as never));
  const home = homeForRole(user.role);
  const initials = (user.name || user.email)
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    setSigningOut(true);
    setError(null);
    try {
      const result = await authClient.signOut();
      if (result?.error) {
        setError("Sign-out failed. Check your connection and try again.");
        toast.error("Sign-out failed. Check your connection and try again.");
        return;
      }
      router.push("/login");
      router.refresh();
      if (isMobile) setOpenMobile(false);
    } catch {
      setError("Sign-out failed. Check your connection and try again.");
      toast.error("Sign-out failed. Check your connection and try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r-0",
        "[&_[data-sidebar=sidebar]]:bg-gradient-to-b [&_[data-sidebar=sidebar]]:from-[#24624F] [&_[data-sidebar=sidebar]]:to-[#102E29]",
      )}
    >
      <SidebarHeader className="px-3 pt-5 pb-1 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pt-4">
        <div className="flex w-full items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <Link
            href={home}
            aria-label="SALARIO workspace"
            onClick={() => isMobile && setOpenMobile(false)}
            className="flex w-full min-w-0 items-center group-data-[collapsible=icon]:justify-center"
          >
            <span className="group-data-[collapsible=icon]:hidden">
              <Logo subtitle="BY SOS GROUPE" />
            </span>
            <span className="hidden group-data-[collapsible=icon]:inline-flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/salario-logo.svg" alt="SALARIO" className="size-7 object-contain" />
            </span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-bold tracking-[1.7px] text-[#A8C9B5] group-data-[collapsible=icon]:hidden">
            HR WORKSPACE
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="h-10 rounded-[9px] px-2.5 text-[12px] font-semibold text-[#D1E5D9] transition-colors hover:bg-white/10 hover:text-white data-[active=true]:[--sidebar-accent:#A8C9B5] data-[active=true]:[--sidebar-accent-foreground:#102E29] data-[active=true]:font-bold"
                    >
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        <Icon className="size-[17px]" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 px-3 pb-5 group-data-[collapsible=icon]:px-2">
        <div className="rounded-2xl border border-white/20 bg-white/5 p-4 shadow group-data-[collapsible=icon]:hidden">
          <LockKeyhole className="size-[22px] text-[#A8C9B5]" />
          <p className="mt-2 text-[13px] font-bold text-white">One HR workspace.</p>
          <p className="mt-1 text-[11px] leading-[1.45] text-[#A8C9B5]">
            Every module. One clear view of your people and payroll.
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex w-full items-center gap-2.5 rounded-xl px-1 py-1 text-left transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#A8C9B5] focus-visible:outline-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#A8C9B5] text-[11px] font-extrabold text-[#102E29] group-data-[collapsible=icon]:size-8">
                {initials}
              </span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-[12px] font-bold text-white">{user.name}</span>
                <span className="block truncate text-[10px] text-[#A8C9B5]">{ROLE_LABEL[user.role] ?? user.role}</span>
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-[#A8C9B5] group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-60">
            <DropdownMenuLabel>
              <span className="block text-[12px] font-bold text-[#173B32]">{user.name}</span>
              <span className="block truncate text-[11px] font-normal text-[#62776E]">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} disabled={signingOut} className="gap-2 text-[#a02a2a]">
              {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              {signingOut ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {error ? (
          <p role="alert" className="px-2.5 text-[10px] leading-4 text-[#FFD2D2] group-data-[collapsible=icon]:hidden">
            {error}
          </p>
        ) : null}

        {user.role === "EMPLOYEE" ? (
          <div className="flex items-center gap-2 rounded-[9px] px-2.5 py-2 text-[10px] text-[#A8C9B5] group-data-[collapsible=icon]:hidden">
            <Ban className="size-3.5 shrink-0" />
            Company payroll is restricted for employee accounts.
          </div>
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
