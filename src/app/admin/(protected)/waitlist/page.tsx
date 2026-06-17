"use client";

import { useState, useEffect, useCallback } from "react";
import { listWaitlistEntries, updateCustomer } from "@/server/actions/admin";
import type { WaitlistEntry, Customer, Service, Staff } from "@prisma/client";

type WaitlistEntryFull = WaitlistEntry & {
  customer: Customer;
  service: Service;
  staff: Staff | null;
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  WAITING: { label: "ממתין", className: "bg-yellow-100 text-yellow-700" },
  NOTIFIED: { label: "עודכן", className: "bg-blue-100 text-blue-600" },
  BOOKED: { label: "נקבע תור", className: "bg-green-100 text-green-700" },
  EXPIRED: { label: "פג תוקף", className: "bg-gray-100 text-gray-400" },
};

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntryFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [filterStatus, setFilterStatus] = useState("WAITING");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listWaitlistEntries();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRemove(entryId: string) {
    if (!confirm("האם להסיר את הלקוחה מרשימת ההמתנה?")) return;
    try {
      // We use a direct DB call via API since there's no remove action exported
      const res = await fetch(`/api/admin/waitlist/${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      showToast("הלקוחה הוסרה מהרשימה");
    } catch {
      showToast("שגיאה בהסרה", "error");
    }
  }

  function handleContact(customer: Customer) {
    const wa = `https://wa.me/972${customer.phone.replace(/^0/, "")}`;
    window.open(wa, "_blank");
  }

  const filtered = entries.filter((e) =>
    filterStatus === "" ? true : e.status === filterStatus
  );

  const formatPreferred = (entry: WaitlistEntryFull) => {
    const dates: string[] = [];
    if (entry.preferredFrom) {
      dates.push(new Date(entry.preferredFrom).toLocaleDateString("he-IL", { day: "numeric", month: "short" }));
    }
    if (entry.preferredTo) {
      dates.push(new Date(entry.preferredTo).toLocaleDateString("he-IL", { day: "numeric", month: "short" }));
    }
    return dates.length ? dates.join(" – ") : "גמיש";
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">רשימת המתנה</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {entries.filter((e) => e.status === "WAITING").length} לקוחות ממתינות
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "", label: "הכל" },
            { value: "WAITING", label: "ממתינות" },
            { value: "NOTIFIED", label: "עודכנו" },
            { value: "BOOKED", label: "נקבע תור" },
            { value: "EXPIRED", label: "פג תוקף" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filterStatus === f.value
                  ? "bg-[#B8973A] text-white border-[#B8973A]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#B8973A] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <p className="text-gray-400">אין רשומות ברשימת ההמתנה</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((entry) => {
              const statusInfo = STATUS_BADGE[entry.status] ?? { label: entry.status, className: "bg-gray-100 text-gray-600" };
              return (
                <div key={entry.id} className="flex items-start gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#B8973A]/15 flex items-center justify-center text-[#B8973A] font-bold text-sm shrink-0">
                    {entry.customer.fullName.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{entry.customer.fullName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      <span>
                        <span className="font-medium text-gray-600">שירות:</span>{" "}
                        {entry.service.name}
                      </span>
                      {entry.staff && (
                        <span>
                          <span className="font-medium text-gray-600">מטפלת:</span>{" "}
                          {entry.staff.name}
                        </span>
                      )}
                      <span>
                        <span className="font-medium text-gray-600">תאריכים מועדפים:</span>{" "}
                        {formatPreferred(entry)}
                      </span>
                      <span>
                        <span className="font-medium text-gray-600">נרשמה:</span>{" "}
                        {new Date(entry.createdAt).toLocaleDateString("he-IL")}
                      </span>
                      <span>
                        <span className="font-medium text-gray-600">טלפון:</span>{" "}
                        <a href={`tel:${entry.customer.phone}`} className="hover:text-[#B8973A]">
                          {entry.customer.phone}
                        </a>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => handleContact(entry.customer)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      צרי קשר
                    </button>
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      הסירי מרשימה
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
