type StrategicIdentityInput = {
  businessName: string;
  industry?: string;
  website?: string;
  description?: string;
};

type CompetitorDiscoveryInput = {
  businessName: string;
  strategicIdentity: string;
  market?: string;
};

type ThreatFilteringInput = {
  businessName: string;
  strategicIdentity: string;
  candidateCompetitors: string[];
};

type BriefSynthesisInput = {
  businessName: string;
  strategicIdentity: string;
  competitors: string[];
  evidenceNotes: string[];
};

type AdvisorChatInput = {
  businessName: string;
  strategicBrief: string;
  userQuestion: string;
};

const jsonOnlyInstruction =
  "Return only valid JSON. Do not wrap the response in markdown fences or include commentary.";

export function buildStrategicIdentityPrompt(input: StrategicIdentityInput): string {
  return [
    "You are BusinessBuddy, a strategy analyst for small businesses.",
    "Create a concise strategic identity for the business using only the provided facts.",
    jsonOnlyInstruction,
    "JSON shape: {\"positioning\":\"string\",\"customers\":[\"string\"],\"offerings\":[\"string\"],\"keywords\":[\"string\"]}.",
    `Business name: ${input.businessName}`,
    input.industry ? `Industry: ${input.industry}` : undefined,
    input.website ? `Website: ${input.website}` : undefined,
    input.description ? `Description: ${input.description}` : undefined
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildCompetitorDiscoveryPrompt(input: CompetitorDiscoveryInput): string {
  return [
    "Find likely competitors for this business.",
    "Prefer direct, current competitors with evidence that can be verified through public web results.",
    jsonOnlyInstruction,
    "JSON shape: {\"queries\":[\"string\"],\"competitorCriteria\":[\"string\"],\"exclusions\":[\"string\"]}.",
    `Business name: ${input.businessName}`,
    input.market ? `Market: ${input.market}` : undefined,
    `Strategic identity: ${input.strategicIdentity}`
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildThreatFilteringPrompt(input: ThreatFilteringInput): string {
  return [
    "Filter candidate competitors into meaningful competitive threats.",
    "Prioritize similarity of customer, offering, geography, and buying occasion.",
    jsonOnlyInstruction,
    "JSON shape: {\"threats\":[{\"name\":\"string\",\"level\":\"low|medium|high\",\"reason\":\"string\"}],\"rejected\":[{\"name\":\"string\",\"reason\":\"string\"}]}.",
    `Business name: ${input.businessName}`,
    `Strategic identity: ${input.strategicIdentity}`,
    `Candidate competitors: ${JSON.stringify(input.candidateCompetitors)}`
  ].join("\n");
}

export function buildBriefSynthesisPrompt(input: BriefSynthesisInput): string {
  return [
    "Synthesize a short strategic brief for the business owner.",
    "Be specific, evidence-aware, and practical.",
    jsonOnlyInstruction,
    "JSON shape: {\"summary\":\"string\",\"competitorThreats\":[\"string\"],\"opportunities\":[\"string\"],\"recommendedActions\":[\"string\"]}.",
    `Business name: ${input.businessName}`,
    `Strategic identity: ${input.strategicIdentity}`,
    `Competitors: ${JSON.stringify(input.competitors)}`,
    `Evidence notes: ${JSON.stringify(input.evidenceNotes)}`
  ].join("\n");
}

export function buildAdvisorChatPrompt(input: AdvisorChatInput): string {
  return [
    "You are BusinessBuddy, a practical strategy advisor.",
    "Answer the business owner's question using the strategic brief. Say when evidence is limited.",
    `Business name: ${input.businessName}`,
    `Strategic brief: ${input.strategicBrief}`,
    `Question: ${input.userQuestion}`
  ].join("\n");
}
