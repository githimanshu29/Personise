import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    booking_id: { type: String, required: true, unique: true },
    session_id: { type: String, required: true, index: true },
    channel: { type: String, enum: ["chat", "voice"] },
    requester_info: {
      name: { type: String },
      email: { type: String },
      availability_text: { type: String },
    },
    slots_proposed: [{ type: String }],
    slot_confirmed: { type: String },
    cal_booking: {
      booking_id: { type: String },
      booking_url: { type: String },
      meet_url: { type: String },
      confirmed_at: { type: Date },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "failed"],
      default: "pending",
    },
    failure_reason: { type: String },
  },
  { timestamps: true },
);

export const Booking = mongoose.model("Booking", BookingSchema);
