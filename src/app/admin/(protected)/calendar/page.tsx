"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { listAppointments, listStaff } from "@/server/actions/admin";
import type { AppointmentWithDetails } from "@/server/actions/admin";
import type { StaffWithServices } from "@/types";

type ViewMode = "day" | "week" | "month";

const DAYS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const DAYS_FULL_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00–21:00

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthDates(baseDate: Date): Date[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start from Sunday of the first week
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  // End on Saturday of the last week
  const endDate = new Date(lastDay);
  const remaining = 6 - lastDay.getDay();
  endDate.setDate(lastDay.getDate() + remaining);

  const dates: Date[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function aptTop(date: Date): number {
  const hours = new Date(date).getHours() - 8;
  const mins = new Date(date).getMinutes();
  return (hours * 60 + mins) * (56 / 60); // 56px per hour
}

function aptHeight(startDate: Date, endDate: Date): number {
  const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  const mins = diffMs / 60000;
  return Math.max(28, mins * (56 / 60));
}

const STATUS_COLOR_BG: Record<string, string> = {
  PENDING_APPROVAL: "bg-yellow-100 border-yellow-400 text-yellow-800",
  CONFIRMED: "bg-green-100 border-green-400 text-green-800",
  RESCHEDULED: "bg-blue-100 border-blue-400 text-blue-800",
  CANCELLED_BY_CLIENT: "bg-red-100 border-red-400 text-red-700",
  CANCELLED_BY_ADMIN: "bg-red-100 border-red-400 text-red-700",
  COMPLETED: "bg-gray-100 border-gray-400 text-gray-600",
  NO_SHOW: "bg-orange-100 border-orange-400 text-orange-700",
};

interface QuickViewModal {
  appointment: AppointmentWithDetails;
  x: number;
  y: number;
}

export default function CalendarPage() {
  const today = new Date();

  const [view, setView] = useState<ViewMode>("week");
  const [baseDate, setBaseDate] = useState<Date>(today);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [staffList, setStaffList] = useState<StaffWithServices[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState<QuickViewModal | null>(null);

  const weekDates = getWeekDates(baseDate);
  const monthDates = getMonthDates(baseDate);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [staff, aptsData] = await Promise.all([
        listStaff(),
        // For week/day view fetch the range
        listAppointments({ page: 1 }),
      ]);
      setStaffList(staff);
      if (selectedStaff.size === 0) {
        setSelectedStaff(new Set(staff.map((s) => s.id)));
      }
      setAppointments(aptsData.appointments);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseDate, view]);

  useEffect(() => {
    load();
  }, [load]);

  function navigate(dir: -1 | 1) {
    const next = new Date(baseDate);
    if (view === "day") next.setDate(next.getDate() + dir);
    else if (view === "week") next.setDate(next.getDate() + 7 * dir);
    else next.setMonth(next.getMonth() + dir);
    setBaseDate(next);
  }

  function getTitle() {
    if (view === "day") {
      return baseDate.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    if (view === "week") {
      const start = weekDates[0];
      const end = weekDates[6];
      return `${start.toLocaleDateString("he-IL", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return baseDate.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  }

  const visibleApts = appointments.filter((a) =>
    selectedStaff.has(a.staffId) &&
    a.status !== "CANCELLED_BY_CLIENT" &&
    a.status !== "CANCELLED_BY_ADMIN"
  );

  const dayApts = (date: Date) =>
    visibleApts.filter((a) => isSameDay(new Date(a.startDateTime), date));

  const toggleStaff = (id: string) => {
    setSelectedStaff((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem-2rem)] gap-4" dir="rtl">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col w-48 shrink-0 gap-4">
        {/* Mini calendar / today */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <button
            onClick={() => { setBaseDate(today); }}
            className="w-full py-2 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] transition-colors mb-3"
          >
            היום
          </button>
          <p className="text-xs font-semibold text-gray-500 mb-2">מטפלות</p>
          <div className="space-y-1.5">
            {staffList.map((s) => (
              <label key={s.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedStaff.has(s.id)}
                  onChange={() => toggleStaff(s.id)}
                  className="sr-only"
                />
                <div
                  className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center transition-colors shrink-0`}
                  style={{
                    backgroundColor: selectedStaff.has(s.id) ? s.color : "transparent",
                    borderColor: s.color,
                  }}
                >
                  {selectedStaff.has(s.id) && (
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors">
                  {s.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h2 className="text-sm font-semibold text-gray-800 min-w-0">{getTitle()}</h2>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  view === v ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {v === "day" ? "יום" : v === "week" ? "שבוע" : "חודש"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#B8973A] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {/* WEEK VIEW */}
            {view === "week" && (
              <div className="min-w-[600px]">
                {/* Day headers */}
                <div className="grid grid-cols-8 border-b border-gray-100 sticky top-0 bg-white z-10">
                  <div className="w-12" />
                  {weekDates.map((d, i) => (
                    <div
                      key={i}
                      className={`text-center py-2 border-r border-gray-50 last:border-r-0 ${
                        isSameDay(d, today) ? "bg-[#B8973A]/5" : ""
                      }`}
                    >
                      <p className="text-xs text-gray-400">{DAYS_HE[d.getDay()]}</p>
                      <p
                        className={`text-sm font-semibold mt-0.5 ${
                          isSameDay(d, today) ? "text-[#B8973A]" : "text-gray-700"
                        }`}
                      >
                        {d.getDate()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Time grid */}
                <div className="relative">
                  {HOURS.map((h) => (
                    <div key={h} className="grid grid-cols-8 border-b border-gray-50" style={{ height: 56 }}>
                      <div className="flex items-start justify-center pt-1 w-12 shrink-0">
                        <span className="text-xs text-gray-300">{h}:00</span>
                      </div>
                      {weekDates.map((d, di) => (
                        <div
                          key={di}
                          className={`relative border-r border-gray-50 last:border-r-0 ${
                            isSameDay(d, today) ? "bg-[#B8973A]/3" : ""
                          }`}
                        />
                      ))}
                    </div>
                  ))}

                  {/* Appointment overlays */}
                  <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                    <div className="w-12 shrink-0" />
                    {weekDates.map((d, di) => (
                      <div key={di} className="relative">
                        {dayApts(d).map((apt) => {
                          const top = aptTop(new Date(apt.startDateTime));
                          const height = aptHeight(new Date(apt.startDateTime), new Date(apt.endDateTime));
                          const cls = STATUS_COLOR_BG[apt.status] ?? "bg-gray-100 border-gray-400 text-gray-700";
                          return (
                            <Link
                              key={apt.id}
                              href={`/admin/appointments/${apt.id}`}
                              className={`absolute inset-x-0.5 rounded border-r-2 overflow-hidden px-1 py-0.5 pointer-events-auto cursor-pointer hover:brightness-95 transition-all ${cls}`}
                              style={{ top, height: Math.max(height, 20) }}
                            >
                              <p className="text-[10px] font-semibold truncate leading-tight">
                                {apt.customer.fullName}
                              </p>
                              {height > 32 && (
                                <p className="text-[9px] truncate leading-tight opacity-70">
                                  {apt.appointmentServices[0]?.serviceNameSnapshot}
                                </p>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DAY VIEW */}
            {view === "day" && (
              <div className="min-w-[300px]">
                <div className="border-b border-gray-100 py-3 text-center sticky top-0 bg-white z-10">
                  <p className="text-sm font-semibold text-gray-700">
                    {DAYS_FULL_HE[baseDate.getDay()]}, {baseDate.toLocaleDateString("he-IL", { day: "numeric", month: "long" })}
                  </p>
                </div>
                <div className="relative">
                  {HOURS.map((h) => (
                    <div key={h} className="flex border-b border-gray-50" style={{ height: 56 }}>
                      <div className="w-12 shrink-0 flex items-start justify-center pt-1">
                        <span className="text-xs text-gray-300">{h}:00</span>
                      </div>
                      <div className="flex-1 relative border-r border-gray-50" />
                    </div>
                  ))}
                  <div className="absolute inset-0 flex">
                    <div className="w-12 shrink-0" />
                    <div className="flex-1 relative">
                      {dayApts(baseDate).map((apt) => {
                        const top = aptTop(new Date(apt.startDateTime));
                        const height = aptHeight(new Date(apt.startDateTime), new Date(apt.endDateTime));
                        const cls = STATUS_COLOR_BG[apt.status] ?? "bg-gray-100 border-gray-400 text-gray-700";
                        return (
                          <Link
                            key={apt.id}
                            href={`/admin/appointments/${apt.id}`}
                            className={`absolute left-1 right-1 rounded border-r-2 overflow-hidden px-2 py-1 cursor-pointer hover:brightness-95 transition-all ${cls}`}
                            style={{ top, height: Math.max(height, 24) }}
                          >
                            <p className="text-xs font-semibold truncate">
                              {apt.customer.fullName} · {apt.staff.name}
                            </p>
                            {height > 36 && (
                              <p className="text-[11px] opacity-70 truncate">
                                {apt.appointmentServices.map((s) => s.serviceNameSnapshot).join(", ")}
                              </p>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MONTH VIEW */}
            {view === "month" && (
              <div>
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-gray-100">
                  {DAYS_HE.map((d) => (
                    <div key={d} className="text-center py-2 text-xs font-semibold text-gray-400">
                      {d}
                    </div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {monthDates.map((d, i) => {
                    const isCurrentMonth = d.getMonth() === baseDate.getMonth();
                    const isToday = isSameDay(d, today);
                    const apts = dayApts(d).slice(0, 3);
                    return (
                      <div
                        key={i}
                        className={`min-h-[80px] border-b border-r border-gray-50 p-1.5 ${
                          !isCurrentMonth ? "bg-gray-50/50" : ""
                        } ${i % 7 === 6 ? "border-r-0" : ""}`}
                      >
                        <p
                          className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full mb-1 ${
                            isToday
                              ? "bg-[#B8973A] text-white"
                              : isCurrentMonth
                              ? "text-gray-700"
                              : "text-gray-300"
                          }`}
                        >
                          {d.getDate()}
                        </p>
                        <div className="space-y-0.5">
                          {apts.map((apt) => {
                            const cls = STATUS_COLOR_BG[apt.status] ?? "bg-gray-100 text-gray-600";
                            return (
                              <Link
                                key={apt.id}
                                href={`/admin/appointments/${apt.id}`}
                                className={`block truncate text-[10px] px-1 py-0.5 rounded font-medium ${cls}`}
                              >
                                {new Date(apt.startDateTime).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}{" "}
                                {apt.customer.fullName}
                              </Link>
                            );
                          })}
                          {dayApts(d).length > 3 && (
                            <p className="text-[10px] text-gray-400 px-1">
                              +{dayApts(d).length - 3} נוספים
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick view modal */}
      {quickView && (
        <div className="fixed inset-0 z-50" onClick={() => setQuickView(null)}>
          <div
            className="absolute bg-white rounded-xl shadow-2xl border border-gray-100 p-4 w-72"
            style={{ top: quickView.y, left: quickView.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-800">{quickView.appointment.customer.fullName}</h3>
              <button onClick={() => setQuickView(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-1.5 text-sm">
              <p className="text-gray-600">{quickView.appointment.staff.name}</p>
              <p className="text-gray-500 text-xs">
                {quickView.appointment.appointmentServices.map((s) => s.serviceNameSnapshot).join(", ")}
              </p>
            </div>
            <Link
              href={`/admin/appointments/${quickView.appointment.id}`}
              className="block mt-3 text-center text-xs text-[#B8973A] hover:underline"
            >
              פתח תור
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
