import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/server/actions/auth";
import { COOKIE_NAME } from "@/lib/auth";
import AdminLayout from "@/components/layout/AdminLayout";

export const metadata = {
  title: "שני קוסמטיקס | ניהול",
  description: "ממשק ניהול - שני קוסמטיקס",
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const user = await getAdminSession(token);

  if (!user) {
    redirect("/admin/login");
  }

  return <AdminLayout adminName={user.name}>{children}</AdminLayout>;
}
