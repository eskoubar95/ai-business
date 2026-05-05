import { NextResponse } from "next/server";

import { getError } from "@/lib/templates/error-registry";

import type { PolicyError } from "./policy-enforcer";

export function jsonPolicyViolation(policyError: PolicyError): Response {
  const meta = getError(policyError.error_code);
  return NextResponse.json(policyError, { status: meta.http_status });
}
