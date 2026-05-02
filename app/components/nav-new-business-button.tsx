"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NavNewBusinessButton() {
  return (
    <Button variant="ghost" size="icon-xs" asChild title="New business" aria-label="New business">
      <Link href="/dashboard/onboarding" data-testid="nav-new-business">
        <Plus className="size-3" aria-hidden />
      </Link>
    </Button>
  );
}
