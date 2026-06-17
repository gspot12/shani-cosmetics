"use client";

import React from "react";

interface SelectedService {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  category?: string;
}

interface BookingSummaryProps {
  services: SelectedService[];
  staffName: string | null;
  date: Date | null;
  time: string | null;
  depositRequired?: boolean;
  depositAmount?: number;
  /** If true, render as compact summary (e.g. sidebar) */
  compact?: boolean;
  className?: string;
}

const HE_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const HE_MONTHS = [
  "בינואר", "בפברואר", "במרץ", "באפריל", "במאי", "ביוני",
  "ביולי", "באוגוסט", "בספטמבר", "באוקטובר", "בנובמבר", "בדצמבר",
];

function formatDate(date: Date): string {
  const day = HE_DAYS[date.getDay()];
  return `יום ${day}, ${date.getDate()} ${HE_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} דקות`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} שעה${h > 1 ? "ות" : ""}`;
  return `${h} שעה${h > 1 ? "ות" : ""} ו-${m} דקות`;
}

function SummaryRow({
  icon,
  label,
  value,
  valueClass = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-gray-800 ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

export default function BookingSummary({
  services,
  staffName,
  date,
  time,
  depositRequired = false,
  depositAmount,
  compact = false,
  className = "",
}: BookingSummaryProps) {
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

  const effectiveDeposit =
    depositRequired
      ? depositAmount ?? Math.round(totalPrice * 0.3)
      : 0;

  const isEmpty =
    services.length === 0 && !staffName && !date && !time;

  if (isEmpty) {
    return (
      <div
        className={`bg-white rounded-2xl border border-gray-200 p-5 flex flex-col items-center justify-center gap-2 text-center min-h-[160px] ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-400">סיכום ההזמנה יופיע כאן</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-l from-[#B8973A] to-[#C8A850] px-5 py-4">
        <h2 className="text-white font-semibold text-base">סיכום הזמנה</h2>
        <p className="text-white/75 text-xs mt-0.5">
          {services.length > 0
            ? `${services.length} שירות${services.length > 1 ? "ים" : ""}`
            : "לא נבחרו שירותים"}
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Services List */}
        {services.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              שירותים
            </h3>
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 font-medium truncate">
                      {service.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDuration(service.duration)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 shrink-0 tabular-nums">
                    ₪{service.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {services.length > 0 && (staffName || date || time) && (
          <div className="border-t border-gray-100" />
        )}

        {/* Details */}
        <div className="space-y-3">
          {staffName && (
            <SummaryRow
              icon={
                <svg
                  className="w-4 h-4 text-[#B8973A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
              label="מטפלת"
              value={staffName}
            />
          )}

          {date && (
            <SummaryRow
              icon={
                <svg
                  className="w-4 h-4 text-[#B8973A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              label="תאריך"
              value={formatDate(date)}
            />
          )}

          {time && (
            <SummaryRow
              icon={
                <svg
                  className="w-4 h-4 text-[#B8973A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              label="שעה"
              value={time}
            />
          )}

          {totalDuration > 0 && (
            <SummaryRow
              icon={
                <svg
                  className="w-4 h-4 text-[#B8973A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
              label="משך הטיפול"
              value={formatDuration(totalDuration)}
            />
          )}
        </div>

        {/* Totals */}
        {services.length > 0 && (
          <>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              {/* Total price */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">סה״כ לתשלום</span>
                <span className="text-lg font-bold text-[#B8973A] tabular-nums">
                  ₪{totalPrice}
                </span>
              </div>

              {/* Deposit */}
              {depositRequired && (
                <div className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-[#8A6E22]">מקדמה לתשלום עכשיו</p>
                    <p className="text-[10px] text-amber-600/70 mt-0.5">
                      היתרה תשולם בסלון
                    </p>
                  </div>
                  <span className="text-base font-bold text-[#B8973A] tabular-nums">
                    ₪{effectiveDeposit}
                  </span>
                </div>
              )}
            </div>

            {/* Cancellation note */}
            {!compact && (
              <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
                <svg
                  className="w-4 h-4 text-blue-400 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-[11px] text-blue-600/80 leading-relaxed">
                  ניתן לבטל או לשנות תור עד 24 שעות לפני המועד ללא עלות.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
