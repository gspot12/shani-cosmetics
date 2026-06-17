"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateAppointmentStatus,
  updateAppointmentPayment,
} from "@/server/actions/admin";
import type { AppointmentWithDetails } from "@/server/actions/admin";
import type { AppointmentStatus, PaymentStatus } from "@/types";

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "PENDING_APPROVAL", label: "ממתין לאישור" },
  { value: "CONFIRMED", label: "מאושר" },
  { value: "RESCHEDULED", label: "נדחה" },
  { value: "CANCELLED_BY_ADMIN", label: "בוטל ע״י מנהל" },
  { value: "CANCELLED_BY_CLIENT", label: "בוטל ע״י לקוחה" },
  { value: "COMPLETED", label: "הושלם" },
  { value: "NO_SHOW", label: "לא הגיעה" },
];

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "UNPAID", label: "לא שולם" },
  { value: "DEPOSIT_PAID", label: "מקדמה שולמה" },
  { value: "PAID", label: "שולם במלואו" },
  { value: "REFUNDED", label: "הוחזר" },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  RESCHEDULED: "bg-blue-100 text-blue-700",
  CANCELLED_BY_CLIENT: "bg-red-100 text-red-600",
  CANCELLED_BY_ADMIN: "bg-red-100 text-red-600",
  COMPLETED: "bg-gray-100 text-gray-600",
  NO_SHOW: "bg-orange-100 text-orange-600",
  WAITLISTED: "bg-purple-100 text-purple-600",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [newStatus, setNewStatus] = useState<AppointmentStatus>("CONFIRMED");
  const [newPayment, setNewPayment] = useState<PaymentStatus>("UNPAID");

  // router is used for potential future navigation; suppress unused warning
  void router;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setAppointment(data);
      setInternalNotes(data.internalNotes ?? "");
      setNewStatus(data.status);
      setNewPayment(data.paymentStatus);
    } catch {
      showToast("שגיאה בטעינת התור", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusUpdate() {
    if (!appointment) return;
    setSaving(true);
    try {
      await updateAppointmentStatus({
        appointmentId: id,
        status: newStatus,
        sendNotification,
        internalNotes: internalNotes || undefined,
      });
      showToast("סטטוס עודכן בהצלחה");
      await load();
    } catch {
      showToast("שגיאה בעדכון הסטטוס", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePaymentUpdate() {
    if (!appointment) return;
    setSaving(true);
    try {
      await updateAppointmentPayment({
        appointmentId: id,
        paymentStatus: newPayment,
      });
      showToast("סטטוס תשלום עודכן בהצלחה");
      await load();
    } catch {
      showToast("שגיאה בעדכון התשלום", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickAction(status: AppointmentStatus) {
    setSaving(true);
    try {
      await updateAppointmentStatus({
        appointmentId: id,
        status,
        sendNotification,
      });
      showToast("סטטוס עודכן בהצלחה");
      await load();
    } catch {
      showToast("שגיאה בעדכון הסטטוס", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-32 flex items-center justify-center">
        <svg className="w-8 h-8 text-[#B8973A] animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="py-32 text-center">
        <p className="text-gray-400 mb-4">התור לא נמצא</p>
        <Link href="/admin/appointments" className="text-[#B8973A] hover:underline text-sm">
          חזרה לרשימת התורים
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_OPTIONS.find((s) => s.value === appointment.status);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/appointments"
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-2 transition-colors"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            תורים
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {appointment.customer.fullName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDate(appointment.startDateTime)} · {formatTime(appointment.startDateTime)} –{" "}
            {formatTime(appointment.endDateTime)}
          </p>
        </div>
        <span
          className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium shrink-0 ${
            STATUS_COLOR[appointment.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {statusInfo?.label ?? appointment.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Services */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">שירותים</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {appointment.appointmentServices.map((s) => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.serviceNameSnapshot}</p>
                    <p className="text-xs text-gray-400">{s.durationSnapshot} דקות</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    ₪{s.priceSnapshot.toLocaleString("he-IL")}
                  </p>
                </div>
              ))}
              <div className="px-5 py-3 flex items-center justify-between bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">סה״כ</p>
                <p className="text-base font-bold text-gray-800">
                  ₪{appointment.totalPrice.toLocaleString("he-IL")}
                </p>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">ניהול סטטוס</h2>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">סטטוס חדש</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AppointmentStatus)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={saving || newStatus === appointment.status}
                className="px-4 py-2 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] disabled:opacity-40 transition-colors shrink-0"
              >
                עדכן
              </button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="w-4 h-4 rounded accent-[#B8973A]"
              />
              <span className="text-sm text-gray-600">שלח הודעה ללקוחה</span>
            </label>

            {/* Quick Actions */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 mb-3">פעולות מהירות</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickAction("CONFIRMED")}
                  disabled={saving || appointment.status === "CONFIRMED"}
                  className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-40 transition-colors"
                >
                  אישור תור
                </button>
                <button
                  onClick={() => handleQuickAction("COMPLETED")}
                  disabled={saving || appointment.status === "COMPLETED"}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  סמן הושלם
                </button>
                <button
                  onClick={() => handleQuickAction("NO_SHOW")}
                  disabled={saving || appointment.status === "NO_SHOW"}
                  className="px-3 py-1.5 text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 disabled:opacity-40 transition-colors"
                >
                  לא הגיעה
                </button>
                <button
                  onClick={() => handleQuickAction("CANCELLED_BY_ADMIN")}
                  disabled={saving || appointment.status === "CANCELLED_BY_ADMIN"}
                  className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-40 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>

          {/* Payment Management */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">ניהול תשלום</h2>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">סטטוס תשלום</label>
                <select
                  value={newPayment}
                  onChange={(e) => setNewPayment(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
                >
                  {PAYMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handlePaymentUpdate}
                disabled={saving || newPayment === appointment.paymentStatus}
                className="px-4 py-2 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] disabled:opacity-40 transition-colors shrink-0"
              >
                עדכן
              </button>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">הערות פנימיות</h2>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={4}
              placeholder="הוספת הערה פנימית (לא גלויה ללקוחה)"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 resize-none focus:outline-none focus:border-[#B8973A] placeholder-gray-400"
            />
            <button
              onClick={handleStatusUpdate}
              disabled={saving}
              className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              שמור הערות
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">פרטי לקוחה</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#B8973A]/15 flex items-center justify-center text-[#B8973A] font-bold text-sm shrink-0">
                  {appointment.customer.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{appointment.customer.fullName}</p>
                  {appointment.customer.isBlocked && (
                    <span className="text-xs text-red-500">חסומה</span>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${appointment.customer.phone}`} className="hover:text-[#B8973A]">
                    {appointment.customer.phone}
                  </a>
                </div>
                {appointment.customer.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{appointment.customer.email}</span>
                  </div>
                )}
              </div>
              {appointment.customer.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">הערות לקוחה</p>
                  <p className="text-sm text-gray-700">{appointment.customer.notes}</p>
                </div>
              )}
              <Link
                href={`/admin/customers`}
                className="block text-center text-xs text-[#B8973A] hover:underline mt-2"
              >
                צפייה בכרטיס לקוחה
              </Link>
            </div>
          </div>

          {/* Staff Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">מטפלת</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: appointment.staff.color }}
                >
                  {appointment.staff.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{appointment.staff.name}</p>
                  {appointment.staff.phone && (
                    <p className="text-xs text-gray-400">{appointment.staff.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Client Notes */}
          {appointment.clientNotes && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-3">הערות לקוחה לתור</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{appointment.clientNotes}</p>
            </div>
          )}

          {/* Appointment Meta */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">פרטי תור</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">משך</span>
                <span className="text-gray-700 font-medium">{appointment.totalDurationMinutes} דקות</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">נוצר</span>
                <span className="text-gray-700 font-medium">
                  {new Date(appointment.createdAt).toLocaleDateString("he-IL")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">מזהה</span>
                <span className="text-gray-400 text-xs font-mono">{appointment.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
