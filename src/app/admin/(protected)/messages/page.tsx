"use client";

import { useState, useEffect, useCallback } from "react";
import { listMessageTemplates, updateMessageTemplate } from "@/server/actions/admin";
import type { MessageTemplate } from "@prisma/client";

const TEMPLATE_LABELS: Record<string, string> = {
  otp_whatsapp: "קוד OTP - וואטסאפ",
  otp_sms: "קוד OTP - SMS",
  confirmation_whatsapp: "אישור תור - וואטסאפ",
  confirmation_sms: "אישור תור - SMS",
  reminder_whatsapp: "תזכורת תור - וואטסאפ",
  reminder_sms: "תזכורת תור - SMS",
  cancellation_whatsapp: "ביטול תור - וואטסאפ",
  cancellation_sms: "ביטול תור - SMS",
  update_whatsapp: "עדכון תור - וואטסאפ",
  update_sms: "עדכון תור - SMS",
  admin_new_booking: "הודעה למנהל - תור חדש",
  waitlist_available: "זמינות ברשימת המתנה",
};

const VARIABLES_HINT = [
  { var: "{{customerName}}", desc: "שם הלקוחה" },
  { var: "{{date}}", desc: "תאריך התור" },
  { var: "{{time}}", desc: "שעת התור" },
  { var: "{{staffName}}", desc: "שם המטפלת" },
  { var: "{{services}}", desc: "רשימת שירותים" },
  { var: "{{price}}", desc: "מחיר" },
  { var: "{{manageUrl}}", desc: "קישור ניהול תור" },
  { var: "{{code}}", desc: "קוד OTP" },
  { var: "{{businessName}}", desc: "שם העסק" },
];

function renderPreview(body: string): string {
  const replacements: Record<string, string> = {
    "{{customerName}}": "שרה לוי",
    "{{date}}": "ב׳ באוגוסט 2025",
    "{{time}}": "14:30",
    "{{staffName}}": "שני",
    "{{services}}": "טיפול פנים, פדיקור",
    "{{price}}": "₪350",
    "{{manageUrl}}": "https://shani-cosm.com/my-appointment/abc123",
    "{{code}}": "482951",
    "{{businessName}}": "שני קוסמטיקס",
  };
  return body.replace(/\{\{[^}]+\}\}/g, (match) => replacements[match] ?? match);
}

export default function MessagesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMessageTemplates();
      setTemplates(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(template: MessageTemplate) {
    setEditingId(template.id);
    setEditBody(template.body);
    setEditActive(template.isActive);
    setShowPreview(null);
  }

  async function handleSave(templateId: string) {
    setSaving(true);
    try {
      await updateMessageTemplate({ id: templateId, body: editBody, isActive: editActive });
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, body: editBody, isActive: editActive } : t
        )
      );
      setEditingId(null);
      showToast("תבנית עודכנה בהצלחה");
    } catch {
      showToast("שגיאה בשמירה", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(template: MessageTemplate) {
    try {
      await updateMessageTemplate({ id: template.id, body: template.body, isActive: !template.isActive });
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, isActive: !t.isActive } : t))
      );
      showToast(template.isActive ? "תבנית הושבתה" : "תבנית הופעלה");
    } catch {
      showToast("שגיאה בעדכון", "error");
    }
  }

  function getLabel(key: string): string {
    return TEMPLATE_LABELS[key] ?? key;
  }

  const getChannel = (key: string) => {
    if (key.includes("whatsapp")) return "WhatsApp";
    if (key.includes("sms")) return "SMS";
    return "מערכת";
  };

  const getChannelColor = (key: string) => {
    if (key.includes("whatsapp")) return "bg-green-100 text-green-600";
    if (key.includes("sms")) return "bg-blue-100 text-blue-600";
    return "bg-gray-100 text-gray-500";
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
        <h1 className="text-2xl font-bold text-gray-900">תבניות הודעות</h1>
        <p className="text-sm text-gray-500 mt-0.5">עריכת הודעות אוטומטיות ללקוחות</p>
      </div>

      {/* Variables hint */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-700 mb-2">משתנים זמינים לשימוש בתבניות:</p>
        <div className="flex flex-wrap gap-2">
          {VARIABLES_HINT.map(({ var: v, desc }) => (
            <div key={v} className="flex items-center gap-1">
              <code className="text-xs bg-white border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded font-mono">
                {v}
              </code>
              <span className="text-xs text-amber-600">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Templates */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <svg className="w-6 h-6 text-[#B8973A] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                !template.isActive ? "opacity-60 border-gray-100" : "border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {getLabel(template.key)}
                  </h3>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getChannelColor(template.key)}`}>
                    {getChannel(template.key)}
                  </span>
                  {!template.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                      לא פעיל
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${template.isActive ? "bg-green-500" : "bg-gray-200"}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        template.isActive ? "translate-x-0.5" : "translate-x-[18px]"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => setShowPreview(showPreview === template.id ? null : template.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                  >
                    תצוגה מקדימה
                  </button>
                  {editingId !== template.id && (
                    <button
                      onClick={() => startEdit(template)}
                      className="text-xs text-[#B8973A] hover:underline font-medium px-2 py-1"
                    >
                      עריכה
                    </button>
                  )}
                </div>
              </div>

              {/* Edit mode */}
              {editingId === template.id ? (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">תוכן ההודעה</label>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 resize-y focus:outline-none focus:border-[#B8973A] font-mono leading-relaxed"
                      dir="auto"
                    />
                    <p className="text-xs text-gray-400 mt-1">{editBody.length} תווים</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                      className="w-4 h-4 accent-[#B8973A]"
                    />
                    <span className="text-sm text-gray-600">תבנית פעילה</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(template.id)}
                      disabled={saving}
                      className="px-4 py-2 bg-[#B8973A] text-white text-sm font-medium rounded-lg hover:bg-[#A07830] disabled:opacity-40 transition-colors"
                    >
                      {saving ? "שומר..." : "שמור"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-3">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed font-mono line-clamp-3">
                    {template.body}
                  </p>
                </div>
              )}

              {/* Preview */}
              {showPreview === template.id && (
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">תצוגה מקדימה עם נתונים לדוגמה:</p>
                  <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 max-w-md">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {renderPreview(editingId === template.id ? editBody : template.body)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {templates.length === 0 && (
            <div className="py-20 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-gray-400">אין תבניות הודעות</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
