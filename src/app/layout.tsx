import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Motty Beats - טופס הזמנה",
  description: "הזמנת סטים ועדכוני תוכנה לאורגנים",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-gradient-to-b from-blue-50 to-white"
        style={{ fontFamily: "Heebo, sans-serif" }}
      >
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">מוטי רוזנפלד</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">עדכוני סאונדים ומקצבים לאורגנים | Yamaha</p>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
