import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // 글로벌 CSS (Tailwind 등)
import { Toaster } from 'sonner'; // Toast 컴포넌트

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bob's SD Resource manager",
  description: "Resource Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
        {/* Toast 알림 컴포넌트 (최상위 배치) */}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}