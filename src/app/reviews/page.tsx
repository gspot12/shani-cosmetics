import React from "react";
import Link from "next/link";
import CustomerLayout from "@/components/layout/CustomerLayout";
import { prisma } from "@/lib/db";

async function getPublishedReviews() {
  return prisma.review.findMany({
    where: { isPublished: true },
    include: {
      customer: { select: { fullName: true } },
      appointment: {
        include: {
          appointmentServices: { select: { serviceNameSnapshot: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-[#B8973A]" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const HE_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function formatDate(date: Date): string {
  return `${date.getDate()} ${HE_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export default async function ReviewsPage() {
  const reviews = await getPublishedReviews();

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: totalReviews > 0
      ? Math.round((reviews.filter((r) => r.rating === star).length / totalReviews) * 100)
      : 0,
  }));

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-3"
            style={{ fontFamily: "serif" }}
          >
            ביקורות לקוחות
          </h1>
          <p className="text-[#8A7A72]">מה אומרות הלקוחות שלנו</p>
        </div>

        {/* Aggregate */}
        {totalReviews > 0 && (
          <div className="bg-white border border-[#E8D5C4] rounded-2xl p-6 sm:p-8 mb-10">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Big score */}
              <div className="text-center shrink-0">
                <p className="text-6xl font-bold text-[#B8973A]" style={{ fontFamily: "serif" }}>
                  {avgRating.toFixed(1)}
                </p>
                <StarRating rating={Math.round(avgRating)} />
                <p className="text-sm text-gray-400 mt-1">{totalReviews} ביקורות</p>
              </div>

              {/* Distribution bars */}
              <div className="flex-1 w-full space-y-2">
                {ratingDistribution.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-4 text-left">{star}</span>
                    <svg className="w-3 h-3 text-[#B8973A] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-[#B8973A] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-left">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reviews grid */}
        {totalReviews === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-gray-500 font-medium mb-2">אין ביקורות עדיין</h3>
            <p className="text-sm text-gray-400 mb-6">היי הראשונה להשאיר ביקורת!</p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-[#B8973A] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#9A7D2E] transition-colors"
            >
              קבעי תור עכשיו
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {reviews.map((review) => {
              const customerName = review.customer.fullName;
              const initial = customerName?.[0] ?? "?";
              const services = review.appointment?.appointmentServices
                .map((s) => s.serviceNameSnapshot)
                .join(", ");

              return (
                <div
                  key={review.id}
                  className="bg-white border border-[#E8D5C4] rounded-2xl p-5 flex flex-col"
                >
                  {/* Stars */}
                  <div className="flex items-center justify-between mb-3">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                  </div>

                  {/* Text */}
                  {review.text && (
                    <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-4">
                      &ldquo;{review.text}&rdquo;
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#B8973A]/20 flex items-center justify-center text-[#B8973A] font-bold text-sm">
                        {initial}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{customerName}</span>
                    </div>
                    {services && (
                      <span className="text-xs text-gray-400 max-w-[120px] truncate text-left">
                        {services}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-[#B8973A] text-white font-semibold px-8 py-4 rounded-full hover:bg-[#9A7D2E] transition-colors shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            קבעי תור ותצטרפי אלינו
          </Link>
        </div>
      </div>
    </CustomerLayout>
  );
}
