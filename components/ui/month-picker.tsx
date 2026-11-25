"use client";

import { useState } from "react";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parsePeriod(value: string): Date {
  const [year, month] = value.split("-").map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month)) return new Date();
  return new Date(year, month - 1, 1);
}

function toPeriod(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatPeriod(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/**
 * Month + year picker built from the shadcn Calendar (react-day-picker) in a
 * Popover. Selecting any day resolves to that month; absences and salary
 * calculations are grouped by the resulting "YYYY-MM" period.
 */
export function MonthPicker({
  value,
  onChange,
  id,
  className,
  disabled,
  label = "Select month",
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = parsePeriod(value);

  function shiftMonth(offset: number) {
    const next = new Date(date.getFullYear(), date.getMonth() + offset, 1);
    onChange(toPeriod(next));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={label}
          className={cn("h-10 w-full justify-between bg-white px-3 font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="size-4 shrink-0 text-[#62776E]" />
            {formatPeriod(date)}
          </span>
          <ChevronDown className="size-4 shrink-0 text-[#62776E]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(next) => {
            if (!next) return;
            onChange(toPeriod(next));
            setOpen(false);
          }}
          captionLayout="dropdown"
          startMonth={new Date(2015, 0)}
          endMonth={new Date(2035, 11)}
        />
        <div className="flex items-center justify-between gap-2 border-t border-[#DCE6DF] px-3 py-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => shiftMonth(-1)}>
            Previous month
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => shiftMonth(1)}>
            Next month
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
