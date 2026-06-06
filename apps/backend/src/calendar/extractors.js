export function extractName(text) {
  const match = text.match(/name is ([a-zA-Z\s]+)/i);
  return match ? match[1].trim() : null;
}

export function extractAvailability(text) {
  const match = text.match(
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday).*?(morning|afternoon|evening|\d{1,2}(am|pm))/i,
  );
  return match ? match[0] : null;
}
