"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import CustomerLayout from "@/components/layout/CustomerLayout";
import { getServices, createWaitlistEntry } from "@/server/actions/booking";
import type { ServiceWithCategory } from "@/types";

function isValidIsraeliPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return /^05\d{8}$/.test(digits) || /^9725\d{8}$/.test(digits);
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("972")) return "+" + digits;
  if (digits.startsWith("0")) return "+972" + digits.slice(1);
  return "+972" + digits;
}

export default function WaitlistPage() {
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredFrom, setPreferredFrom] = useState("");
  const [preferredTo, setPreferredTo] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getServices()
      .then(setServices)
      .finally(() => setFetchLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedServiceId) {
      setError("נא לבחור שירות");
      return;
    }
    if (!isValidIsraeliPhone(phone)) {
      setError("נא להזין מספר טלפון ישראלי תקין");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createWaitlistEntry({
        customerPhone: formatPhone(phone),
        serviceId: selectedServiceId,
        preferredFrom: preferredFrom || undefined,
        preferredTo: preferredTo || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה. נסי שוב.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">נרשמת לרשימת ההמתנה!</h1>
          <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            ניצור איתך קשר ברגע שיתפנה מקום. נשמח לראות אותך אצלנו!
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center bg-[#B8973A] text-white font-semibold py-3.5 rounded-xl hover:bg-[#9A7D2E] transition-colors"
            >
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-lg mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "serif" }}>
            רשימת המתנה
          </h1>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            אין זמינות לתאריך הרצוי? הצטרפי לרשימת ההמתנה ונעדכן אותך כשיתפנה מקום.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              שירות מבוקש <span className="text-red-400">*</span>
            </label>
            {fetchLoading ? (
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                required
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8973A]/30 focus:border-[#B8973A] transition-all appearance-none"
              >
                <option value="">בחרי שירות...</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} ({svc.categoryName}) — ₪{svc.price}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              מספר טלפון <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-000-0000"
              dir="ltr"
              required
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8973A]/30 focus:border-[#B8973A] text-left transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">נשלח אליך הודעה כשיתפנה מקום</p>
          </div>

          {/* Date range - optional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                מתאריך <span className="text-gray-400 text-xs">(אופציונלי)</span>
              </label>
              <input
                type="date"
                value={preferredFrom}
                onChange={(e) => setPreferredFrom(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#B8973A]/30 focus:border-[#B8973A] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                עד תאריך <span className="text-gray-400 text-xs">(אופציונלי)</span>
              </label>
              <input
                type="date"
                value={preferredTo}
                onChange={(e) => setPreferredTo(e.target.value)}
                min={preferredFrom || new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#B8973A]/30 focus:border-[#B8973A] transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              הערות <span className="text-gray-400 text-xs">(אופציונלי)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="למשל: מועדיפה שעות בוקר, יכולה רק בימי שישי..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8973A]/30 focus:border-[#B8973A] resize-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B8973A] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3.5 rounded-xl transition-colors hover:bg-[#9A7D2E] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>שומרת...</span></>
            ) : (
              "הצטרפי לרשימת ההמתנה"
            )}
          </button>

          <div className="text-center pt-2">
            <Link href="/book" className="text-sm text-[#B8973A] hover:text-[#9A7D2E] transition-colors">
              נסי לקבוע תור ישיר
            </Link>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}
