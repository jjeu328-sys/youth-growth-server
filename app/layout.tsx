import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "청소년부 신앙 성장",
  description: "청소년부 성장·점수·메달·게시판 관리"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
