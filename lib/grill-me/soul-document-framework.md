# Soul Document Framework
### The Business Intelligence Layer for AI Agents

> **What this is:** A structured knowledge document that gives AI agents the same
> contextual understanding a senior team member has after months on the job.
> It is not a report for humans — it is a decision-making substrate for agents.
>
> **New vs. Existing:** Each section is marked with the applicable context.
> Sections marked `[NEW]` are primarily hypothesis-driven. Sections marked `[EXISTING]`
> contain validated, observed knowledge. Sections marked `[BOTH]`
> apply to all businesses but differ in confidence level.
>
> **Confidence system:** Every field carries one of three confidence levels:
> - `✦ VALIDATED` — confirmed through real data, customers, or shipped code
> - `◈ HYPOTHESIS` — directionally sound but not yet proven in the market
> - `○ UNKNOWN` — acknowledged gap; agents should not assume

---

## 0. Document Metadata `[BOTH]`

```
Business Name     :
Business Type     : [ ] New venture  [ ] Existing product  [ ] Internal tool
Document Version  :
Last Updated      :
Soul Document ID  :
GitHub Repository :
Primary Language  :
```

---

## 1. Identity `[BOTH]`

*Why this matters: Agents make hundreds of micro-decisions daily. Without a
clear identity, they optimize for the wrong thing. This section is the
north star every agent checks when in doubt.*

### 1.1 Vision
**What the world looks like when we've won — the long-term outcome we're
building toward. Not what the product does, but what changes in the world.**

```
Statement    :
Confidence   : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS
```

### 1.2 Mission
**What we do every day to move toward that vision. Specific enough to
say no to things that don't fit.**

```
Statement    :
Confidence   : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS
```

### 1.3 Values
**The non-negotiable principles that govern how we work and make decisions.
These should feel like constraints, not aspirations.**

| # | Value | What it means in practice |
|---|-------|---------------------------|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |

### 1.4 What We Are Not
**Explicit boundaries. As important as what we are. Agents should check
this list before building or suggesting anything.**

- We are not:
- We are not:
- We are not:
- We will never:

---

## 2. Problem & Market `[BOTH]`

*Why this matters: Agents building features need to understand the root
problem — not the surface symptom. Without this, solutions are technically
correct but commercially irrelevant.*

### 2.1 The Core Problem
**The specific, painful problem we solve. State it as the customer would
say it — not as a product person would.**

```
Problem statement (customer's words)  :
Root cause of the problem             :
How customers solve it today          :
Why existing solutions fall short     :
Confidence                           : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

### 2.2 Problem Severity
**How painful is this, really? Agents use this to judge feature priority.**

```
Frequency      : How often does the customer hit this problem?
Intensity      : What is the cost (time, money, frustration) of the problem?
Urgency        : Do customers actively seek a solution today?
Confidence     : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

### 2.3 Market Context `[EXISTING: focus on current dynamics]`
```
Market size       :
Market stage      : [ ] Emerging  [ ] Growing  [ ] Mature  [ ] Declining
Key trends        :
Tailwinds for us  :
Headwinds for us  :
Confidence        : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

### 2.4 Competition
**Who else solves this? What do customers use today?**

| Competitor / Alternative | What they do well | Where they fall short | Why we win |
|--------------------------|-------------------|----------------------|------------|
| | | | |
| | | | |
| | | | |

```
Our unfair advantage    :
Defensibility over time :
Confidence              : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

---

## 3. Customer `[BOTH]`

*Why this matters: The most common failure mode in product development is
building for a vague persona instead of a real person. Agents make better
decisions when they can ask "would our customer care about this?"*

### 3.1 Primary Customer `[NEW: hypothesis | EXISTING: validated profile]`

```
Who they are (specific, not a segment) :
Their job / role                       :
Company size / context                 :
Day-to-day reality                     :
What they care most about              :
What keeps them up at night            :
How they measure their own success     :
What they've tried before (and why it failed) :
Confidence                             : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS
```

### 3.2 Customer Journey
**How does a customer go from problem-aware to successful user?**

```
1. Trigger      : What event makes them start looking for a solution?
2. Discovery    : How do they find us?
3. Evaluation   : What questions do they ask before committing?
4. Activation   : What is the moment they first get real value?
5. Habit        : What makes them come back?
6. Expansion    : What makes them pay more or tell others?
Confidence      : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

### 3.3 Who We Are NOT Building For `[BOTH]`
**Explicitly excluded customer types. Prevents scope creep and misaligned features.**

- Not building for:
- Not building for:
- Edge cases we intentionally ignore:

---

## 4. Product `[BOTH]`

*Why this matters: Agents need to understand what the product IS (current
or planned state) to make consistent decisions about architecture, UI, and
features.*

### 4.1 Product Overview

```
One-line description  :
Core use case         :
Key user actions      : (what does a user actually DO in the product?)
Current stage         : [ ] Idea  [ ] Prototype  [ ] MVP  [ ] Product-market fit  [ ] Scaling
Confidence            : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS
```

### 4.2 Core Features `[NEW: planned | EXISTING: shipped]`

| Feature | What it does | Why it matters | Status |
|---------|--------------|----------------|--------|
| | | | |
| | | | |
| | | | |

### 4.3 Product Principles
**The design and product decisions that are non-negotiable. Agents use
these to evaluate whether a proposed feature or design belongs.**

| Principle | What it means | Example of honoring it | Example of violating it |
|-----------|---------------|------------------------|-------------------------|
| | | | |
| | | | |
| | | | |

### 4.4 Roadmap Horizon `[BOTH]`

```
Now (0–3 months)    : What are we actively building?
Next (3–6 months)   : What is directionally committed?
Later (6–18 months) : What are we thinking about but not committed to?
Never (explicit)    : What are we choosing NOT to build?
Confidence          : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS
```

### 4.5 Success Metrics
**How do we know the product is working? Agents use this to assess whether
a change is an improvement.**

```
Primary metric        : (the one number that proves value)
Supporting metrics    :
Health metrics        : (things that shouldn't break)
Anti-metrics          : (things we explicitly don't optimize for)
Current baseline      : [EXISTING only]
Confidence            : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

---

## 5. Business Model `[BOTH]`

*Why this matters: The business model constrains everything. A freemium
product has different priorities than enterprise SaaS. Agents need to
understand the economic logic to make commercially sound decisions.*

### 5.1 Revenue Model

```
How we charge          : [ ] Subscription  [ ] Usage  [ ] One-time  [ ] Marketplace  [ ] Other
Pricing tiers          :
Average contract value :
Free tier / trial?     :
Confidence             : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

### 5.2 Unit Economics `[EXISTING: measured | NEW: projected]`

```
CAC (cost to acquire a customer)  :
LTV (lifetime value)              :
Payback period                    :
Gross margin                      :
Confidence                        : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

### 5.3 Growth Model
**Where does growth actually come from?**

```
Primary growth driver   : [ ] Sales  [ ] Marketing  [ ] Product-led  [ ] Word of mouth  [ ] Partnerships
Secondary driver        :
Viral / referral loop   :
Confidence              : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

---

## 6. Go-to-Market `[BOTH]`

*Why this matters: GTM strategy shapes what we build, in what order, and
for whom. Agents need this to prioritize correctly and avoid building
features that don't serve the current distribution strategy.*

### 6.1 Current GTM Motion

```
Primary channel      :
Secondary channel    :
Sales model          : [ ] Self-serve  [ ] Sales-assisted  [ ] Enterprise / white-glove
Target ICP           : (Ideal Customer Profile — the one we close fastest)
Confidence           : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

### 6.2 Traction `[EXISTING only]`

```
Current customers / users   :
MRR / ARR                   :
Month-over-month growth     :
Best-performing channel     :
Worst-performing channel    :
Key learnings from GTM      :
Confidence                  : ✦ VALIDATED (observed)
```

### 6.3 Partnerships & Ecosystem `[BOTH]`

```
Strategic partners        :
Integration ecosystem     :
Community / network       :
Confidence                : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

---

## 7. Engineering & Technology `[BOTH]`

*Why this matters: Agents writing code must understand the full technical
context — not just the stack, but the principles, constraints, and
architectural intent. Bad assumptions here cause compounding technical debt.*

### 7.1 Tech Stack

```
Frontend          :
Backend           :
Database          :
Infrastructure    :
CI/CD             :
Key libraries     :
GitHub repo       :
Confidence        : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS
```

### 7.2 Architecture Principles
**The engineering decisions that are non-negotiable. Agents must honor
these in all code they write or review.**

| Principle | Why we follow it | Example |
|-----------|-----------------|---------|
| | | |
| | | |
| | | |

### 7.3 Technical Constraints & Boundaries

```
Hard constraints      : (must never violate — security, compliance, etc.)
Soft constraints      : (prefer to avoid, can be overridden with reason)
Scaling targets       : (what load must the system handle?)
Performance budgets   : (latency, uptime, response times)
Compliance / legal    :
Confidence            : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

### 7.4 Technical Debt & Known Issues `[EXISTING only]`

```
Critical debt (must fix soon)   :
Accepted debt (conscious choice):
Areas to avoid touching         :
Upcoming migrations / rewrites  :
Confidence                      : ✦ VALIDATED (observed)
```

### 7.5 Development Principles

```
Branching strategy    :
Code review process   :
Test coverage policy  :
Deployment cadence    :
On-call / incident    :
Definition of "done"  :
Confidence            : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS
```

---

## 8. Team & Organization `[BOTH]`

*Why this matters: Agents coordinating across a team need to know who
owns what, who to loop in on which decisions, and how the team operates.
This section prevents agents from making decisions that belong to humans.*

### 8.1 Team Structure

| Name | Role | Owns | Decision authority |
|------|------|------|---------------------|
| | | | |
| | | | |
| | | | |

### 8.2 Decision Framework
**Who decides what? Agents must never make calls above their authority.**

```
Product direction          : (who owns the roadmap?)
Technical architecture     : (who has final say on arch decisions?)
Design / UX               : (who owns the design system?)
Hiring                    : (who approves headcount?)
Spend / budget            : (who can approve costs?)
Agent autonomy boundary   : (what can agents decide alone vs. escalate?)
```

### 8.3 Communication & Process

```
Standups / rituals        :
Issue tracker             :
Documentation home        :
Async vs. sync norms      :
Escalation path           :
```

### 8.4 Hiring Plan `[BOTH]`

```
Current team size         :
Open roles                :
Next key hire             :
Skills gaps               :
Confidence                : [ ] ✦ VALIDATED  [ ] ◈ HYPOTHESIS  [ ] ○ UNKNOWN
```

---

## 9. History & Learnings `[EXISTING only]`

*Why this matters: Teams that don't know their history repeat it. Agents
that don't know what was tried before will suggest things that already failed.
This is one of the most underrated sections in any knowledge base.*

### 9.1 Key Decisions Made

| Decision | What we chose | What we rejected | Why | Date |
|----------|--------------|-----------------|-----|------|
| | | | | |
| | | | | |

### 9.2 What We Tried That Didn't Work

| Experiment / Feature | Hypothesis | What actually happened | Learning |
|---------------------|-----------|----------------------|----------|
| | | | |
| | | | |

### 9.3 Pivots & Direction Changes

```
Original direction   :
What changed         :
Why it changed       :
What we kept         :
What we discarded    :
```

### 9.4 Incidents & Outages `[EXISTING only]`

```
Significant incidents (and root causes)  :
Systems / areas that have broken before  :
Mitigations put in place                 :
```

---

## 10. Agent Directives `[BOTH]`

*This is the most important section for the platform. It translates
everything above into behavioral rules for AI agents. Agents check
this section before acting in any ambiguous situation.*

### 10.1 Core Behavioral Rules

```
When in doubt, always prioritize       :
Never compromise on                    :
Default communication tone             : [ ] Formal  [ ] Conversational  [ ] Technical  [ ] Other:
Default code style / conventions       :
Default language for output            :
```

### 10.2 Escalate to Human When

*Agents must stop and wait for human approval in these situations:*

- [ ] Changes affecting more than X files
- [ ] Decisions involving money or contracts
- [ ] Security or compliance-related changes
- [ ] Breaking changes to public API or DB schema
- [ ] Anything touching: (list areas)
- [ ] Confidence in outcome is below: (threshold)
- Additional escalation triggers:

### 10.3 Agent Permissions by Domain

| Domain | Can act autonomously | Needs approval | Forbidden |
|--------|---------------------|----------------|-----------|
| UI / Frontend | | | |
| Backend / API | | | |
| Database schema | | | |
| Infrastructure | | | |
| External comms | | | |
| Billing / payments | | | |
| User data | | | |

### 10.4 Quality Bar

```
Minimum test coverage expected        :
Performance baseline to maintain      :
Accessibility requirements            :
Error handling expectations           :
Logging / observability requirements  :
```

### 10.5 Tone & Brand Voice

```
Writing style       :
Things we say       :
Things we never say :
Examples of on-brand output :
Examples of off-brand output:
```

### 10.6 Context Refresh Rules
**When should an agent re-read this document vs. proceed from memory?**

```
Always re-read before     :
Trust cached context for  :
Flag for human if Soul Document is older than : (days)
```

---

## Appendix: Grill-Me Question Map

> **For platform use only.** This maps each Soul Document section to
> the Grill-Me questions that populate it. Used by the reasoning step
> to determine which questions to skip (already answered) and which
> to prioritize (highest-impact gaps).

| Section | Critical question | Skip if | Priority |
|---------|------------------|---------|----------|
| 1.1 Vision | "What does the world look like when you've won?" | Provided in description | High |
| 1.2 Mission | "What do you do every day to get there?" | Provided in description | High |
| 1.4 What We Are Not | "What are you explicitly NOT?" | — | High |
| 2.1 Problem | "What is the exact problem, in your customer's words?" | GitHub README covers it | Critical |
| 2.2 Severity | "What happens to your customer if they don't solve this?" | — | High |
| 3.1 Customer | "Describe the one person you're building this for right now" | — | Critical |
| 3.2 Journey | "What triggers them to start looking for a solution?" | — | Medium |
| 4.1 Overview | "What does a user actually do in your product?" | GitHub README covers it | High |
| 4.3 Principles | "What is a product decision you'd never make, and why?" | — | High |
| 4.5 Metrics | "How do you know if the product is working?" | — | High |
| 5.1 Revenue | "How do you charge, and why that model?" | — | High |
| 6.1 GTM | "How does your first customer find you?" | — | High |
| 7.2 Arch Principles | "What is an engineering decision you'd never reverse?" | GitHub repo analyzed | Medium |
| 7.3 Constraints | "What are the hard lines your system must never cross?" | — | High |
| 9.1 Decisions `[EXISTING]` | "What's the most important architectural decision you've already made?" | — | High |
| 9.2 Failures `[EXISTING]` | "What's something you tried that didn't work, and what did you learn?" | — | High |
| 10.2 Escalation | "When should an agent stop and ask a human?" | — | Critical |
| 10.3 Permissions | "What should an agent never touch without your approval?" | — | Critical |

---

*Soul Document v1.0 — Conduro Platform*
*Framework authored for the Grill-Me onboarding system*
