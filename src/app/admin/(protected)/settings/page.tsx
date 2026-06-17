"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getBusinessSettings,
  updateBusinessSettings,
} from "@/server/actions/admin";
import type { BusinessSettings } from "@prisma/client";

type SettingsForm = Partial<Omit<BusinessSettings, "id">>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="font-semibold text-gray-700 text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBusinessSettings();
      const { id: _, ...rest } = data;
      setForm(rest);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function update<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateBusinessSettings(form);
      showToast("ההגדרות נשמרו בהצלחה");
    } catch {
      showToast("שגיאה בשמירת ההגדרות", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <svg className="w-6 h-6 text-[#B8973A] animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הגדרות</h1>
        <p className="text-sm text-gray-500 mt-0.5">הגדרות כלליות של העסק</p>
      </div>

      {/* Business Info */}
      <Section title="פרטי העסק">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="שם העסק">
            <input
              value={form.businessName ?? ""}
              onChange={(e) => update("businessName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
            />
          </Field>
          <Field label="כתובת">
            <input
              value={form.address ?? ""}
              onChange={(e) => update("address", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              placeholder="רחוב, עיר"
            />
          </Field>
          <Field label="טלפון">
            <input
              value={form.phone ?? ""}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              placeholder="05X-XXXXXXX"
            />
          </Field>
          <Field label="וואטסאפ">
            <input
              value={form.whatsapp ?? ""}
              onChange={(e) => update("whatsapp", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              placeholder="05X-XXXXXXX"
            />
          </Field>
          <Field label="אינסטגרם">
            <input
              value={form.instagram ?? ""}
              onChange={(e) => update("instagram", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              placeholder="@username"
            />
          </Field>
          <Field label="וייז URL">
            <input
              value={form.wazeUrl ?? ""}
              onChange={(e) => update("wazeUrl", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              placeholder="https://waze.com/..."
            />
          </Field>
          <Field label="Google Maps URL" hint="קישור לגוגל מפות">
            <input
              value={form.googleMapsUrl ?? ""}
              onChange={(e) => update("googleMapsUrl", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              placeholder="https://maps.google.com/..."
            />
          </Field>
          <Field label="כתובת לוגו (URL)">
            <input
              value={form.logoUrl ?? ""}
              onChange={(e) => update("logoUrl", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              placeholder="https://..."
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="טקסט כותרת תחתונה">
              <textarea
                value={form.footerText ?? ""}
                onChange={(e) => update("footerText", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 resize-none focus:outline-none focus:border-[#B8973A]"
                placeholder="טקסט שיופיע בתחתית ההודעות"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="מדיניות ביטולים">
              <textarea
                value={form.cancellationPolicy ?? ""}
                onChange={(e) => update("cancellationPolicy", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 resize-none focus:outline-none focus:border-[#B8973A]"
                placeholder="ניתן לבטל תור עד 24 שעות לפני..."
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* Booking Policy */}
      <Section title="מדיניות הזמנה">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="מינימום הודעה מוקדמת (דקות)" hint="כמה דקות מינימום לפני תור ניתן לקבוע">
            <input
              type="number"
              value={form.minBookingNoticeMinutes ?? 180}
              onChange={(e) => update("minBookingNoticeMinutes", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              min={0}
            />
          </Field>
          <Field label="מאגר בין תורים (דקות)">
            <input
              type="number"
              value={form.defaultBufferMinutes ?? 10}
              onChange={(e) => update("defaultBufferMinutes", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              min={0}
            />
          </Field>
          <Field label="מגבלת ביטול (שעות)" hint="כמה שעות לפני התור ניתן לבטל">
            <input
              type="number"
              value={form.cancelLimitHours ?? 24}
              onChange={(e) => update("cancelLimitHours", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              min={0}
            />
          </Field>
          <Field label="מגבלת שינוי מועד (שעות)">
            <input
              type="number"
              value={form.rescheduleLimitHours ?? 24}
              onChange={(e) => update("rescheduleLimitHours", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              min={0}
            />
          </Field>
        </div>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowClientCancel ?? true}
              onChange={(e) => update("allowClientCancel", e.target.checked)}
              className="w-4 h-4 accent-[#B8973A]"
            />
            <div>
              <p className="text-sm text-gray-700">אפשר ביטול עצמאי ללקוחה</p>
              <p className="text-xs text-gray-400">הלקוחה תוכל לבטל תור בעצמה</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowClientReschedule ?? true}
              onChange={(e) => update("allowClientReschedule", e.target.checked)}
              className="w-4 h-4 accent-[#B8973A]"
            />
            <div>
              <p className="text-sm text-gray-700">אפשר שינוי מועד עצמאי ללקוחה</p>
              <p className="text-xs text-gray-400">הלקוחה תוכל לדחות תור בעצמה</p>
            </div>
          </label>
        </div>
      </Section>

      {/* Admin Notifications */}
      <Section title="התראות מנהל">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="טלפון לקבלת התראות" hint="מספר וואטסאפ לקבלת עדכונים">
            <input
              value={form.adminNotifyPhone ?? ""}
              onChange={(e) => update("adminNotifyPhone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              placeholder="05X-XXXXXXX"
            />
          </Field>
          <Field label="אימייל לקבלת התראות">
            <input
              type="email"
              value={form.adminNotifyEmail ?? ""}
              onChange={(e) => update("adminNotifyEmail", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
              placeholder="admin@example.com"
            />
          </Field>
        </div>
      </Section>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={load}
          className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          בטל שינויים
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] disabled:opacity-40 transition-colors shadow-sm flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              שומר...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              שמור הגדרות
            </>
          )}
        </button>
      </div>
    </div>
  );
}
