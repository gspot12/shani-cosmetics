"use client";

import React from "react";

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number; // in minutes
  price: number;
  description?: string;
}

interface ServiceCardProps {
  service: Service;
  selected: boolean;
  onToggle: (serviceId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  פנים: "bg-rose-100 text-rose-700",
  גוף: "bg-blue-100 text-blue-700",
  ציפורניים: "bg-purple-100 text-purple-700",
  שיער: "bg-amber-100 text-amber-700",
  עיניים: "bg-teal-100 text-teal-700",
  default: "bg-gray-100 text-gray-600",
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} דק'`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} שעה${h > 1 ? "ות" : ""}`;
  return `${h}:${String(m).padStart(2, "0")} שע'`;
}

export default function ServiceCard({ service, selected, onToggle }: ServiceCardProps) {
  const categoryColor =
    CATEGORY_COLORS[service.category] ?? CATEGORY_COLORS.default;

  return (
    <button
      type="button"
      onClick={() => onToggle(service.id)}
      className={`w-full text-right transition-all duration-200 rounded-2xl border-2 p-4 sm:p-5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8973A] focus-visible:ring-offset-2 ${
        selected
          ? "border-[#B8973A] bg-amber-50/60 shadow-md"
          : "border-gray-200 bg-white hover:border-[#D4B96B]/60 hover:shadow-sm hover:bg-amber-50/20"
      }`}
      aria-pressed={selected}
      aria-label={`${selected ? "בטל בחירת" : "בחר"} ${service.name}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="mt-0.5 shrink-0">
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
              selected
                ? "border-[#B8973A] bg-[#B8973A]"
                : "border-gray-300 group-hover:border-[#B8973A]/50"
            }`}
          >
            {selected && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: name + price */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3
              className={`text-sm sm:text-base font-semibold leading-snug transition-colors ${
                selected ? "text-[#8A6E22]" : "text-gray-800 group-hover:text-[#8A6E22]"
              }`}
            >
              {service.name}
            </h3>
            <div className="shrink-0 text-left">
              <span
                className={`text-base sm:text-lg font-bold tabular-nums transition-colors ${
                  selected ? "text-[#B8973A]" : "text-gray-700"
                }`}
              >
                ₪{service.price}
              </span>
            </div>
          </div>

          {/* Category badge + Duration */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${categoryColor}`}
            >
              {service.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg
                className="w-3.5 h-3.5"
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
              {formatDuration(service.duration)}
            </span>
          </div>

          {/* Description */}
          {service.description && (
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-2">
              {service.description}
            </p>
          )}
        </div>
      </div>

      {/* Selected indicator bar */}
      {selected && (
        <div className="mt-3 pt-3 border-t border-[#B8973A]/20 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-[#B8973A]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs text-[#B8973A] font-medium">נבחר</span>
        </div>
      )}
    </button>
  );
}
