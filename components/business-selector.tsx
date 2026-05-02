"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const value = currentBusinessId ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-foreground font-medium">Business</span>
      <Select
        value={value}
        onValueChange={(id) => {
          const p = new URLSearchParams(searchParams?.toString() ?? "");
          p.set(paramName, id);
          const qs = p.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
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
