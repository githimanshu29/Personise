export async function responseNode(state) {
  if (state.final_response) return state;
  if (state.draft_response)
    return { ...state, final_response: state.draft_response };
  return {
    ...state,
    final_response: "I don't have enough evidence to answer that yet.",
  };
}
