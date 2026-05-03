/** Shared Grill-Me wizard / API types (legacy module name retained for imports). */

export type GrillBusinessType = "existing" | "new";

/** Optional seed from signup wizard (`businesses` row). */
export type GrillWizardSeed = {
  businessName: string;
  summary?: string;
  publicRepoUrl?: string;
};

export type GrillPromptExtras = {
  skillAppendix?: string;
};
