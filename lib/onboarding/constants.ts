export const ROLES = ["Founder", "Developer", "Product", "Other"] as const;

export const TOTAL_STEPS = 8;

export const LOADING_MESSAGES = [
  "Setting up your workspace…",
  "Linking you to this business…",
  "Almost there…",
] as const;

/** Shown after create succeeds — reasoning copy while Grill-Me context is primed (min delay in client). */
export const PREPARING_GRILL_STEPS = [
  "Reading what you shared…",
  "Pulling structure from GitHub (if you added a repo)",
  "Building an interview plan — critical gaps first",
  "Opening your Grill-Me session…",
] as const;
