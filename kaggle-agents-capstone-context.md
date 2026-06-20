# Kaggle 5-Day AI Agents Capstone Context

This file is a handoff brief for a fresh chat. It captures the working context from the Google/Kaggle codelabs we reviewed, the competition track options shared in this workspace, and a ready-to-paste prompt for deeper ideation with browsing and stronger source collection.

## Purpose

Use this document when starting a new high-temperature ideation chat so the new assistant can:

- understand what the Google/Kaggle course appears to teach,
- understand the available capstone track options,
- reason strategically about what kind of project can actually stand out,
- browse for up-to-date rules, examples, and source-backed differentiation,
- and help select a winning project direction before implementation.

## Important Framing

- We are not trying to blindly mimic the course stack just for appearance.
- We do want to align with the spirit of the course: agentic workflows, ADK-style thinking, tool use, safety, evaluation, and deployment.
- We may implement with Codex rather than Antigravity, unless the official capstone rules explicitly require Antigravity.
- The next chat should verify all rules and assumptions against current official sources before recommending a final project.

## Official Course Material Reviewed

These are the codelabs reviewed so far:

1. [Getting Started with Google Antigravity](https://codelabs.developers.google.com/getting-started-google-antigravity)
2. [Deploy from AI Studio to Cloud Run](https://codelabs.developers.google.com/deploy-from-aistudio-to-run?hl=en)
3. [Hands-on with Antigravity CLI](https://codelabs.developers.google.com/antigravity-cli-hands-on)
4. [Google Developer Knowledge MCP server in Google Antigravity 2.0, IDE, and/or CLI](https://codelabs.developers.google.com/developer-knowledge-mcp-antigravity)
5. [Authoring Google Antigravity Skills](https://codelabs.developers.google.com/getting-started-with-antigravity-skills?hl=en)
6. [Vibe Coding AI Agents: Managing the Agent Lifecycle with Agents CLI and ADK 2.0](https://codelabs.developers.google.com/agents-cli-adk-lifecycle)
7. [Vibecode an ADK 2.0 Ambient Agent with Antigravity and Agents CLI](https://codelabs.developers.google.com/vibecode-ambient-expense-agent)
8. [Vibecode and Secure an AI Agent Lifecycle with Antigravity and TDD](https://codelabs.developers.google.com/secure-agentic-coding)
9. [Deploy an ADK agent to Agent Runtime using Agents CLI](https://codelabs.developers.google.com/enterprise-cloud-scale-deploying-the-expense-agent-to-agent-runtime-on-google-cloud)
10. [Vibecode and Deploy a Frontend for an ADK agent](https://codelabs.developers.google.com/vibecode-frontend-with-antigravity)

## What The Course Seems To Teach

This is a practical summary of the recurring concepts across the codelabs.

### 1. Antigravity as the agentic development surface

The Antigravity intro codelab describes Antigravity as a project-centric agentic development platform and "central command center" for agents. It emphasizes:

- project-scoped context,
- per-project permissions and tools,
- conversations and threads,
- isolated settings,
- and agent orchestration across local workspaces.

Practical takeaway:
The course teaches that agent building is not just prompting. It is workflow setup, context control, permissions, and iteration discipline.

### 2. Vibe coding as a real build loop, not just chat

The AI Studio to Cloud Run codelab focuses on using vibe coding to quickly build, test, and deploy a simple web app. The point is not sophistication; the point is speed from prototype to hosted artifact.

Practical takeaway:
The course values fast prototyping plus visible deployment, not just local demos.

### 3. CLI-first agentic development is a first-class path

The Antigravity CLI codelab says the CLI brings the same core agentic capabilities to the terminal: multi-step reasoning, multi-file editing, tool calling, and conversation history.

Practical takeaway:
The workflow is not tied to one GUI. Agentic coding can live in a terminal-driven loop.

### 4. MCP expands agent capabilities through external systems

The Developer Knowledge MCP codelab teaches enabling an API, wiring it into Antigravity, and approving tool use. This makes MCP feel like the standard way to plug agents into structured external capability.

Practical takeaway:
The course expects participants to think in terms of tools, connectors, knowledge services, and explicit approvals rather than stuffing everything into prompts.

### 5. Skills are modular workflow intelligence

The Antigravity Skills codelab explains skills as lightweight, on-demand capability packages that prevent context saturation and tool bloat. Skills can contain:

- instructions,
- references,
- scripts,
- templates,
- and scoped behavior for specific tasks.

Practical takeaway:
The course strongly favors modularity. Specialized behavior should be attached only when relevant instead of permanently loaded into context.

### 6. ADK 2.0 and agents-cli form the code-first agent stack

The ADK lifecycle codelab focuses on:

- installing `agents-cli`,
- scaffolding new agent projects,
- understanding graph workflow structure,
- linting and cleanup,
- and running a local playground with auto-reload.

Practical takeaway:
The deeper build story is ADK 2.0 plus `agents-cli`, not just chat-based code generation.

### 7. Strong agent examples use deterministic routing plus LLM reasoning

The ambient expense agent codelab is especially important. It builds an event-driven ambient agent where:

- low-value expenses are auto-approved with deterministic code,
- higher-value expenses go through pre-LLM screening,
- Gemini evaluates compliance risk,
- and human review handles higher-risk paths.

Practical takeaway:
The course does not present "send everything to the LLM" as best practice. Better agent systems mix:

- deterministic logic,
- safety filters,
- human-in-the-loop pauses,
- event triggers,
- and evaluation.

### 8. Security is supposed to be shifted left

The secure agentic coding codelab emphasizes:

- project-level coding standards,
- persistent context files,
- STRIDE threat modeling,
- TDD guardrails,
- security tests,
- and Semgrep pre-commit scanning.

Practical takeaway:
Security is treated as part of the development lifecycle, not a post-hoc polish step.

### 9. Deployment is part of the capstone story

The Agent Runtime deployment codelab covers:

- preparing the local project for cloud hosting,
- generating deployment descriptors,
- performing dry-runs,
- deploying to Agent Runtime,
- and monitoring with Cloud Trace.

Practical takeaway:
Production-readiness, observability, and deployment architecture matter in the overall narrative.

### 10. Frontend matters because the workflow must be demonstrable

The frontend codelab adds a dashboard for the ambient expense agent and shows an event-driven flow where:

- events arrive,
- low-risk items complete automatically,
- high-risk items pause,
- and a human dashboard resumes execution.

Practical takeaway:
The final project should likely have a polished interface or at least a very legible demo surface, not just a backend script.

## Inferred "5 Day" Learning Arc

This section is an inference from the codelab topics, not a confirmed official day-by-day agenda.

### Day 1: Agentic surfaces and rapid prototyping

- Antigravity basics
- AI Studio vibe coding
- quick prototype to Cloud Run

### Day 2: Terminal workflows and tool connectivity

- Antigravity CLI
- MCP integration

### Day 3: Modular capability and code-first agents

- Skills
- `agents-cli`
- ADK 2.0 graph workflows

### Day 4: Real ambient agent patterns

- event-driven agents
- deterministic routing
- human-in-the-loop
- evaluation

### Day 5: Secure and deployable agent systems

- secure agentic coding
- deployment to Agent Runtime
- frontend/dashboard integration

## High-Level Mental Model From The Course

If we had to compress the course into one sentence:

> Build agents as structured systems, not just prompts: give them scoped context, modular skills, external tools via MCP, deterministic control paths, security guardrails, human review where needed, evaluation loops, and a deployable interface.

## Capstone Track Options Shared In This Workspace

The following track descriptions were provided in the current conversation and should be treated as the working brief until the next chat verifies the latest official competition page.

### Agents for Good

In the Agents for Good track, submissions should help solve problems for humanity. Examples mentioned include:

- optimizing agriculture,
- managing public health,
- advancing education,
- supporting art and literature.

Working interpretation:
This is the social-impact track. Judges are likely to reward meaningful human outcomes, clarity of purpose, and responsible design.

### Agents for Business

This track focuses on enterprise-style agents that solve business problems with cost or revenue on the line. Examples mentioned include:

- expense submissions,
- pipeline actions,
- insights generation,
- creating new products.

Working interpretation:
This is the ROI track. Strong entries likely show workflow automation, measurable economic value, and operational clarity.

### Concierge Agents

This track focuses on personal agents that simplify real life while keeping personal information safe and secure. Examples mentioned include:

- managing an invite list for a party,
- planning a garden,
- helping manage complicated medications.

Working interpretation:
This is the personal life orchestration track. Strong entries likely combine usefulness, trust, privacy, and delight.

### Freestyle

This is the catch-all track for strong ideas that do not fit neatly elsewhere. Examples mentioned include:

- tracking concert recordings,
- decoding cursive from historians,
- tracking recently launched satellites.

Working interpretation:
This is the originality track. The upside is flexibility; the downside is weaker comparison standards unless the project is especially memorable.

## Strategic Notes From The Current Discussion

These are not final conclusions. They are working observations from our conversation so far.

### On using Codex instead of Antigravity

- There was no explicit course material found so far stating that Antigravity usage is mandatory for a valid capstone.
- The codelabs heavily recommend Antigravity and frame the examples around it.
- If the official rules do not require Antigravity, the safer interpretation is that judges care more about the artifact, demo, and alignment with agentic best practices than the exact editor used.
- The next chat should verify whether the capstone submission form requires tool disclosure or screenshots that would make the build workflow matter.

### On what tends to feel weak

Ideas that risk feeling generic:

- simple reminder bots,
- plain chatbot wrappers around common domains,
- shallow assistants without workflow ownership,
- projects with no safety, traceability, or differentiated operational loop.

### On what tends to feel stronger

Projects that are more likely to stand out:

- solve a painful real-world workflow rather than answer questions,
- combine deterministic logic with LLM reasoning,
- have an obvious human-in-the-loop or escalation story,
- show evidence of safety and trust design,
- are deployable and demoable,
- and have a crisp wedge rather than "does everything."

### On track choice

At the time of writing, `Agents for Good` felt like the most promising choice if the goal is to maximize capstone win potential through story, impact, and memorability rather than pure SaaS viability.

That said, we did not yet lock a final problem because several early ideas felt insufficiently differentiated.

## What The Next Chat Should Do

The next chat should not jump straight into coding.

It should first:

1. verify the latest official capstone rules and whether Antigravity use is required or merely recommended,
2. verify the exact track descriptions and judging criteria,
3. identify what kinds of projects are already common in healthcare, education, agriculture, civic access, and other impact domains,
4. find underserved wedges where a capstone can still feel fresh,
5. propose a shortlist of high-upside ideas for `Agents for Good`,
6. compare them on originality, emotional clarity, technical buildability, demo quality, and judging fit,
7. recommend the top one or two ideas with a practical MVP path.

## Ready-To-Paste Prompt For A New Chat

Copy the prompt below into a fresh chat and let that assistant browse broadly, cite sources, and challenge assumptions.

```md
I want you to help me choose a winning capstone idea for Kaggle's 5-Day AI Agents course with Google.

Important instructions:

- Use web browsing aggressively and prefer official sources where possible.
- Verify current official competition/capstone rules, track descriptions, judging criteria, and any submission requirements.
- Explicitly check whether using Google Antigravity is mandatory, recommended, or irrelevant to judging. I may build with Codex instead.
- Use concrete citations and links for any factual claims that could have changed.
- Be creative and opinionated. High-temperature ideation is welcome, but grounded in sources and practical execution reality.
- Do not jump into coding yet. First help me choose the right track and project wedge.

Here is the context I already gathered from the Google codelabs:

1. Antigravity is taught as the central agentic development surface with project-scoped context, permissions, and conversations.
2. AI Studio to Cloud Run emphasizes rapid vibe-coded prototyping and deployment.
3. Antigravity CLI shows the same agentic workflow in a terminal.
4. MCP is presented as the way to connect external knowledge/tools.
5. Skills are modular, on-demand capability packs that avoid context saturation and tool bloat.
6. ADK 2.0 + agents-cli are the code-first stack for graph-based agent workflows.
7. The ambient expense agent codelab teaches deterministic routing, pre-LLM screening, LLM reasoning, human-in-the-loop approval, event triggers, and evaluation.
8. The secure agentic coding codelab teaches security context, STRIDE threat modeling, tests, Semgrep hooks, and shift-left security.
9. The deployment codelabs emphasize Agent Runtime, Cloud Run, Cloud Trace, and production-readiness.
10. The frontend codelab emphasizes having a visible dashboard/interface for human review and demoability.

Working mental model:
The course seems to reward structured agent systems, not just prompts: scoped context, modular skills, tool use, deterministic control paths, safety, evaluation, human review, and deployability.

These are the track options I have from the brief:

- Agents for Good: submissions that help solve problems for humanity, such as agriculture, public health, education, art, or literature.
- Agents for Business: enterprise-focused agents for business problems where cost or revenue is on the line.
- Concierge Agents: personal agents that simplify life while handling personal data safely and securely.
- Freestyle: strong ideas that do not fit a neat category.

My current goal:
I want the highest chance to win, not just the easiest project and not just the best future SaaS idea.

My current constraints and assets:

- I can code and ship with help.
- I have a domain name.
- I can host on Vercel, Render, Supabase, or Firebase.
- I prefer to avoid paid APIs if possible.
- I want something that feels genuinely differentiated, not a generic chatbot.

What I want from you:

1. Verify the latest official rules and summarize what matters most.
2. Tell me which track gives the best odds of winning and why.
3. For that track, propose 10 strong capstone concepts.
4. For each concept, score:
   - originality,
   - emotional impact,
   - technical feasibility in a short build cycle,
   - demo strength,
   - alignment with the course's agentic best practices,
   - and likely judge appeal.
5. Identify which ideas are too crowded or already overdone.
6. Recommend the top 3 ideas overall.
7. For the best idea, define a sharp wedge and moat so it does not feel generic.
8. Outline a believable MVP that could be built on Vercel + Supabase/Firebase + free or low-cost AI/tooling.
9. Explain what features would make the project feel truly agentic rather than just chat-based.
10. Be brutally honest about risks, novelty, and what would actually make judges care.

I especially want you to watch for this failure mode:
"nice idea, but no moat, too broad, too generic, or clearly already done by big incumbents."

End by giving me:

- the best track,
- the single best project idea,
- the project one-liner,
- the core wedge,
- the MVP scope,
- and why this has a real chance to win.
```

## Suggested Follow-Up After The New Chat

Once the new chat helps pick a project, the next step should be a design/spec phase with:

- target user,
- sharp wedge,
- core workflow,
- agent architecture,
- tool and data requirements,
- safety guardrails,
- evaluation strategy,
- and deployment plan.

Only after that should implementation begin.
