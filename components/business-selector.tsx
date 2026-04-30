"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  businesses: { id: string; name: string }[];
  currentBusinessId: string | null;
  paramName?: string;
}

export function BusinessSelector({
  businesses,
  currentBusinessId,
  paramName = "businessId",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const value = currentBusinessId ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-foreground font-medium">Business</span>
      <Select
        value={value}
        onValueChange={(id) => {
          router.push(`${pathname}?${paramName}=${encodeURIComponent(id)}`);
        }}
      >
        <SelectTrigger className="w-[220px]" data-testid="business-selector">
          <SelectValue placeholder="Select business" />
        </SelectTrigger>
        <SelectContent>
          {businesses.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
