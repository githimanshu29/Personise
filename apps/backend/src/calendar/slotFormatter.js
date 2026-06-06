export function formatSlotsForUser(slots, isVoice) {
  if (!slots || slots.length === 0) return "No available slots.";
  if (isVoice) return slots.map((s, i) => `Option ${i + 1}: ${s}`).join(". ");
  return slots.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

export function matchSlotFromMessage(message, slots) {
  if (!message || !slots || slots.length === 0) return null;
  const lower = message.toLowerCase();
  const indexMatch = lower.match(/\b(1|2|3)\b/);
  if (indexMatch) {
    const idx = parseInt(indexMatch[1], 10) - 1;
    return slots[idx] || null;
  }
  const direct = slots.find((s) => lower.includes(s.toLowerCase()));
  return direct || null;
}

export function extractEmail(text) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : null;
}
