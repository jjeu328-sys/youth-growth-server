import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const admin = createAdminClient();
  const { data: auth } = await admin.auth.getUser(token);
  if (!auth.user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", auth.user.id).single();
  return profile?.role === "admin" ? { admin, user: auth.user } : null;
}

export async function POST(req: Request) {
  const ctx = await requireAdmin(req);
  if (!ctx) return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });

  const { username, password, fullName } = await req.json();
  const uname = String(username || "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(uname) || String(password || "").length < 6 || !String(fullName || "").trim()) {
    return NextResponse.json({ error: "선생님 이름/아이디/비밀번호 형식을 확인하세요." }, { status: 400 });
  }

  const exists = await ctx.admin.from("profiles").select("id").eq("username", uname).maybeSingle();
  if (exists.data) return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });

  const email = `${crypto.randomUUID()}@accounts.example.com`;
  const made = await ctx.admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (made.error || !made.data.user) return NextResponse.json({ error: made.error?.message }, { status: 500 });

  const { error } = await ctx.admin.from("profiles").insert({
    id: made.data.user.id, username: uname, internal_email: email,
    full_name: String(fullName).trim(), role: "teacher"
  });
  if (error) {
    await ctx.admin.auth.admin.deleteUser(made.data.user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
