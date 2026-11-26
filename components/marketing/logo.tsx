import { cn } from "@/lib/utils";

/**
 * SALARIO brand lockup — logo mark exported from the Figma source file
 * (public/landing/salario-logo.svg), matching the design's 31×41.16 mark.
 */
export function Logo({
  className,
  wordmarkClassName,
  subtitle,
  href,
  size = "md",
}: {
  className?: string;
  wordmarkClassName?: string;
  subtitle?: string;
  href?: string;
  size?: "sm" | "md";
}) {
  const lockup = (
    <span className={cn("inline-flex shrink-0 items-center", size === "sm" ? "gap-2" : "gap-[11px]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/salario-logo.svg"
        alt=""
        width={31}
        height={41}
        className={size === "sm" ? "h-[32px] w-[24px] shrink-0" : "h-[41px] w-[31px] shrink-0"}
      />
      <span className="flex flex-col">
        <span
          className={cn(
            "font-extrabold leading-[1.45] tracking-[1px]",
            size === "sm" ? "text-[18px] sm:text-[23px]" : "text-[23px]",
            wordmarkClassName ?? "text-white",
          )}
        >
          SALARIO
        </span>
        {subtitle ? (
          <span className={cn("font-bold tracking-[2px] text-[#A8C9B5]", size === "sm" ? "hidden text-[7px] sm:block sm:text-[8px]" : "text-[8px]")}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
  if (!href) return lockup;
  return <a href={href} aria-label="SALARIO home">{lockup}</a>;
}
