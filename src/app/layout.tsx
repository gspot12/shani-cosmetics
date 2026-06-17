import type { Metadata, Viewport } from "next";
import { Playfair_Display, Heebo } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { getBusinessSettings } from "@/server/actions/admin";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "שני קוסמטיקס | קביעת תורים",
  description: "קביעת תורים אונליין לטיפולי יופי וקוסמטיקה - ציפורניים, גבות, טיפולי פנים ועוד. שני קוסמטיקס - יופי, טיפוח ואלגנטיות בטיפול אישי.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const s = await getBusinessSettings();
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${playfair.variable} ${heebo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SettingsProvider value={{
          businessName: s.businessName,
          phone:        s.phone,
          whatsapp:     s.whatsapp,
          address:      s.address,
          footerText:   s.footerText,
        }}>
          {children}
        </SettingsProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
