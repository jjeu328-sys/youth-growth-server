import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "비전제일교회 청소년부 | 신앙 성장",
  description: "주님 안에서 행복하게 함께 자라는 비전제일교회 청소년부 성장관리"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
