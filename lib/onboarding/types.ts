import { ROLES } from "./constants";

export type Role = (typeof ROLES)[number];
export type BizType = "new" | "existing";
export type KeyStatus = "idle" | "loading" | "connected" | "error";

export interface ChatMessage {
  role: "ai" | "user";
  content: string;
  thinking?: string;
  quote?: string;
}
