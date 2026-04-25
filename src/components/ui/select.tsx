"use client";
import * as React from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Select({ value, onChange, placeholder, disabled, className, children }: SelectProps) {
  const childArray = React.Children.toArray(children);
  const selected = childArray.find(
    (c): c is React.ReactElement<SelectOptionProps> =>
      React.isValidElement<SelectOptionProps>(c) && c.props.value === value
  );

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={cn("relative", className)}>
        <ListboxButton
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm transition-smooth focus:outline-none focus:border-primary focus:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span className={cn("truncate text-left", !selected && "text-muted-foreground")}>
            {selected ? selected.props.children : placeholder ?? "Selecione..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </ListboxButton>
        <Transition
          as={React.Fragment}
          enter="transition ease-out duration-150"
          enterFrom="opacity-0 -translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions
            className={cn(
              "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-soft scrollbar-thin focus:outline-none"
            )}
          >
            {children}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}

export interface SelectOptionProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SelectOption({ value, children, disabled }: SelectOptionProps) {
  return (
    <ListboxOption
      value={value}
      disabled={disabled}
      className={({ active, selected }) =>
        cn(
          "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-smooth",
          active && "bg-accent text-accent-foreground",
          selected && "font-medium",
          disabled && "cursor-not-allowed opacity-50"
        )
      }
    >
      {({ selected }) => (
        <>
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            {selected ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
          </span>
          <span className="truncate">{children}</span>
        </>
      )}
    </ListboxOption>
  );
}
