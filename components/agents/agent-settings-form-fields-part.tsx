"use client";

import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/lib/utils";

export function FieldInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  testId,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  testId?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="section-label">
        {label}
      </label>
      <input
        id={id}
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-9 w-full rounded-md border border-border bg-transparent",
          "px-3 text-[13px] text-foreground placeholder:text-muted-foreground/30",
          "outline-none transition-colors focus:border-white/[0.18]",
        )}
      />
    </div>
  );
}

export function FieldSelect({
  id,
  label,
  value,
  onChange,
  options,
  testId,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; description?: string }[];
  testId?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="section-label">
        {label}
      </label>
      <CustomSelect
        id={id}
        value={value}
        onChange={onChange}
        options={options}
        data-testid={testId}
      />
    </div>
  );
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="border-t border-white/[0.06] pt-5">
      <p className="section-label mb-4">{label}</p>
    </div>
  );
}
