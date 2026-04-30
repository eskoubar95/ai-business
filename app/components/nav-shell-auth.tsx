"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@neondatabase/auth/react";

export function NavShellAuth() {
  return (
    <div className="flex items-center gap-3 text-sm">
      <SignedOut>
        <Link
          href="/auth/sign-in"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign up
        </Link>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
