"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type EmployeeOption = {
  id: string;
  name: string;
  matricule: string;
  departmentId: string;
  departmentName: string;
};

/**
 * Searchable employee picker (name / employee No. / department).
 * Used by absence entry and salary calculation so HR never scrolls a long
 * native select.
 */
export function EmployeeCombobox({
  employees,
  value,
  onChange,
  placeholder = "Search employee by name or No.…",
  disabled,
  id,
}: {
  employees: EmployeeOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = employees.find((e) => e.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-10 w-full justify-between bg-white px-3 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2 text-left">
            <Search className="size-4 shrink-0 text-[#62776E]" />
            <span className="truncate">
              {selected ? (
                <>
                  <span className="font-semibold">{selected.name}</span>
                  <span className="ml-2 text-[11px] text-[#62776E]">{selected.matricule}</span>
                </>
              ) : (
                <span className="text-[#62776E]">{placeholder}</span>
              )}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-[#62776E]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Type a name, employee No. or department…" />
          <CommandList>
            <CommandEmpty>No employee found.</CommandEmpty>
            <CommandGroup>
              {employees.map((e) => (
                <CommandItem
                  key={e.id}
                  value={`${e.name} ${e.matricule} ${e.departmentName}`}
                  onSelect={() => {
                    onChange(e.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-4", value === e.id ? "opacity-100" : "opacity-0")} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] font-semibold">{e.name}</span>
                    <span className="truncate text-[11px] text-[#62776E]">
                      {e.matricule} · {e.departmentName}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
