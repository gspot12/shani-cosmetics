"use client";

import React from "react";

interface Staff {
  id: string;
  name: string;
  bio?: string;
  specialties?: string[];
  rating?: number;
  reviewCount?: number;
  avatarColor?: string; // hex color for avatar background
  avatarInitials?: string;
  photoUrl?: string;
}

interface StaffCardProps {
  staff: Staff;
  selected: boolean;
  onSelect: (staffId: string) => void;
}

const AVATAR_COLORS = [
  "#E8C5C5",
  "#C5D5E8",
  "#C5E8D5",
  "#E8DCC5",
  "#D5C5E8",
  "#E8C5DA",
];

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3 h-3 ${
              star <= Math.floor(rating)
                ? "text-[#B8973A]"
                : star - 0.5 <= rating
                ? "text-[#B8973A] opacity-60"
                : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-gray-500">
        {rating.toFixed(1)}
        {count !== undefined && (
          <span className="text-gray-400"> ({count})</span>
        )}
      </span>
    </div>
  );
}

// "Any available staff" option card
export function AnyStaffCard({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-right transition-all duration-200 rounded-2xl border-2 p-4 sm:p-5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8973A] focus-visible:ring-offset-2 ${
        selected
          ? "border-[#B8973A] bg-amber-50/60 shadow-md"
          : "border-dashed border-gray-300 bg-white hover:border-[#B8973A]/50 hover:bg-amber-50/20 hover:shadow-sm"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            selected ? "bg-[#B8973A]/15" : "bg-gray-100 group-hover:bg-amber-50"
          }`}
        >
          <svg
            className={`w-7 h-7 transition-colors ${
              selected ? "text-[#B8973A]" : "text-gray-400 group-hover:text-[#B8973A]/60"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* Text */}
        <div>
          <h3
            className={`text-sm sm:text-base font-semibold transition-colors ${
              selected ? "text-[#8A6E22]" : "text-gray-700 group-hover:text-[#8A6E22]"
            }`}
          >
            כל מטפלת פנויה
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            נבחר אוטומטית מטפלת זמינה
          </p>
        </div>

        {/* Selection indicator */}
        <div className="mr-auto shrink-0">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              selected ? "border-[#B8973A] bg-[#B8973A]" : "border-gray-300"
            }`}
          >
            {selected && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function StaffCard({ staff, selected, onSelect }: StaffCardProps) {
  const initials =
    staff.avatarInitials ??
    staff.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2);

  const avatarBg =
    staff.avatarColor ??
    AVATAR_COLORS[
      staff.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
        AVATAR_COLORS.length
    ];

  return (
    <button
      type="button"
      onClick={() => onSelect(staff.id)}
      className={`w-full text-right transition-all duration-200 rounded-2xl border-2 p-4 sm:p-5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8973A] focus-visible:ring-offset-2 ${
        selected
          ? "border-[#B8973A] bg-amber-50/60 shadow-md"
          : "border-gray-200 bg-white hover:border-[#D4B96B]/60 hover:shadow-sm hover:bg-amber-50/20"
      }`}
      aria-pressed={selected}
      aria-label={`בחר ${staff.name}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {staff.photoUrl ? (
            <img
              src={staff.photoUrl}
              alt={staff.name}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 transition-all ${
                selected ? "border-[#B8973A]" : "border-transparent"
              }`}
            />
          ) : (
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold border-2 transition-all shrink-0`}
              style={{
                backgroundColor: avatarBg,
                borderColor: selected ? "#B8973A" : "transparent",
                color: "#5A4A2A",
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + radio */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className={`text-sm sm:text-base font-semibold transition-colors ${
                selected ? "text-[#8A6E22]" : "text-gray-800 group-hover:text-[#8A6E22]"
              }`}
            >
              {staff.name}
            </h3>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                selected ? "border-[#B8973A] bg-[#B8973A]" : "border-gray-300"
              }`}
            >
              {selected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>

          {/* Rating */}
          {staff.rating !== undefined && (
            <div className="mb-2">
              <StarRating rating={staff.rating} count={staff.reviewCount} />
            </div>
          )}

          {/* Bio */}
          {staff.bio && (
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-2 line-clamp-2">
              {staff.bio}
            </p>
          )}

          {/* Specialties */}
          {staff.specialties && staff.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {staff.specialties.map((spec) => (
                <span
                  key={spec}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    selected
                      ? "bg-[#B8973A]/15 text-[#8A6E22]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
