"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuditLog } from "@/server/actions/admin";
import type { AuditLog } from "@prisma/client";

type AuditLogWithActor = AuditLog & {
  actor: { id: string; name: string; email: string } | null;
};

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  APPOINTMENT_CREATED_MANUALLY: { label: "יצירת תור", className: "bg-blue-100 text-blue-700" },
  APPOINTMENT_STATUS_UPDATED: { label: "עדכון סטטוס תור", className: "bg-yellow-100 text-yellow-700" },
  APPOINTMENT_PAYMENT_UPDATED: { label: "עדכון תשלום", className: "bg-purple-100 text-purple-700" },
  APPOINTMENT_CANCELLED: { label: "ביטול תור", className: "bg-red-100 text-red-600" },
  CUSTOMER_BLOCKED: { label: "חסימת לקוחה", className: "bg-red-100 text-red-600" },
  CUSTOMER_UNBLOCKED: { label: "ביטול חסימה", className: "bg-green-100 text-green-700" },
  SETTINGS_UPDATED: { label: "עדכון הגדרות", className: "bg-gray-100 text-gray-600" },
  SERVICE_CREATED: { label: "שירות חדש", className: "bg-green-100 text-green-700" },
  SERVICE_UPDATED: { label: "עדכון שירות", className: "bg-yellow-100 text-yellow-700" },
  STAFF_CREATED: { label: "מטפלת חדשה", className: "bg-blue-100 text-blue-700" },
  STAFF_UPDATED: { label: "עדכון מטפלת", className: "bg-yellow-100 text-yellow-700" },
  REVIEW_APPROVED: { label: "אישור ביקורת", className: "bg-green-100 text-green-700" },
  REVIEW_REJECTED: { label: "דחיית ביקורת", className: "bg-red-100 text-red-600" },
  BLOCK_CREATED: { label: "חסימת זמינות", className: "bg-orange-100 text-orange-600" },
  BLOCK_DELETED: { label: "מחיקת חסימה", className: "bg-gray-100 text-gray-500" },
  LOGIN: { label: "כניסה למערכת", className: "bg-gray-100 text-gray-600" },
  LOGOUT: { label: "יציאה מהמערכת", className: "bg-gray-100 text-gray-500" },
};

const ACTION_TYPES = Object.keys(ACTION_LABELS);

const ENTITY_LABELS: Record<string, string> = {
  Appointment: "תור",
  Customer: "לקוחה",
  Service: "שירות",
  Staff: "מטפלת",
  BusinessSettings: "הגדרות",
  Review: "ביקורת",
  AvailabilityBlock: "חסימה",
};

function formatMetadata(meta: string | null): string {
  if (!meta) return "";
  try {
    const obj = JSON.parse(meta);
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  } catch {
    return meta;
  }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogWithActor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const PAGE_SIZE = 50;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAuditLog({ page });
      setLogs(data.logs);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredLogs = actionFilter
    ? logs.filter((l) => l.action === actionFilter)
    : logs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">לוג ביקורת</h1>
        <p className="text-sm text-gray-500 mt-0.5">רישום כל הפעולות במערכת · {total} רשומות</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="max-w-xs">
          <label className="block text-xs text-gray-500 mb-1">סינון לפי פעולה</label>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
          >
            <option value="">כל הפעולות</option>
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABELS[a]?.label ?? a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#B8973A] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-gray-400">אין רשומות ביקורת</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">תאריך</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">מבצע</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">פעולה</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">ישות</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">פרטים</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLogs.map((log) => {
                    const actionInfo = ACTION_LABELS[log.action] ?? {
                      label: log.action,
                      className: "bg-gray-100 text-gray-600",
                    };
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-gray-700">
                            {new Date(log.createdAt).toLocaleString("he-IL", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {log.actor ? (
                            <div>
                              <p className="text-xs font-medium text-gray-800">{log.actor.name}</p>
                              <p className="text-[10px] text-gray-400">{log.actor.email}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">מערכת</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${actionInfo.className}`}>
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {log.entityType && (
                            <div>
                              <p className="text-xs text-gray-600">
                                {ENTITY_LABELS[log.entityType] ?? log.entityType}
                              </p>
                              {log.entityId && (
                                <p className="text-[10px] text-gray-300 font-mono">
                                  {log.entityId.slice(0, 8)}...
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {log.metadata && (
                            <p className="text-[11px] text-gray-400 max-w-[200px] truncate" title={formatMetadata(log.metadata)}>
                              {formatMetadata(log.metadata)}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-50">
              {filteredLogs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] ?? {
                  label: log.action,
                  className: "bg-gray-100 text-gray-600",
                };
                return (
                  <div key={log.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${actionInfo.className}`}>
                            {actionInfo.label}
                          </span>
                          {log.entityType && (
                            <span className="text-xs text-gray-500">
                              {ENTITY_LABELS[log.entityType] ?? log.entityType}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {log.actor?.name ?? "מערכת"} ·{" "}
                          {new Date(log.createdAt).toLocaleString("he-IL", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {log.metadata && (
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                            {formatMetadata(log.metadata)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              עמוד {page} מתוך {totalPages} · {total} רשומות
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                הקודם
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                הבא
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
