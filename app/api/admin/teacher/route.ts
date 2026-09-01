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

export async function PATCH(req: Request) {
  const ctx = await requireAdmin(req);
  if (!ctx) return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });

  const { id, username, password, fullName } = await req.json();
  const uid = String(id || "");
  const uname = String(username || "").trim().toLowerCase();
  const name = String(fullName || "").trim();

  if (!uid || !name || !/^[a-z0-9._-]{3,30}$/.test(uname)) {
    return NextResponse.json({ error: "선생님 이름과 아이디 형식을 확인하세요." }, { status: 400 });
  }

  const { data: target } = await ctx.admin.from("profiles").select("id,role").eq("id", uid).maybeSingle();
  if (!target || target.role !== "teacher") return NextResponse.json({ error: "교사 계정을 찾을 수 없습니다." }, { status: 404 });

  const duplicate = await ctx.admin.from("profiles").select("id").eq("username", uname).neq("id", uid).maybeSingle();
  if (duplicate.data) return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });

  const { error: pError } = await ctx.admin.from("profiles").update({ full_name:name, username:uname }).eq("id", uid);
  if (pError) return NextResponse.json({ error: pError.message }, { status: 500 });

  if (String(password || "").length > 0) {
    if (String(password).length < 6) return NextResponse.json({ error: "새 비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
    const { error: aError } = await ctx.admin.auth.admin.updateUserById(uid, { password:String(password) });
    if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });
  }

  return NextResponse.json({ ok:true });
}

export async function DELETE(req: Request) {
  const ctx = await requireAdmin(req);
  if (!ctx) return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const { data: target } = await ctx.admin.from("profiles").select("id,role").eq("id", id).maybeSingle();
  if (!target || target.role !== "teacher") return NextResponse.json({ error: "교사 계정을 찾을 수 없습니다." }, { status: 404 });

  const { error } = await ctx.admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error:error.message }, { status:500 });

  return NextResponse.json({ ok:true });
}
