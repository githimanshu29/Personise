import { CalComClient } from "../../calendar/calComClient.js";
import {
  formatSlotsForUser,
  matchSlotFromMessage,
  extractEmail,
} from "../../calendar/slotFormatter.js";
import { extractName, extractAvailability } from "../../calendar/extractors.js";
import { Booking } from "../../db/models/Booking.js";

const calClient = new CalComClient();

export async function calendarAgent(state) {
  const bookingState = state.booking_state || { status: "none" };

  try {
    if (
      bookingState.status === "none" ||
      bookingState.status === "collecting"
    ) {
      const availability = extractAvailability(state.user_message || "");
      if (!availability) {
        return {
          ...state,
          booking_state: { ...bookingState, status: "collecting" },
          final_response: "Great, what days and times work for you?",
        };
      }

      const slots = await calClient.getAvailableSlots(7);
      const proposed = slots.slice(0, 3);
      return {
        ...state,
        proposed_slots: proposed,
        booking_state: {
          ...bookingState,
          status: "proposing",
          proposed_slots: proposed,
        },
        final_response: `Here are some available times:\n${formatSlotsForUser(proposed, state.is_voice)}\nWhich one works?`,
      };
    }

    if (bookingState.status === "proposing") {
      const selected = matchSlotFromMessage(
        state.user_message || "",
        bookingState.proposed_slots || [],
      );
      if (!selected) {
        return {
          ...state,
          final_response: `Which option works for you?\n${formatSlotsForUser(bookingState.proposed_slots, state.is_voice)}`,
        };
      }

      return {
        ...state,
        booking_state: {
          ...bookingState,
          status: "confirming",
          confirmed_slot: selected,
        },
        final_response:
          "Please share your name and email to confirm the booking.",
      };
    }

    if (bookingState.status === "confirming") {
      const email = extractEmail(state.user_message || "");
      const name = extractName(state.user_message || "") || "Guest";
      if (!email) {
        return {
          ...state,
          final_response: "I need a valid email to send the invite.",
        };
      }

      const booking = await calClient.createBooking({
        slot: bookingState.confirmed_slot,
        name,
        email,
        notes: `Booked via Himanshu AI Persona | Session ${state.session_id}`,
      });

      await Booking.create({
        booking_id: booking.id,
        session_id: state.session_id,
        channel: state.channel,
        requester_info: { name, email },
        slot_confirmed: bookingState.confirmed_slot,
        cal_booking: { booking_id: booking.id, booking_url: booking.url },
        status: "confirmed",
      });

      return {
        ...state,
        booking_result: booking,
        booking_state: {
          ...bookingState,
          status: "booked",
          booking_url: booking.url,
          cal_booking_id: booking.id,
        },
        final_response: `All set, ${name}. I booked ${bookingState.confirmed_slot}. You'll receive an invite at ${email}.`,
      };
    }

    return { ...state, final_response: "What times work for you?" };
  } catch (err) {
    return {
      ...state,
      error_type: "calendar",
      booking_state: {
        ...bookingState,
        status: "failed",
        failure_reason: err.message,
      },
      final_response:
        "I'm having trouble accessing the calendar right now. Please try again shortly.",
    };
  }
}
