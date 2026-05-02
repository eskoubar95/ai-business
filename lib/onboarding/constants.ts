export const ROLES = ["Founder", "Developer", "Product", "Other"] as const;

export const TOTAL_STEPS = 8;

export const LOADING_MESSAGES = [
  "Initializing your workspace...",
  "Reading your business context...",
  "Preparing your AI assistant...",
] as const;

export const AI_RESPONSES = [
  {
    thinking:
      "The user is describing their core problem space. I should probe further on technical stack and AI agent usage to build a complete profile.",
    content:
      "Interesting! Tell me more about your technical stack and how you plan to use AI agents in your workflow.",
  },
  {
    thinking:
      "Good context on the tech approach. Now I should confirm whether they have enough runway and what their 12-month target looks like.",
    content:
      "That's a solid foundation. I have enough context to build your Business Soul. Ready to see your profile?",
  },
  {
    thinking:
      "Enough exchanges to compile the soul profile. I'll wrap up and prompt them to review.",
    content:
      "Perfect — I've captured everything I need. Click 'Done' to review and edit your Business Soul profile.",
  },
] as const;
