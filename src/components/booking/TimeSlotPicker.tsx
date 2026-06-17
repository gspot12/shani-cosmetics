"use client";

import React, { useMemo } from "react";

interface TimeSlot {
  time: string; // "HH:MM" format
  available: boolean;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

type Period = "morning" | "afternoon" | "evening";

const PERIOD_CONFIG: Record<
  Period,
  { label: string; startHour: number; endHour: number; icon: string }
> = {
  morning: { label: "בוקר", startHour: 6, endHour: 12, icon: "☀️" },
  afternoon: { label: "צהריים / אחר הצהריים", startHour: 12, endHour: 17, icon: "🌤️" },
  evening: { label: "ערב", startHour: 17, endHour: 23, icon: "🌙" },
};

function getPeriod(time: string): Period {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "אח\"צ" : "בבוקר";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")}`;
}

export default function TimeSlotPicker({
  slots,
  selectedTime,
  onSelect,
}: TimeSlotPickerProps) {
  const grouped = useMemo(() => {
    const groups: Record<Period, TimeSlot[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    for (const slot of slots) {
      groups[getPeriod(slot.time)].push(slot);
    }
    return groups;
  }, [slots]);

  const periodOrder: Period[] = ["morning", "afternoon", "evening"];
  const hasAny = slots.length > 0;

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg
            className="w-7 h-7 text-gray-300"
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
        </div>
        <p className="text-sm font-medium text-gray-500">אין שעות פנויות ביום זה</p>
        <p className="text-xs text-gray-400 mt-1">אנא בחרי תאריך אחר</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {periodOrder.map((period) => {
        const periodSlots = grouped[period];
        if (periodSlots.length === 0) return null;
        const config = PERIOD_CONFIG[period];
        const availableCount = periodSlots.filter((s) => s.available).length;

        return (
          <div key={period}>
            {/* Period Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base" role="img" aria-hidden="true">
                {config.icon}
              </span>
              <h3 className="text-sm font-semibold text-gray-600">{config.label}</h3>
              <span className="text-xs text-gray-400">
                ({availableCount} פנויות)
              </span>
              <div className="flex-1 h-px bg-gray-100 mr-1" />
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {periodSlots.map((slot) => {
                const isSelected = slot.time === selectedTime;
                const isAvailable = slot.available;

                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => isAvailable && onSelect(slot.time)}
                    disabled={!isAvailable}
                    className={`
                      relative py-2.5 px-2 rounded-xl text-sm font-medium transition-all duration-150
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8973A] focus-visible:ring-offset-1
                      ${
                        isSelected
                          ? "bg-[#B8973A] text-white shadow-md scale-105"
                          : isAvailable
                          ? "bg-white border border-gray-200 text-gray-700 hover:border-[#B8973A]/60 hover:bg-amber-50/40 hover:text-[#8A6E22] hover:shadow-sm active:scale-95"
                          : "bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed"
                      }
                    `}
                    aria-label={`${slot.time} - ${isSelected ? "נבחר" : isAvailable ? "פנוי" : "תפוס"}`}
                    aria-pressed={isSelected}
                  >
                    <span className="block text-center tabular-nums">{slot.time}</span>
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-px bg-gray-200 rotate-12" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-4 justify-end">
        {[
          {
            style: "border border-gray-200 bg-white",
            label: "פנוי",
            text: "text-gray-500",
          },
          {
            style: "bg-[#B8973A]",
            label: "נבחר",
            text: "text-white",
          },
          {
            style: "border border-gray-100 bg-gray-50",
            label: "תפוס",
            text: "text-gray-300",
          },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className={`w-8 h-6 rounded-lg text-[10px] flex items-center justify-center ${item.style} ${item.text}`}
            >
              <span>12:00</span>
            </div>
            <span className="text-[10px] text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
