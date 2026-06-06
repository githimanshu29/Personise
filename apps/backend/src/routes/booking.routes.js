import express from "express";
import { CalComClient } from "../calendar/calComClient.js";
import { Booking } from "../db/models/Booking.js";

const router = express.Router();
const calClient = new CalComClient();

router.post("/slots", async (req, res) => {
  const days = req.body?.days_ahead || 7;
  const slots = await calClient.getAvailableSlots(days);
  res.json({ slots });
});

router.post("/confirm", async (req, res) => {
  const { session_id, slot, name, email } = req.body || {};
  if (!slot || !email || !session_id) {
    return res.status(400).json({ error: "INVALID_INPUT" });
  }
  const booking = await calClient.createBooking({
    slot,
    name: name || "Guest",
    email,
    notes: `Booked via API | Session ${session_id}`,
  });
  await Booking.create({
    booking_id: booking.id,
    session_id,
    channel: "chat",
    requester_info: { name: name || "Guest", email },
    slot_confirmed: slot,
    cal_booking: { booking_id: booking.id, booking_url: booking.url },
    status: "confirmed",
  });
  res.json({ booking_id: booking.id, url: booking.url, status: "confirmed" });
});

router.get("/:booking_id", async (req, res) => {
  const booking = await Booking.findOne({ booking_id: req.params.booking_id });
  if (!booking) return res.status(404).json({ error: "NOT_FOUND" });
  res.json({ status: booking.status, details: booking });
});

export default router;
