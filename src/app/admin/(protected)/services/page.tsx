"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listServices,
  updateService,
  softDeleteService,
  createService,
} from "@/server/actions/admin";
import type { ServiceWithCategory } from "@/types";
import type { ServiceCreateInput } from "@/server/actions/admin";

const EMPTY_FORM: ServiceCreateInput = {
  categoryId: "",
  name: "",
  description: "",
  durationMinutes: 60,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 10,
  price: 0,
  depositAmount: null,
  requiresDeposit: false,
  requiresApproval: false,
  imageUrl: null,
  isActive: true,
  sortOrder: 0,
};

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceWithCategory>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<ServiceCreateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listServices();
      setServices(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Group by category
  const grouped = services.reduce<Record<string, { name: string; services: ServiceWithCategory[] }>>(
    (acc, s) => {
      if (!acc[s.categoryId]) acc[s.categoryId] = { name: s.categoryName, services: [] };
      acc[s.categoryId].services.push(s);
      return acc;
    },
    {}
  );

  async function handleToggleActive(service: ServiceWithCategory) {
    setSaving(true);
    try {
      await updateService({ serviceId: service.id, data: { isActive: !service.isActive } });
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch {
      showToast("שגיאה בעדכון", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSoftDelete(serviceId: string) {
    if (!confirm("האם למחוק את השירות? ניתן לשחזר על ידי הפעלה מחדש.")) return;
    setSaving(true);
    try {
      await softDeleteService(serviceId);
      setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, isActive: false } : s)));
      showToast("השירות הוסר");
    } catch {
      showToast("שגיאה במחיקה", "error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(service: ServiceWithCategory) {
    setEditingId(service.id);
    setEditForm({ ...service });
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateService({ serviceId: editingId, data: editForm });
      await load();
      setEditingId(null);
      showToast("שירות עודכן בהצלחה");
    } catch {
      showToast("שגיאה בשמירה", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!addForm.name.trim() || !addForm.categoryId) {
      showToast("יש למלא שם ועיצוב קטגוריה", "error");
      return;
    }
    setSaving(true);
    try {
      await createService(addForm);
      await load();
      setShowAddModal(false);
      setAddForm(EMPTY_FORM);
      showToast("שירות נוסף בהצלחה");
    } catch {
      showToast("שגיאה בהוספת שירות", "error");
    } finally {
      setSaving(false);
    }
  }

  const categories = Object.entries(grouped);

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
          <h1 className="text-2xl font-bold text-gray-900">שירותים</h1>
          <p className="text-sm text-gray-500 mt-0.5">ניהול שירותים לפי קטגוריה</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          שירות חדש
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <svg className="w-6 h-6 text-[#B8973A] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(([catId, { name, services: catServices }]) => (
            <div key={catId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                <h2 className="font-semibold text-gray-700 text-sm">{name}</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {catServices.map((service) => (
                  <div key={service.id}>
                    {editingId === service.id ? (
                      // Edit mode
                      <div className="p-4 bg-blue-50/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">שם שירות</label>
                            <input
                              value={editForm.name ?? ""}
                              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">מחיר (₪)</label>
                            <input
                              type="number"
                              value={editForm.price ?? 0}
                              onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">משך (דקות)</label>
                            <input
                              type="number"
                              value={editForm.durationMinutes ?? 60}
                              onChange={(e) => setEditForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            <label className="block text-xs text-gray-500 mb-1">תיאור</label>
                            <textarea
                              value={editForm.description ?? ""}
                              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-[#B8973A]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">מקדמה (₪)</label>
                            <input
                              type="number"
                              value={editForm.depositAmount ?? ""}
                              onChange={(e) => setEditForm((f) => ({ ...f, depositAmount: e.target.value ? Number(e.target.value) : null }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                            />
                          </div>
                          <div className="flex items-end gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editForm.requiresApproval ?? false}
                                onChange={(e) => setEditForm((f) => ({ ...f, requiresApproval: e.target.checked }))}
                                className="w-4 h-4 rounded accent-[#B8973A]"
                              />
                              <span className="text-sm text-gray-600">דורש אישור</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="px-4 py-2 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] disabled:opacity-40 transition-colors"
                          >
                            שמור
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            ביטול
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className={`flex items-center gap-4 px-5 py-3.5 ${!service.isActive ? "opacity-50" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-800">{service.name}</p>
                            {!service.isActive && (
                              <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">לא פעיל</span>
                            )}
                            {service.requiresApproval && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">דורש אישור</span>
                            )}
                            {service.requiresDeposit && (
                              <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">מקדמה</span>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{service.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 shrink-0 text-sm">
                          <span className="text-gray-500 hidden sm:block">{service.durationMinutes}′</span>
                          <span className="font-semibold text-gray-800">₪{service.price.toLocaleString("he-IL")}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleActive(service)}
                            disabled={saving}
                            className={`relative w-9 h-5 rounded-full transition-colors ${service.isActive ? "bg-green-500" : "bg-gray-200"}`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${service.isActive ? "translate-x-0.5" : "translate-x-4.5 translate-x-[18px]"}`}
                            />
                          </button>
                          <button
                            onClick={() => startEdit(service)}
                            className="p-1.5 text-gray-400 hover:text-[#B8973A] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleSoftDelete(service.id)}
                            disabled={saving}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">הוספת שירות חדש</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">קטגוריה</label>
                <select
                  value={addForm.categoryId}
                  onChange={(e) => setAddForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                >
                  <option value="">בחרי קטגוריה</option>
                  {categories.map(([id, { name }]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">שם שירות *</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                  placeholder="שם השירות"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">מחיר (₪) *</label>
                  <input
                    type="number"
                    value={addForm.price}
                    onChange={(e) => setAddForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">משך (דקות) *</label>
                  <input
                    type="number"
                    value={addForm.durationMinutes}
                    onChange={(e) => setAddForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">תיאור</label>
                <textarea
                  value={addForm.description ?? ""}
                  onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-[#B8973A]"
                  placeholder="תיאור קצר של השירות"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">מקדמה (₪)</label>
                  <input
                    type="number"
                    value={addForm.depositAmount ?? ""}
                    onChange={(e) => setAddForm((f) => ({ ...f, depositAmount: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B8973A]"
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addForm.requiresApproval ?? false}
                      onChange={(e) => setAddForm((f) => ({ ...f, requiresApproval: e.target.checked }))}
                      className="w-4 h-4 accent-[#B8973A]"
                    />
                    <span className="text-sm text-gray-600">דורש אישור</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addForm.requiresDeposit ?? false}
                      onChange={(e) => setAddForm((f) => ({ ...f, requiresDeposit: e.target.checked }))}
                      className="w-4 h-4 accent-[#B8973A]"
                    />
                    <span className="text-sm text-gray-600">דורש מקדמה</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] disabled:opacity-40 transition-colors"
              >
                הוסף שירות
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
