"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import CustomerLayout from "@/components/layout/CustomerLayout";
import CalendarPicker from "@/components/booking/CalendarPicker";
import TimeSlotPicker from "@/components/booking/TimeSlotPicker";
import { getAppointmentByManageToken, getAvailableSlots, rescheduleAppointmentByToken } from "@/server/actions/booking";
import type { AvailableSlot } from "@/types";

const HE_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const HE_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function formatDate(date: Date): string {
  return `יום ${HE_DAYS[date.getDay()]}, ${date.getDate()} ${HE_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function ReschedulePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [appointment, setAppointment] = useState<Awaited<ReturnType<typeof getAppointmentByManageToken>>>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getAppointmentByManageToken(token).then((appt) => {
      if (!appt) return;
      setAppointment(appt);
    });
  }, [token]);

  useEffect(() => {
    if (!selectedDate || !appointment) return;
    const serviceIds = appointment.appointmentServices.map((s) => s.serviceId);
    setLoadingSlots(true);
    setSelectedTime(null);
    getAvailableSlots({
      serviceIds,
      staffId: appointment.staffId,
      date: toISO(selectedDate),
    })
      .then(setSlots)
      .catch(console.error)
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, appointment]);

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    const slot = slots.find((s) => s.time === time);
    setSelectedStaffId(slot?.staffId ?? null);
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedTime || !selectedStaffId) return;
    setSubmitting(true);
    setError(null);
    try {
      const newStartDateTime = toISO(selectedDate) + "T" + selectedTime + ":00";
      await rescheduleAppointmentByToken({
        token,
        newStartDateTime,
        staffId: selectedStaffId,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה. נסי שוב.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">התור שונה בהצלחה!</h1>
          <p className="text-gray-500 text-sm mb-8">
            {selectedDate && selectedTime && (
              <>
                התור עודכן ל-{formatDate(selectedDate)} בשעה {selectedTime}
              </>
            )}
          </p>
          <Link
            href={`/appointment/${token}`}
            className="inline-flex items-center gap-2 bg-[#B8973A] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#9A7D2E] transition-colors"
          >
            חזרה לפרטי התור
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Back */}
        <Link
          href={`/appointment/${token}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#B8973A] mb-6 transition-colors"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          חזרה
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">שינוי תור</h1>
        <p className="text-gray-500 text-sm mb-6">בחרי תאריך ושעה חדשים</p>

        {/* Current appointment */}
        {appointment && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-sm">
            <p className="font-medium text-[#8A6E22] mb-1">התור הנוכחי:</p>
            <p className="text-amber-700">
              {formatDate(appointment.startDateTime)} בשעה {formatTime(appointment.startDateTime)}
              {" — "}{appointment.staff.name}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <CalendarPicker
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            closedDays={[6]}
            minDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // at least tomorrow
          />

          {selectedDate && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                בחרי שעה ל-{formatDate(selectedDate)}
              </h2>
              {loadingSlots ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <TimeSlotPicker
                  slots={slots.map((s) => ({ time: s.time, available: true }))}
                  selectedTime={selectedTime}
                  onSelect={handleTimeSelect}
                />
              )}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime || submitting}
            className="w-full bg-[#B8973A] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3.5 rounded-xl transition-colors hover:bg-[#9A7D2E] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>מעדכנת...</span></>
            ) : (
              "אשרי שינוי תור"
            )}
          </button>
        </div>
      </div>
    </CustomerLayout>
  );
}
