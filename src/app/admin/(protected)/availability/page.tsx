"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getWorkingHours,
  updateWorkingHours,
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  listStaff,
} from "@/server/actions/admin";
import type { WorkingHourInput } from "@/server/actions/admin";
import type { StaffWithServices } from "@/types";
import type { WorkingHour, AvailabilityBlock } from "@prisma/client";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function WorkingHoursTable({
  hours,
  staffId,
  onChange,
}: {
  hours: WorkingHour[];
  staffId: string | null;
  onChange: () => void;
}) {
  const [localHours, setLocalHours] = useState<WorkingHourInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const initialHours: WorkingHourInput[] = DAYS.map((_, dayOfWeek) => {
      const existing = hours.find(
        (h) => h.dayOfWeek === dayOfWeek && h.staffId === staffId
      );
      return existing
        ? {
            id: existing.id,
            staffId: staffId ?? null,
            dayOfWeek,
            startTime: existing.startTime,
            endTime: existing.endTime,
            isActive: existing.isActive,
          }
        : {
            staffId: staffId ?? null,
            dayOfWeek,
            startTime: "09:00",
            endTime: "18:00",
            isActive: false,
          };
    });
    setLocalHours(initialHours);
  }, [hours, staffId]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateWorkingHours(localHours);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onChange();
    } catch {
      alert("שגיאה בשמירת שעות");
    } finally {
      setSaving(false);
    }
  }

  function update(idx: number, changes: Partial<WorkingHourInput>) {
    setLocalHours((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, ...changes } : h))
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-right text-xs font-semibold text-gray-400 py-2 px-3 w-24">יום</th>
            <th className="text-right text-xs font-semibold text-gray-400 py-2 px-3">פעיל</th>
            <th className="text-right text-xs font-semibold text-gray-400 py-2 px-3">שעת פתיחה</th>
            <th className="text-right text-xs font-semibold text-gray-400 py-2 px-3">שעת סגירה</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {localHours.map((h, i) => (
            <tr key={i} className={!h.isActive ? "opacity-50" : ""}>
              <td className="py-2.5 px-3">
                <span className="text-sm font-medium text-gray-700">{DAYS[h.dayOfWeek]}</span>
              </td>
              <td className="py-2.5 px-3">
                <button
                  type="button"
                  onClick={() => update(i, { isActive: !h.isActive })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${h.isActive ? "bg-[#B8973A]" : "bg-gray-200"}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      h.isActive ? "translate-x-0.5" : "translate-x-[18px]"
                    }`}
                  />
                </button>
              </td>
              <td className="py-2.5 px-3">
                <input
                  type="time"
                  value={h.startTime}
                  onChange={(e) => update(i, { startTime: e.target.value })}
                  disabled={!h.isActive}
                  className="px-2 py-1 border border-gray-200 rounded text-sm text-gray-700 focus:outline-none focus:border-[#B8973A] disabled:bg-gray-50 disabled:text-gray-300"
                />
              </td>
              <td className="py-2.5 px-3">
                <input
                  type="time"
                  value={h.endTime}
                  onChange={(e) => update(i, { endTime: e.target.value })}
                  disabled={!h.isActive}
                  className="px-2 py-1 border border-gray-200 rounded text-sm text-gray-700 focus:outline-none focus:border-[#B8973A] disabled:bg-gray-50 disabled:text-gray-300"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 ${
            saved
              ? "bg-green-600 text-white"
              : "bg-[#B8973A] text-white hover:bg-[#A07830]"
          }`}
        >
          {saving ? "שומר..." : saved ? "נשמר!" : "שמור שעות"}
        </button>
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [blocks, setBlocks] = useState<(AvailabilityBlock & { staff?: { name: string } | null })[]>([]);
  const [staffList, setStaffList] = useState<StaffWithServices[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaffTab, setSelectedStaffTab] = useState<string>("general");

  // Block form
  const [blockForm, setBlockForm] = useState({
    staffId: "",
    startDateTime: "",
    endDateTime: "",
    reason: "",
    isFullDay: false,
  });
  const [addingBlock, setAddingBlock] = useState(false);
  const [blockError, setBlockError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, staff] = await Promise.all([getWorkingHours(), listStaff()]);
      setHours(h);
      setStaffList(staff);

      // Load blocks from API
      const res = await fetch("/api/admin/blocks");
      if (res.ok) {
        const data = await res.json();
        setBlocks(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddBlock() {
    if (!blockForm.startDateTime || !blockForm.endDateTime) {
      setBlockError("יש למלא תאריכי התחלה וסיום");
      return;
    }
    setAddingBlock(true);
    setBlockError("");
    try {
      await createAvailabilityBlock({
        staffId: blockForm.staffId || undefined,
        startDateTime: blockForm.startDateTime,
        endDateTime: blockForm.endDateTime,
        reason: blockForm.reason || undefined,
        isFullDay: blockForm.isFullDay,
      });
      setBlockForm({ staffId: "", startDateTime: "", endDateTime: "", reason: "", isFullDay: false });
      await load();
    } catch {
      setBlockError("שגיאה בהוספת חסימה");
    } finally {
      setAddingBlock(false);
    }
  }

  async function handleDeleteBlock(id: string) {
    if (!confirm("האם למחוק את החסימה?")) return;
    try {
      await deleteAvailabilityBlock(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert("שגיאה במחיקת חסימה");
    }
  }

  const selectedStaffId = selectedStaffTab === "general" ? null : selectedStaffTab;

  const upcomingBlocks = blocks.filter(
    (b) => new Date(b.endDateTime) >= new Date()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">זמינות</h1>
        <p className="text-sm text-gray-500 mt-0.5">ניהול שעות עבודה וחסימות</p>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <svg className="w-6 h-6 text-[#B8973A] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <>
          {/* Working Hours */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">שעות עבודה</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-gray-100 overflow-x-auto">
              <button
                onClick={() => setSelectedStaffTab("general")}
                className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  selectedStaffTab === "general"
                    ? "border-[#B8973A] text-[#B8973A]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                כלליות
              </button>
              {staffList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStaffTab(s.id)}
                  className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    selectedStaffTab === s.id
                      ? "border-[#B8973A] text-[#B8973A]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <WorkingHoursTable
              hours={hours}
              staffId={selectedStaffId}
              onChange={load}
            />
          </div>

          {/* Add Block */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">הוספת חסימה</h2>

            {blockError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{blockError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">מטפלת</label>
                <select
                  value={blockForm.staffId}
                  onChange={(e) => setBlockForm((f) => ({ ...f, staffId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
                >
                  <option value="">כל העסק</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">מתאריך/שעה</label>
                <input
                  type="datetime-local"
                  value={blockForm.startDateTime}
                  onChange={(e) => setBlockForm((f) => ({ ...f, startDateTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">עד תאריך/שעה</label>
                <input
                  type="datetime-local"
                  value={blockForm.endDateTime}
                  onChange={(e) => setBlockForm((f) => ({ ...f, endDateTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">סיבה</label>
                <input
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
                  placeholder="חופשה, חג, ועוד"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockForm.isFullDay}
                  onChange={(e) => setBlockForm((f) => ({ ...f, isFullDay: e.target.checked }))}
                  className="w-4 h-4 accent-[#B8973A]"
                />
                <span className="text-sm text-gray-600">יום שלם</span>
              </label>
              <button
                onClick={handleAddBlock}
                disabled={addingBlock}
                className="px-4 py-2 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] disabled:opacity-40 transition-colors mr-auto"
              >
                {addingBlock ? "מוסיף..." : "הוסף חסימה"}
              </button>
            </div>
          </div>

          {/* Upcoming Blocks */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">חסימות קרובות</h2>
            </div>
            {upcomingBlocks.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400 text-sm">אין חסימות קרובות</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingBlocks.map((block) => (
                  <div key={block.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">
                          {block.reason || "חסימה"}
                        </p>
                        {block.isFullDay && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">יום שלם</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(block.startDateTime).toLocaleString("he-IL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {new Date(block.endDateTime).toLocaleString("he-IL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {block.staffId && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {staffList.find((s) => s.id === block.staffId)?.name ?? "מטפלת"}
                        </p>
                      )}
                      {!block.staffId && (
                        <p className="text-xs text-gray-400 mt-0.5">כל העסק</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
