"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export function AppProgressBar() {
  return (
    <ProgressBar
      height="2px"
      color="#A8EB12"
      options={{ showSpinner: false }}
      shallowRouting
      delay={100}
    />
  );
}
