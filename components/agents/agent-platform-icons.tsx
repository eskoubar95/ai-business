"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Brain,
  Code2,
  Cpu,
  Eye,
  FlaskConical,
  Globe,
  Layers,
  Lightbulb,
  Palette,
  PenLine,
  Rocket,
  Search,
  Shield,
  Star,
  Target,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import type { AgentPlatformIconId } from "@/lib/agents/agent-platform-icon-ids";

export const AGENT_PLATFORM_ICONS: Readonly<
  Record<AgentPlatformIconId, LucideIcon>
> = {
  bot: Bot,
  brain: Brain,
  cpu: Cpu,
  zap: Zap,
  shield: Shield,
  target: Target,
  globe: Globe,
  eye: Eye,
  code: Code2,
  search: Search,
  layers: Layers,
  chart: BarChart3,
  pen: PenLine,
  palette: Palette,
  wrench: Wrench,
  users: Users,
  star: Star,
  bulb: Lightbulb,
  rocket: Rocket,
  flask: FlaskConical,
};
