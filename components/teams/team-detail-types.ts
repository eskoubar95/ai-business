export type TeamDetailAgent = {
  id: string;
  name: string;
  role: string;
};

export type TeamDetailMember = {
  id: string;
  agentId: string;
  sortOrder: number;
  agent: TeamDetailAgent | null;
};

export type TeamDetailTeam = {
  id: string;
  name: string;
  businessId: string;
  leadAgentId: string;
  leadAgent: TeamDetailAgent | null;
  members: TeamDetailMember[];
};

/** Props for the team detail Settings tab (server actions wired by parent). */
export type TeamSettingsSectionProps = {
  team: TeamDetailTeam;
  businessAgents: TeamDetailAgent[];
  onSaved: () => void;
  onDeleted: () => void;
};
