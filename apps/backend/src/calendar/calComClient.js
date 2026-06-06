const BASE_URL = "https://api.cal.com/v1";

export class CalComClient {
  constructor() {
    this.apiKey = process.env.CALCOM_API_KEY;
    this.username = process.env.CALCOM_USERNAME;
    this.eventTypeId = process.env.CALCOM_EVENT_TYPE_ID;
  }

  async getAvailableSlots(days = 7) {
    const startTime = new Date().toISOString();
    const endTime = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000,
    ).toISOString();
    const res = await fetch(
      `${BASE_URL}/availability?username=${this.username}&eventTypeId=${this.eventTypeId}&dateFrom=${startTime}&dateTo=${endTime}`,
      { headers: { Authorization: `Bearer ${this.apiKey}` } },
    );
    if (!res.ok) throw new Error(`Cal.com API error ${res.status}`);
    const data = await res.json();
    return data.slots || [];
  }

  async createBooking({ slot, name, email, notes }) {
    const res = await fetch(`${BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        eventTypeId: parseInt(this.eventTypeId, 10),
        start: slot,
        responses: { name, email, notes },
        timeZone: "Asia/Kolkata",
        language: "en",
      }),
    });
    if (!res.ok) throw new Error(`Cal.com booking failed ${res.status}`);
    return res.json();
  }
}
