"use client";

import { useState, useEffect, useCallback } from "react";
import { listCustomers, updateCustomer } from "@/server/actions/admin";
import type { Customer } from "@prisma/client";

function CustomerRow({
  customer,
  onToggleBlock,
}: {
  customer: Customer;
  onToggleBlock: (id: string, blocked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleToggleBlock() {
    setSaving(true);
    try {
      await onToggleBlock(customer.id, !customer.isBlocked);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <tr
        className="hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#B8973A]/15 flex items-center justify-center text-[#B8973A] text-xs font-bold shrink-0">
              {customer.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{customer.fullName}</p>
              {customer.isBlocked && (
                <span className="text-[10px] text-red-500 font-medium">חסומה</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <a
            href={`tel:${customer.phone}`}
            className="text-sm text-gray-600 hover:text-[#B8973A]"
            onClick={(e) => e.stopPropagation()}
          >
            {customer.phone}
          </a>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-gray-500">{customer.email ?? "—"}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-xs text-gray-400">
            {new Date(customer.createdAt).toLocaleDateString("he-IL")}
          </p>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleToggleBlock}
              disabled={saving}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors disabled:opacity-40 ${
                customer.isBlocked
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              }`}
            >
              {customer.isBlocked ? "בטל חסימה" : "חסום"}
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={5} className="px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">פרטים נוספים</p>
                <div className="space-y-1.5 text-sm">
                  {customer.birthDate && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-24 shrink-0">יום הולדת</span>
                      <span className="text-gray-700">
                        {new Date(customer.birthDate).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-24 shrink-0">הסכמה שיווקית</span>
                    <span className={customer.marketingConsent ? "text-green-600" : "text-gray-400"}>
                      {customer.marketingConsent ? "כן" : "לא"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-24 shrink-0">לקוחה מאז</span>
                    <span className="text-gray-700">
                      {new Date(customer.createdAt).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">הערות</p>
                <p className="text-sm text-gray-600">
                  {customer.notes || (
                    <span className="text-gray-300 italic">אין הערות</span>
                  )}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCustomers({
        search: debouncedSearch || undefined,
        page,
      });
      setCustomers(data.customers);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function handleToggleBlock(customerId: string, blocked: boolean) {
    await updateCustomer({ customerId, data: { isBlocked: blocked } as Partial<Customer> });
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, isBlocked: blocked } : c))
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
        <p className="text-sm text-gray-500 mt-0.5">ניהול לקוחות · {total} רשומות</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative max-w-md">
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, טלפון או אימייל"
            className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#B8973A]"
          />
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
        ) : customers.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-400">לא נמצאו לקוחות</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">שם</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">טלפון</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">אימייל</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">לקוחה מאז</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.map((c) => (
                    <CustomerRow key={c.id} customer={c} onToggleBlock={handleToggleBlock} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {customers.map((c) => (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#B8973A]/15 flex items-center justify-center text-[#B8973A] text-sm font-bold shrink-0">
                      {c.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{c.fullName}</p>
                      <p className="text-xs text-gray-500">{c.phone}</p>
                    </div>
                    <button
                      onClick={() => handleToggleBlock(c.id, !c.isBlocked)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium border ${
                        c.isBlocked
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}
                    >
                      {c.isBlocked ? "בטל חסימה" : "חסום"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">עמוד {page} מתוך {totalPages} · {total} לקוחות</p>
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
