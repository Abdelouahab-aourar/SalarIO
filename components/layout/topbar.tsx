"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/lib/nav";

/**
 * Workspace top bar — breadcrumb, with the shadcn sidebar trigger available
 * at every breakpoint so the sidebar can be collapsed or opened at any time.
 */
export function Topbar() {
  const pathname = usePathname();
  const root = `/${pathname.split("/")[1] ?? ""}`;
  const item = NAV_ITEMS.find((n) => n.href === root);
  const breadcrumb = item?.label ?? "Workspace";

  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-[#DCE6DF] bg-[#F8F9F6]/95 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1 size-9 text-[#173B32]" aria-label="Toggle navigation" />
        <p className="truncate text-[12px] text-[#62776E]">
          Workspace <span className="mx-1">/</span>
          <span className="font-bold text-[#173B32]">{breadcrumb}</span>
        </p>
      </div>
    </header>
  );
}
