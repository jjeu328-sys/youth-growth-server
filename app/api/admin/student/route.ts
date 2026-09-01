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

  const body = await req.json();
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const fullName = String(body.fullName || "").trim();
  const grade = String(body.grade || "").trim();
  const className = String(body.className || "").trim();

  if (!fullName || !username || !password) {
    return NextResponse.json({ error: "이름, 아이디, 비밀번호를 입력하세요." }, { status: 400 });
  }
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return NextResponse.json({ error: "아이디는 영문 소문자, 숫자, . _ - 조합 3~30자로 입력하세요." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
  }

  const exists = await ctx.admin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (exists.data) return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });

  const internalEmail = `${crypto.randomUUID()}@accounts.example.com`;
  const created = await ctx.admin.auth.admin.createUser({
    email: internalEmail,
    password,
    email_confirm: true
  });
  if (created.error || !created.data.user) {
    return NextResponse.json({ error: created.error?.message || "계정을 만들 수 없습니다." }, { status: 500 });
  }

  const uid = created.data.user.id;
  const p = await ctx.admin.from("profiles").insert({
    id: uid,
    username,
    internal_email: internalEmail,
    full_name: fullName,
    role: "student"
  });
  if (p.error) {
    await ctx.admin.auth.admin.deleteUser(uid);
    return NextResponse.json({ error: p.error.message }, { status: 500 });
  }

  const s = await ctx.admin.from("students").insert({
    id: uid,
    grade,
    class_name: className,
    active: true
  });
  if (s.error) {
    await ctx.admin.from("profiles").delete().eq("id", uid);
    await ctx.admin.auth.admin.deleteUser(uid);
    return NextResponse.json({ error: s.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
