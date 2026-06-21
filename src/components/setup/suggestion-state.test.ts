import { describe, expect, it } from "vitest";

import { applySuggestionDecision, suggestionDecisionFor } from "./suggestion-state";

describe("suggestion decision state", () => {
  it("keeps untouched suggestions neutral instead of rendering them as rejected", () => {
    const state = { accepted: new Set<string>(), rejected: new Set<string>() };

    expect(suggestionDecisionFor(state, "suggestion-a")).toBe("pending");
  });

  it("changes only the clicked suggestion when rejecting a row", () => {
    const state = {
      accepted: new Set(["suggestion-a", "suggestion-b"]),
      rejected: new Set<string>()
    };

    const next = applySuggestionDecision(state, "suggestion-a", "rejected");

    expect(suggestionDecisionFor(next, "suggestion-a")).toBe("rejected");
    expect(suggestionDecisionFor(next, "suggestion-b")).toBe("accepted");
  });
});
