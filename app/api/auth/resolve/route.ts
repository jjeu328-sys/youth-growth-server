import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { username } = await req.json();
  const value = String(username || "").trim().toLowerCase();
  if (!value) return NextResponse.json({ error: "아이디를 입력하세요." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("internal_email").eq("username", value).maybeSingle();

  // 계정 존재 여부를 과도하게 노출하지 않도록 동일한 오류 형식 사용
  if (!data?.internal_email) return NextResponse.json({ error: "로그인 정보를 확인하세요." }, { status: 404 });
  return NextResponse.json({ email: data.internal_email });
}
