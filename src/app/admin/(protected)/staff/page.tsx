"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listStaff,
  createStaff,
  updateStaff,
  listServices,
} from "@/server/actions/admin";
import type { StaffCreateInput } from "@/server/actions/admin";
import type { StaffWithServices } from "@/types";
import type { ServiceWithCategory } from "@/types";

const COLORS = ["#E8B4B8", "#B8D8E8", "#C8E6C9", "#FFE0B2", "#E1BEE7", "#B8973A", "#80CBC4", "#F48FB1"];

const EMPTY_FORM: StaffCreateInput = {
  name: "",
  phone: null,
  email: null,
  bio: null,
  imageUrl: null,
  color: "#E8B4B8",
  isActive: true,
  maxAppointmentsPerDay: null,
  serviceIds: [],
};

function StaffModal({
  staff,
  services,
  onClose,
  onSave,
}: {
  staff?: StaffWithServices | null;
  services: ServiceWithCategory[];
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!staff;
  const [form, setForm] = useState<StaffCreateInput>(
    staff
      ? {
          name: staff.name,
          phone: staff.phone ?? null,
          email: staff.email ?? null,
          bio: staff.bio ?? null,
          imageUrl: staff.imageUrl ?? null,
          color: staff.color,
          isActive: staff.isActive,
          maxAppointmentsPerDay: staff.maxAppointmentsPerDay ?? null,
          serviceIds: staff.services.map((s) => s.id),
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleService(id: string) {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds?.includes(id)
        ? f.serviceIds.filter((s) => s !== id)
        : [...(f.serviceIds ?? []), id],
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("שם המטפלת הוא שדה חובה");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEdit && staff) {
        await updateStaff({ staffId: staff.id, data: form });
      } else {
        await createStaff(form);
      }
      onSave();
      onClose();
    } catch {
      setError("שגיאה בשמירת המטפלת");
    } finally {
      setSaving(false);
    }
  }

  // Group services by category
  const grouped = services.reduce<Record<string, { name: string; services: ServiceWithCategory[] }>>(
    (acc, s) => {
      if (!acc[s.categoryId]) acc[s.categoryId] = { name: s.categoryName, services: [] };
      acc[s.categoryId].services.push(s);
      return acc;
    },
    {}
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-800">
            {isEdit ? `עריכת ${staff!.name}` : "הוספת מטפלת חדשה"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">שם מלא *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                placeholder="שם המטפלת"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">טלפון</label>
              <input
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value || null }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                placeholder="05X-XXXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">אימייל</label>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value || null }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">מקסימום תורים ביום</label>
              <input
                type="number"
                value={form.maxAppointmentsPerDay ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, maxAppointmentsPerDay: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                placeholder="ללא הגבלה"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">ביוגרפיה</label>
              <textarea
                value={form.bio ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value || null }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-[#B8973A]"
                placeholder="תיאור קצר על המטפלת"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">צבע ביומן</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.color === c ? "border-gray-700 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 accent-[#B8973A]"
              />
              <span className="text-sm text-gray-600">מטפלת פעילה</span>
            </label>
          </div>

          {/* Services */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">שירותים מוצעים</label>
            <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-3">
              {Object.entries(grouped).map(([, { name, services: catSvcs }]) => (
                <div key={name}>
                  <p className="text-xs font-semibold text-gray-400 mb-1.5">{name}</p>
                  <div className="space-y-1">
                    {catSvcs.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(form.serviceIds ?? []).includes(s.id)}
                          onChange={() => toggleService(s.id)}
                          className="w-4 h-4 accent-[#B8973A]"
                        />
                        <span className="text-sm text-gray-700">{s.name}</span>
                        <span className="text-xs text-gray-400 mr-auto">₪{s.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] disabled:opacity-40 transition-colors"
          >
            {saving ? "שומר..." : isEdit ? "שמור שינויים" : "הוסף מטפלת"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffWithServices[]>([]);
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [modalStaff, setModalStaff] = useState<StaffWithServices | null | undefined>(undefined);
  // undefined = closed, null = adding new, StaffWithServices = editing

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [staff, svcs] = await Promise.all([listStaff(), listServices()]);
      setStaffList(staff);
      setServices(svcs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isModalOpen = modalStaff !== undefined;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">מטפלות</h1>
          <p className="text-sm text-gray-500 mt-0.5">ניהול צוות המטפלות</p>
        </div>
        <button
          onClick={() => setModalStaff(null)}
          className="flex items-center gap-2 px-4 py-2 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          הוספת מטפלת
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <svg className="w-6 h-6 text-[#B8973A] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : staffList.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-400 mb-4">אין מטפלות רשומות</p>
          <button
            onClick={() => setModalStaff(null)}
            className="text-[#B8973A] hover:underline text-sm"
          >
            הוסיפי מטפלת חדשה
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {staffList.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${!s.isActive ? "opacity-60" : ""}`}
            >
              {/* Color header */}
              <div className="h-2" style={{ backgroundColor: s.color }} />
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  {s.imageUrl ? (
                    <img
                      src={s.imageUrl}
                      alt={s.name}
                      className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-gray-100"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-800">{s.name}</h3>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          s.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {s.isActive ? "פעילה" : "לא פעילה"}
                      </span>
                    </div>
                    {s.phone && (
                      <p className="text-xs text-gray-400 mt-0.5">{s.phone}</p>
                    )}
                    {s.bio && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.bio}</p>
                    )}
                  </div>
                </div>

                {/* Services */}
                {s.services.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 mb-1.5">שירותים</p>
                    <div className="flex flex-wrap gap-1">
                      {s.services.slice(0, 4).map((svc) => (
                        <span key={svc.id} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {svc.name}
                        </span>
                      ))}
                      {s.services.length > 4 && (
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                          +{s.services.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setModalStaff(s)}
                  className="w-full py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#B8973A] transition-colors font-medium"
                >
                  עריכה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <StaffModal
          staff={modalStaff}
          services={services}
          onClose={() => setModalStaff(undefined)}
          onSave={() => {
            load();
            showToast(modalStaff ? "המטפלת עודכנה" : "מטפלת נוספה בהצלחה");
          }}
        />
      )}
    </div>
  );
}
