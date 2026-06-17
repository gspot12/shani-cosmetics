"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDashboardStats } from "@/server/actions/admin";
import type { DashboardStats } from "@/server/actions/admin";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Banknote,
  UserPlus,
  XCircle,
  Clock,
  ListOrdered,
  Plus,
  Ban,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-100 rounded w-24" />
        <div className="w-10 h-10 bg-gray-100 rounded-xl" />
      </div>
      <div className="h-8 bg-gray-100 rounded w-16" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gold?: boolean;
  badge?: number;
  href?: string;
}

function StatCard({ title, value, icon, gold, badge, href }: StatCardProps) {
  const inner = (
    <div
      className={`relative bg-white rounded-2xl border shadow-sm p-5 transition-all duration-200 hover:shadow-md ${
        gold
          ? "border-[#B8973A]/30 bg-gradient-to-br from-[#faf7ef] to-white"
          : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-500 leading-tight">{title}</p>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            gold
              ? "bg-[#B8973A]/15 text-[#B8973A]"
              : "bg-gray-50 text-gray-400"
          }`}
        >
          {icon}
        </div>
      </div>
      <p
        className={`text-3xl font-bold tracking-tight ${
          gold ? "text-[#B8973A]" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-3 left-3 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchStats(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch {
      setError("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const today = new Date().toLocaleDateString("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div dir="rtl" className="space-y-8 max-w-7xl">
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2C2C]">לוח בקרה</h1>
          <p className="text-sm text-gray-400 mt-0.5">{today}</p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          רענון
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error */}
      {/* ------------------------------------------------------------------ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Stats grid */}
      {/* ------------------------------------------------------------------ */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="תורים היום"
            value={stats.todayAppointments}
            icon={<Calendar className="w-5 h-5" />}
            href="/admin/appointments"
          />
          <StatCard
            title="תורים מחר"
            value={stats.tomorrowAppointments}
            icon={<CalendarDays className="w-5 h-5" />}
          />
          <StatCard
            title="תורים השבוע"
            value={stats.thisWeekAppointments}
            icon={<CalendarRange className="w-5 h-5" />}
          />
          <StatCard
            title="הכנסות השבוע"
            value={`₪${stats.estimatedRevenueThisWeek.toLocaleString("he-IL")}`}
            icon={<Banknote className="w-5 h-5" />}
            gold
          />
          <StatCard
            title="לקוחות חדשים"
            value={stats.newCustomersThisWeek}
            icon={<UserPlus className="w-5 h-5" />}
            href="/admin/customers"
          />
          <StatCard
            title="ביטולים"
            value={stats.cancellationsThisWeek}
            icon={<XCircle className="w-5 h-5" />}
          />
          <StatCard
            title="ממתינים לאישור"
            value={stats.pendingApprovalCount}
            icon={<Clock className="w-5 h-5" />}
            badge={stats.pendingApprovalCount}
            href="/admin/appointments"
          />
          <StatCard
            title="רשימת המתנה"
            value={stats.waitlistCount}
            icon={<ListOrdered className="w-5 h-5" />}
            href="/admin/waitlist"
          />
        </div>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Quick actions */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#2C2C2C] mb-4">פעולות מהירות</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/appointments/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2C2C] text-white text-sm font-medium rounded-xl hover:bg-[#3d3d3d] transition-colors"
          >
            <Plus className="w-4 h-4" />
            יצירת תור ידני
          </Link>
          <Link
            href="/admin/availability"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#2C2C2C] border border-[#2C2C2C]/20 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Ban className="w-4 h-4" />
            הוספת חסימה
          </Link>
          <Link
            href="/admin/calendar"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B8973A]/10 text-[#B8973A] border border-[#B8973A]/20 text-sm font-medium rounded-xl hover:bg-[#B8973A]/15 transition-colors"
          >
            <CalendarRange className="w-4 h-4" />
            פתיחת יומן
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Recent appointments today */}
      {/* ------------------------------------------------------------------ */}
      <RecentAppointmentsSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent appointments (fetched from API)
// ---------------------------------------------------------------------------
interface RecentAppointment {
  id: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  totalPrice: number;
  customer: { fullName: string; phone: string };
  staff: { name: string; color: string };
  appointmentServices: Array<{ serviceNameSnapshot: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: "ממתין",
  CONFIRMED: "מאושר",
  RESCHEDULED: "נדחה",
  CANCELLED_BY_CLIENT: "בוטל",
  CANCELLED_BY_ADMIN: "בוטל",
  COMPLETED: "הושלם",
  NO_SHOW: "לא הגיע",
  WAITLISTED: "המתנה",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING_APPROVAL: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  RESCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED_BY_CLIENT: "bg-red-50 text-red-600 border-red-200",
  CANCELLED_BY_ADMIN: "bg-red-50 text-red-600 border-red-200",
  COMPLETED: "bg-gray-50 text-gray-600 border-gray-200",
  NO_SHOW: "bg-orange-50 text-orange-600 border-orange-200",
};

function RecentAppointmentsSection() {
  const [appointments, setAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/admin/appointments?date=${today}&pageSize=5`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setAppointments(data.appointments?.slice(0, 5) ?? []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#2C2C2C]">תורים היום</h2>
        <Link
          href="/admin/appointments"
          className="text-sm text-[#B8973A] hover:underline font-medium"
        >
          כל התורים ←
        </Link>
      </div>

      {loading ? (
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
              <div className="h-6 bg-gray-100 rounded-full w-16" />
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-400 text-sm">אין תורים להיום</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {appointments.map((appt) => {
            const start = new Date(appt.startDateTime).toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const end = new Date(appt.endDateTime).toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const serviceName = appt.appointmentServices[0]?.serviceNameSnapshot ?? "";
            const colorClass = STATUS_COLOR[appt.status] ?? "bg-gray-50 text-gray-600 border-gray-200";

            return (
              <Link
                key={appt.id}
                href={`/admin/appointments/${appt.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
              >
                {/* Staff avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: appt.staff?.color ?? "#B8973A" }}
                >
                  {appt.customer.fullName.charAt(0)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {appt.customer.fullName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {start} – {end}
                    {serviceName ? ` · ${serviceName}` : ""}
                  </p>
                </div>

                {/* Price */}
                <p className="text-sm font-semibold text-gray-700 shrink-0">
                  ₪{appt.totalPrice.toLocaleString("he-IL")}
                </p>

                {/* Status badge */}
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${colorClass}`}
                >
                  {STATUS_LABEL[appt.status] ?? appt.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
