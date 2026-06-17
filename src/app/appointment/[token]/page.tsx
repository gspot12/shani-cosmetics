import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CustomerLayout from "@/components/layout/CustomerLayout";
import { getAppointmentByManageToken } from "@/server/actions/booking";
import type { AppointmentStatus } from "@/types";

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

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} דקות`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} שעה${h > 1 ? "ות" : ""}` : `${h}:${String(m).padStart(2, "0")} שע'`;
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: "מאושר", color: "text-green-700", bg: "bg-green-50" },
  PENDING_APPROVAL: { label: "ממתין לאישור", color: "text-amber-700", bg: "bg-amber-50" },
  RESCHEDULED: { label: "נדחה", color: "text-blue-700", bg: "bg-blue-50" },
  CANCELLED_BY_CLIENT: { label: "בוטל על ידי לקוח", color: "text-red-600", bg: "bg-red-50" },
  CANCELLED_BY_ADMIN: { label: "בוטל", color: "text-red-600", bg: "bg-red-50" },
  COMPLETED: { label: "הושלם", color: "text-gray-600", bg: "bg-gray-100" },
  NO_SHOW: { label: "לא הגיע", color: "text-gray-500", bg: "bg-gray-100" },
  WAITLISTED: { label: "ברשימת המתנה", color: "text-purple-700", bg: "bg-purple-50" },
};

const PAYMENT_LABELS: Record<string, string> = {
  UNPAID: "לא שולם",
  DEPOSIT_PAID: "מקדמה שולמה",
  PAID: "שולם במלואו",
  REFUNDED: "הוחזר",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AppointmentPage({ params }: PageProps) {
  const { token } = await params;
  const appointment = await getAppointmentByManageToken(token);

  if (!appointment) notFound();

  const status = appointment.status as AppointmentStatus;
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.CONFIRMED;

  const isActive = ["CONFIRMED", "PENDING_APPROVAL", "RESCHEDULED"].includes(status);
  const isCompleted = status === "COMPLETED";
  const hasReview = appointment.reviews && appointment.reviews.length > 0;

  const canReschedule = isActive &&
    appointment.startDateTime.getTime() - Date.now() > 24 * 60 * 60 * 1000;
  const canCancel = isActive &&
    appointment.startDateTime.getTime() - Date.now() > 24 * 60 * 60 * 1000;

  return (
    <CustomerLayout>
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.color} mb-4`}>
            {status === "CONFIRMED" && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {statusConfig.label}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">פרטי התור</h1>
          <p className="text-gray-500 text-sm">שלום, {appointment.customer.fullName}</p>
        </div>

        {/* Details card */}
        <div className="bg-white border border-[#E8D5C4] rounded-2xl overflow-hidden mb-4">
          <div className="bg-gradient-to-l from-[#B8973A] to-[#C8A850] px-5 py-4">
            <h2 className="text-white font-semibold">סיכום הזמנה</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Services */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">שירותים</h3>
              <div className="space-y-2">
                {appointment.appointmentServices.map((svc) => (
                  <div key={svc.id} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{svc.serviceNameSnapshot}</p>
                      <p className="text-xs text-gray-400">{formatDuration(svc.durationSnapshot)}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">₪{svc.priceSnapshot}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Info rows */}
            <div className="space-y-3">
              {[
                {
                  icon: (
                    <svg className="w-4 h-4 text-[#B8973A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                  label: "מטפלת",
                  value: appointment.staff.name,
                },
                {
                  icon: (
                    <svg className="w-4 h-4 text-[#B8973A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  label: "תאריך",
                  value: formatDate(appointment.startDateTime),
                },
                {
                  icon: (
                    <svg className="w-4 h-4 text-[#B8973A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  label: "שעה",
                  value: formatTime(appointment.startDateTime),
                },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    {row.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{row.label}</p>
                    <p className="text-sm font-medium text-gray-800">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">סה&quot;כ</span>
              <div className="text-left">
                <span className="text-lg font-bold text-[#B8973A]">₪{appointment.totalPrice}</span>
                <span className="text-xs text-gray-400 mr-2">
                  ({PAYMENT_LABELS[appointment.paymentStatus as string] ?? "לא שולם"})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {canReschedule && (
            <Link
              href={`/appointment/${token}/reschedule`}
              className="w-full flex items-center justify-center gap-2 border-2 border-[#B8973A] text-[#B8973A] font-semibold py-3.5 rounded-xl hover:bg-amber-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              שני תור
            </Link>
          )}

          {canCancel && (
            <Link
              href={`/appointment/${token}/cancel`}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-500 font-medium py-3.5 rounded-xl hover:border-red-200 hover:text-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              בטלי תור
            </Link>
          )}

          {isCompleted && !hasReview && (
            <Link
              href={`/appointment/${token}/review`}
              className="w-full flex items-center justify-center gap-2 bg-[#B8973A] text-white font-semibold py-3.5 rounded-xl hover:bg-[#9A7D2E] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              השאירי ביקורת
            </Link>
          )}

          {isCompleted && hasReview && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700 text-center">
              תודה על הביקורת שהשארת!
            </div>
          )}

          <Link
            href="/"
            className="w-full flex items-center justify-center text-gray-400 text-sm hover:text-[#B8973A] transition-colors py-2"
          >
            חזרה לדף הבית
          </Link>
        </div>

        {/* WhatsApp help */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 mb-2">צריכה עזרה? צרי קשר</p>
          <a
            href="https://wa.me/972501234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#25D366] text-sm font-medium hover:underline"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            שלחי הודעה בוואטסאפ
          </a>
        </div>
      </div>
    </CustomerLayout>
  );
}
