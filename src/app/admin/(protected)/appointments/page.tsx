"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { listAppointments, listStaff } from "@/server/actions/admin";
import type { AppointmentWithDetails } from "@/server/actions/admin";
import type { StaffWithServices } from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "כל הסטטוסים" },
  { value: "PENDING_APPROVAL", label: "ממתין לאישור" },
  { value: "CONFIRMED", label: "מאושר" },
  { value: "RESCHEDULED", label: "נדחה" },
  { value: "CANCELLED_BY_CLIENT", label: "בוטל ע״י לקוחה" },
  { value: "CANCELLED_BY_ADMIN", label: "בוטל ע״י מנהל" },
  { value: "COMPLETED", label: "הושלם" },
  { value: "NO_SHOW", label: "לא הגיעה" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING_APPROVAL: { label: "ממתין לאישור", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  CONFIRMED: { label: "מאושר", className: "bg-green-100 text-green-700 border-green-200" },
  RESCHEDULED: { label: "נדחה", className: "bg-blue-100 text-blue-700 border-blue-200" },
  CANCELLED_BY_CLIENT: { label: "בוטל ע״י לקוחה", className: "bg-red-100 text-red-600 border-red-200" },
  CANCELLED_BY_ADMIN: { label: "בוטל ע״י מנהל", className: "bg-red-100 text-red-600 border-red-200" },
  COMPLETED: { label: "הושלם", className: "bg-gray-100 text-gray-600 border-gray-200" },
  NO_SHOW: { label: "לא הגיעה", className: "bg-orange-100 text-orange-600 border-orange-200" },
  WAITLISTED: { label: "רשימת המתנה", className: "bg-purple-100 text-purple-600 border-purple-200" },
};

const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
  UNPAID: { label: "לא שולם", className: "bg-gray-100 text-gray-500" },
  DEPOSIT_PAID: { label: "מקדמה", className: "bg-blue-100 text-blue-600" },
  PAID: { label: "שולם", className: "bg-green-100 text-green-700" },
  REFUNDED: { label: "הוחזר", className: "bg-purple-100 text-purple-600" },
};

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_BADGE[status] ?? { label: status, className: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${info.className}`}>
      {info.label}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const info = PAYMENT_BADGE[status] ?? { label: status, className: "bg-gray-100 text-gray-500" };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${info.className}`}>
      {info.label}
    </span>
  );
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("he-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentsPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [dateFilter, setDateFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [staffList, setStaffList] = useState<StaffWithServices[]>([]);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, staff] = await Promise.all([
        listAppointments({
          date: dateFilter || undefined,
          staffId: staffFilter || undefined,
          status: statusFilter || undefined,
          page,
        }),
        staffList.length === 0 ? listStaff() : Promise.resolve(staffList),
      ]);
      setAppointments(data.appointments);
      setTotal(data.total);
      if (staffList.length === 0) setStaffList(staff);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, staffFilter, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">תורים</h1>
          <p className="text-sm text-gray-500 mt-0.5">ניהול כל התורים</p>
        </div>
        <Link
          href="/admin/appointments/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          תור חדש
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">תאריך</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); handleFilterChange(); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">מטפלת</label>
            <select
              value={staffFilter}
              onChange={(e) => { setStaffFilter(e.target.value); handleFilterChange(); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
            >
              <option value="">כל המטפלות</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">סטטוס</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange(); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        {(dateFilter || staffFilter || statusFilter) && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => { setDateFilter(""); setStaffFilter(""); setStatusFilter(""); setPage(1); }}
              className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              נקי פילטרים
            </button>
            <span className="text-xs text-gray-400">{total} תוצאות</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <svg className="w-6 h-6 text-[#B8973A] animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400">לא נמצאו תורים</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">לקוחה</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">שירות</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">מטפלת</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">תאריך ושעה</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">סטטוס</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">תשלום</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">מחיר</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{apt.customer.fullName}</p>
                          <p className="text-xs text-gray-400">{apt.customer.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 max-w-[160px] truncate">
                          {apt.appointmentServices.map((s) => s.serviceNameSnapshot).join(", ")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: apt.staff.color }} />
                          <span className="text-sm text-gray-700">{apt.staff.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{formatDateTime(apt.startDateTime)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={apt.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PaymentBadge status={apt.paymentStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-700">
                          ₪{apt.totalPrice.toLocaleString("he-IL")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/appointments/${apt.id}`}
                          className="text-xs text-[#B8973A] hover:underline font-medium"
                        >
                          צפייה
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {appointments.map((apt) => (
                <Link
                  key={apt.id}
                  href={`/admin/appointments/${apt.id}`}
                  className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-1 h-full min-h-[40px] rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: apt.staff.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{apt.customer.fullName}</p>
                      <StatusBadge status={apt.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(apt.startDateTime)} · {apt.staff.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {apt.appointmentServices.map((s) => s.serviceNameSnapshot).join(", ")}
                    </p>
                    <p className="text-xs font-medium text-gray-600 mt-1">
                      ₪{apt.totalPrice.toLocaleString("he-IL")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              עמוד {page} מתוך {totalPages} · {total} תורים
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                הקודם
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                הבא
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
