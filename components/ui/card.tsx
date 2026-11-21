import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Surface card used across the workspace (Figma "Premium Forest"). */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-[#DCE6DF] bg-white shadow-[0_1px_2px_rgba(23,59,53,0.06)]", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("border-b border-[#DCE6DF]/70 px-5 py-4", className)}>{children}</div>;
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-5 py-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("border-t border-[#DCE6DF]/70 px-5 py-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn("text-[15px] font-bold text-[#102E29]", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("text-[11px] text-[#62776E]", className)}>{children}</p>;
}
