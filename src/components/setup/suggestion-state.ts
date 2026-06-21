export type SuggestionDecision = "accepted" | "rejected" | "pending";

export type SuggestionDecisionState = {
  accepted: Set<string>;
  rejected: Set<string>;
};

export function suggestionDecisionFor(state: SuggestionDecisionState, id: string): SuggestionDecision {
  if (state.accepted.has(id)) {
    return "accepted";
  }

  if (state.rejected.has(id)) {
    return "rejected";
  }

  return "pending";
}

export function applySuggestionDecision(
  state: SuggestionDecisionState,
  id: string,
  decision: Exclude<SuggestionDecision, "pending">
): SuggestionDecisionState {
  const accepted = new Set(state.accepted);
  const rejected = new Set(state.rejected);

  if (decision === "accepted") {
    accepted.add(id);
    rejected.delete(id);
  } else {
    rejected.add(id);
    accepted.delete(id);
  }

  return { accepted, rejected };
}
