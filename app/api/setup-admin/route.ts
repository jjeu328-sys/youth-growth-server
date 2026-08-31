import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const secret = req.headers.get("x-setup-secret");
  if (!process.env.ADMIN_SETUP_SECRET || secret !== process.env.ADMIN_SETUP_SECRET) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { username, password, fullName } = await req.json();
  const uname = String(username || "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(uname) || String(password || "").length < 8) {
    return NextResponse.json({ error: "관리자 아이디 또는 비밀번호 형식을 확인하세요." }, { status: 400 });
  }

  const admin = createAdminClient();
  const exists = await admin.from("profiles").select("id").eq("username", uname).maybeSingle();
  if (exists.data) return NextResponse.json({ error: "이미 존재하는 아이디입니다." }, { status: 409 });

  const email = `${crypto.randomUUID()}@accounts.example.com`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) return NextResponse.json({ error: created.error?.message }, { status: 500 });

  const { error } = await admin.from("profiles").insert({
    id: created.data.user.id,
    username: uname,
    internal_email: email,
    full_name: String(fullName || "관리자").trim(),
    role: "admin"
  });
  if (error) {
    await admin.auth.admin.deleteUser(created.data.user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
