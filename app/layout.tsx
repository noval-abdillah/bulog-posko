import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Posko Verifikasi & Audit Bansos PBP - Perum BULOG",
  description: "Sistem Posko Verifikasi & Audit Bansos PBP Bulog - Dikembangkan oleh Noval Abdillah",
  authors: [{ name: "Noval Abdillah" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full overflow-hidden antialiased">
      <body className="h-full bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
