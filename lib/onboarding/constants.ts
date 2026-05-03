export const ROLES = ["Founder", "Developer", "Product", "Other"] as const;

export const TOTAL_STEPS = 8;

export const LOADING_MESSAGES = [
  "Saving your business to the workspace...",
  "Linking you to this company...",
  "Almost there...",
] as const;

/** Shown after create succeeds — “reasoning” copy while Grill-Me context is primed (min delay in client). */
export const PREPARING_GRILL_STEPS = [
  "Analyserer dit projekt og det, du har indtastet…",
  "Uddrager struktur fra GitHub (hvis du angav et repo)",
  "Bygger et interview-overview (kritiske huller først)",
  "Åbner din Grill-Me samtale…",
] as const;
