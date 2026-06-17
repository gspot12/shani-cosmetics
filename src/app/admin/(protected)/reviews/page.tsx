"use client";

import { useState, useEffect, useCallback } from "react";
import { listReviews, approveReview } from "@/server/actions/admin";
import type { Review, Customer, Appointment } from "@prisma/client";

type ReviewFull = Review & {
  customer: Customer;
  appointment: Appointment;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listReviews();
      setReviews(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(reviewId: string) {
    setSaving(reviewId);
    try {
      await approveReview(reviewId);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isPublished: true } : r))
      );
      showToast("הביקורת פורסמה");
    } catch {
      showToast("שגיאה בפרסום", "error");
    } finally {
      setSaving(null);
    }
  }

  async function handleReject(reviewId: string) {
    if (!confirm("האם לדחות את הביקורת?")) return;
    setSaving(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast("הביקורת נדחתה");
    } catch {
      showToast("שגיאה בדחיית הביקורת", "error");
    } finally {
      setSaving(null);
    }
  }

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.isPublished;
    if (filter === "published") return r.isPublished;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.isPublished).length;

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "—";

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ביקורות</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {reviews.length} ביקורות · ממוצע {avgRating}
            {reviews.length > 0 && (
              <span className="inline-flex items-center gap-0.5 mr-1 text-amber-500">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            )}
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {pendingCount} ממתינות לאישור
          </span>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-2">
          {[
            { value: "all" as const, label: "הכל" },
            { value: "pending" as const, label: "ממתינות" },
            { value: "published" as const, label: "פורסמו" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filter === f.value
                  ? "bg-[#B8973A] text-white border-[#B8973A]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm">
            <svg className="w-6 h-6 text-[#B8973A] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-400">אין ביקורות</p>
          </div>
        ) : (
          filtered.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl border shadow-sm p-5 ${
                !review.isPublished ? "border-yellow-200 bg-yellow-50/30" : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#B8973A]/15 flex items-center justify-center text-[#B8973A] font-bold text-sm shrink-0">
                    {review.customer.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{review.customer.fullName}</p>
                      {review.isPublished ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          פורסם
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          ממתין לאישור
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!review.isPublished && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={saving === review.id}
                      className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-40 transition-colors"
                    >
                      {saving === review.id ? "..." : "אשרי"}
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      disabled={saving === review.id}
                      className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-40 transition-colors"
                    >
                      דחי
                    </button>
                  </div>
                )}
              </div>

              {review.text && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed pr-12">
                  {review.text}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
