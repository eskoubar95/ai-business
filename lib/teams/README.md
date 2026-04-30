# Teams

Server Actions for **`teams`** + **`team_members`**: create (auto-adds **lead** as first member), add/remove members, set lead (must already be a member), fetch team with members.

**Rules:** `lead_agent_id` references an agent in the same business; `setTeamLead` fails if the agent is not yet in `team_members`. You cannot remove the current lead as a member until you reassign lead.
