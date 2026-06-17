"use client";

import React, { useState, useMemo } from "react";

type DayStatus = "available" | "full" | "closed" | "past" | "selected";

interface CalendarPickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  /** ISO date strings (YYYY-MM-DD) that are fully booked */
  fullDates?: string[];
  /** ISO date strings (YYYY-MM-DD) that are closed */
  closedDates?: string[];
  /** Days of week that are always closed: 0=Sunday ... 6=Saturday */
  closedDays?: number[];
  /** Don't allow selecting dates before this (defaults to today) */
  minDate?: Date;
  /** Don't allow selecting dates after this */
  maxDate?: Date;
}

const HE_DAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const HE_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isSameDay(a: Date, b: Date): boolean {
  return toISO(a) === toISO(b);
}

export default function CalendarPicker({
  selectedDate,
  onDateSelect,
  fullDates = [],
  closedDates = [],
  closedDays = [6], // Saturday closed by default
  minDate,
  maxDate,
}: CalendarPickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const effectiveMin = minDate ?? today;

  const [viewYear, setViewYear] = useState(
    selectedDate?.getFullYear() ?? today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate?.getMonth() ?? today.getMonth()
  );

  // Build calendar grid (Sunday-first, matching Hebrew day order א=Sun)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sunday
    const days: (Date | null)[] = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    // Pad to complete last row
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewYear, viewMonth]);

  const fullSet = useMemo(() => new Set(fullDates), [fullDates]);
  const closedSet = useMemo(() => new Set(closedDates), [closedDates]);
  const closedDaySet = useMemo(() => new Set(closedDays), [closedDays]);

  function getDayStatus(date: Date): DayStatus {
    if (selectedDate && isSameDay(date, selectedDate)) return "selected";
    const iso = toISO(date);
    date.setHours(0, 0, 0, 0);
    if (date < effectiveMin) return "past";
    if (maxDate && date > maxDate) return "past";
    if (closedDaySet.has(date.getDay()) || closedSet.has(iso)) return "closed";
    if (fullSet.has(iso)) return "full";
    return "available";
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  // Disable prev if we're at the min month
  const canGoPrev =
    viewYear > effectiveMin.getFullYear() ||
    (viewYear === effectiveMin.getFullYear() && viewMonth > effectiveMin.getMonth());

  function handleDayClick(date: Date, status: DayStatus) {
    if (status === "past" || status === "closed" || status === "full") return;
    onDateSelect(new Date(date));
  }

  const dayStyles: Record<DayStatus, string> = {
    available:
      "bg-white hover:bg-amber-50 hover:border-[#B8973A]/50 text-gray-800 cursor-pointer border border-transparent hover:shadow-sm transition-all",
    full: "bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent",
    closed:
      "bg-gray-50 text-gray-300 cursor-not-allowed border border-transparent line-through",
    past: "bg-transparent text-gray-300 cursor-not-allowed border border-transparent",
    selected:
      "bg-[#B8973A] text-white font-semibold cursor-pointer border border-[#B8973A] shadow-md",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden select-none">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        {/* Next (appears on left in RTL = future) */}
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="חודש הבא"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Month + Year */}
        <div className="text-center">
          <h2 className="text-base font-semibold text-gray-800">
            {HE_MONTHS[viewMonth]} {viewYear}
          </h2>
        </div>

        {/* Prev (appears on right in RTL = past) */}
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className={`p-2 rounded-lg transition-colors ${
            canGoPrev
              ? "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              : "text-gray-200 cursor-not-allowed"
          }`}
          aria-label="חודש קודם"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="px-3 sm:px-4 py-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {HE_DAYS.map((day, i) => (
            <div
              key={i}
              className={`text-center text-xs font-semibold py-1 ${
                i === 6 ? "text-gray-300" : "text-gray-400"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            const status = getDayStatus(date);
            const isToday = isSameDay(date, today);

            return (
              <button
                key={toISO(date)}
                type="button"
                onClick={() => handleDayClick(date, status)}
                disabled={status === "past" || status === "closed" || status === "full"}
                className={`aspect-square rounded-xl text-sm flex flex-col items-center justify-center relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8973A] focus-visible:ring-offset-1 ${dayStyles[status]}`}
                aria-label={`${date.getDate()} ${HE_MONTHS[viewMonth]} - ${
                  status === "available"
                    ? "זמין"
                    : status === "full"
                    ? "מלא"
                    : status === "closed"
                    ? "סגור"
                    : status === "past"
                    ? "עבר"
                    : "נבחר"
                }`}
                aria-pressed={status === "selected"}
              >
                <span>{date.getDate()}</span>
                {/* Today dot */}
                {isToday && status !== "selected" && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#B8973A]" />
                )}
                {/* Full indicator */}
                {status === "full" && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gray-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 justify-end">
          {[
            { color: "bg-white border border-gray-200", label: "זמין" },
            { color: "bg-[#B8973A]", label: "נבחר" },
            { color: "bg-gray-100", label: "מלא" },
            { color: "bg-gray-50 line-through-demo", label: "סגור", strikethrough: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className={`w-4 h-4 rounded-md ${item.color} ${
                  item.strikethrough ? "opacity-50" : ""
                }`}
              />
              <span className="text-[10px] text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
