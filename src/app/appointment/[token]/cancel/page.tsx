"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CustomerLayout from "@/components/layout/CustomerLayout";
import { getAppointmentByManageToken, cancelAppointmentByToken } from "@/server/actions/booking";

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

type AppointmentData = Awaited<ReturnType<typeof getAppointmentByManageToken>>;

export default function CancelPage() {
  const params = useParams();
  const token = params.token as string;

  const [appointment, setAppointment] = useState<AppointmentData>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getAppointmentByManageToken(token)
      .then(setAppointment)
      .finally(() => setFetchLoading(false));
  }, [token]);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      await cancelAppointmentByToken({ token, reason: reason.trim() || undefined });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בביטול התור. נסי שוב.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">התור בוטל</h1>
          <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
            ביטול התור אושר. שלחנו לך הודעה עם אישור הביטול.
            נשמח לראות אותך בפעם הבאה!
          </p>
          <div className="space-y-3">
            <Link
              href="/book"
              className="w-full flex items-center justify-center gap-2 bg-[#B8973A] text-white font-semibold py-3.5 rounded-xl hover:bg-[#9A7D2E] transition-colors"
            >
              קביעת תור חדש
            </Link>
            <Link
              href="/"
              className="w-full flex items-center justify-center text-gray-400 text-sm hover:text-[#B8973A] transition-colors py-2"
            >
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-md mx-auto px-4 py-10">
        {/* Back */}
        <Link
          href={`/appointment/${token}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#B8973A] mb-6 transition-colors"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          חזרה לפרטי התור
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">ביטול תור</h1>
        <p className="text-gray-500 text-sm mb-6">אנחנו מצטערות לראות אותך עוזבת</p>

        {fetchLoading ? (
          <div className="h-24 bg-gray-100 rounded-2xl animate-pulse mb-6" />
        ) : appointment ? (
          <div className="bg-white border border-[#E8D5C4] rounded-2xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">פרטי התור לביטול</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#B8973A] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700 font-medium">{formatDate(appointment.startDateTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#B8973A] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">{formatTime(appointment.startDateTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#B8973A] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-gray-700">{appointment.staff.name}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Warning */}
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6 text-sm text-red-700">
          <p className="font-medium mb-1">שימי לב - מדיניות ביטול:</p>
          <p className="text-red-600/80">
            ניתן לבטל תור עד 24 שעות לפני מועד הטיפול. ביטול מאוחר יותר עשוי להיות כרוך בחיוב.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            סיבת הביטול <span className="text-gray-400 text-xs">(אופציונלי)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="ספרי לנו מה השתנה..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none transition-all"
          />
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCancel}
            disabled={loading || !appointment}
            className="w-full bg-red-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3.5 rounded-xl transition-colors hover:bg-red-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>מבטלת...</span></>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                אשרי ביטול תור
              </>
            )}
          </button>

          <Link
            href={`/appointment/${token}/reschedule`}
            className="w-full flex items-center justify-center gap-2 border-2 border-[#B8973A] text-[#B8973A] font-semibold py-3.5 rounded-xl hover:bg-amber-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            שני תור במקום לבטל
          </Link>

          <Link
            href={`/appointment/${token}`}
            className="w-full flex items-center justify-center text-gray-400 text-sm hover:text-gray-600 transition-colors py-2"
          >
            בדעה אחרת? חזרי לפרטי התור
          </Link>
        </div>
      </div>
    </CustomerLayout>
  );
}
