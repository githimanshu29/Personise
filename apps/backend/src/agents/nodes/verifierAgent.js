const VALID_SOURCE_TYPES = [
  "resume",
  "github_readme",
  "commit_history",
  "project_desc",
  "manual",
];

export async function verifierAgent(state) {
  const chunks = state.retrieved_chunks || [];
  if (chunks.length === 0) {
    return {
      ...state,
      verified_chunks: [],
      has_sufficient_evidence: false,
      evidence_coverage_score: 0,
      final_response:
        "I don't have clear evidence in my knowledge base to accurately answer that. I'd rather be honest than guess.",
    };
  }

  const verified = chunks.filter((chunk) => {
    if (chunk.score && chunk.score < 0.7) return false;
    if (
      chunk.metadata &&
      !VALID_SOURCE_TYPES.includes(chunk.metadata.source_type)
    )
      return false;
    return true;
  });

  const coverage = verified.length > 0 ? 0.7 : 0;
  const hasSufficientEvidence = verified.length > 0 && coverage >= 0.55;

  if (!hasSufficientEvidence) {
    return {
      ...state,
      verified_chunks: verified,
      has_sufficient_evidence: false,
      evidence_coverage_score: coverage,
      final_response:
        "I don't have clear evidence in my knowledge base to accurately answer that. I'd rather be honest than guess.",
    };
  }

  return {
    ...state,
    verified_chunks: verified,
    has_sufficient_evidence: true,
    evidence_coverage_score: coverage,
  };
}
