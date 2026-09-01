"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Role = "admin" | "teacher" | "student";
type Profile = { id:string; username:string; full_name:string; role:Role };
type Student = {
  id:string; grade:string; class_name:string; active:boolean;
  service?:boolean; nt_read?:boolean; discipleship?:boolean; ot_read?:boolean; evangelism?:boolean;
  profiles?:Profile | Profile[];
};
type Activity = { id:number; student_id:string; points:number; icon:string; reason:string; category:string; created_at:string };
type Post = { id:number; author_id:string; title:string; body:string; created_at:string; profiles?:Profile; comments?:CommentRow[]; post_media?:MediaRow[] };
type CommentRow = { id:number; post_id:number; author_id:string; body:string; created_at:string; profiles?:Profile };
type MediaRow = { id:number; post_id:number; path:string; media_type:string };
type SiteSettings = { dashboard_title:string; dashboard_subtitle:string; dashboard_notice:string };

const supabase = createClient();
const SCORE_OPTIONS = [{p:1,i:"○"},{p:2,i:"●"},{p:4,i:"☆"},{p:8,i:"★"}];
const DEFAULT_SETTINGS:SiteSettings = {
  dashboard_title:"청소년부 신앙 성장",
  dashboard_subtitle:"점수보다 성장, 경쟁보다 격려",
  dashboard_notice:""
};

export default function Home() {
  const [me,setMe]=useState<Profile|null>(null);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState("dashboard");
  const [students,setStudents]=useState<Student[]>([]);
  const [activities,setActivities]=useState<Activity[]>([]);
  const [posts,setPosts]=useState<Post[]>([]);
  const [settings,setSettings]=useState<SiteSettings>(DEFAULT_SETTINGS);
  const [selectedPost,setSelectedPost]=useState<Post|null>(null);
  const [writing,setWriting]=useState(false);
  const [collapsed,setCollapsed]=useState(false);

  useEffect(()=>{
    if(typeof window!=="undefined" && window.innerWidth<900) setCollapsed(true);
    boot();
  },[]);

  async function boot(){
    const {data:{session}}=await supabase.auth.getSession();
    if(session) await loadMe(session.user.id);
    setLoading(false);
  }
  async function loadMe(uid:string){
    const {data}=await supabase.from("profiles").select("id,username,full_name,role").eq("id",uid).single();
    if(data){const profile=data as Profile;setMe(profile);await refresh(profile);}
  }
  async function refresh(profile=me){
    if(!profile)return;
    const [{data:ss},{data:aa},{data:pp},{data:cfg}]=await Promise.all([
      supabase.from("students").select("id,grade,class_name,active,service,nt_read,discipleship,ot_read,evangelism,profiles!students_id_fkey(id,username,full_name,role)").order("created_at"),
      supabase.from("activities").select("*").order("created_at",{ascending:false}),
      supabase.from("posts").select("*,profiles!posts_author_id_fkey(id,username,full_name,role),comments(*,profiles!comments_author_id_fkey(id,username,full_name,role)),post_media(*)").order("created_at",{ascending:false}),
      supabase.from("site_settings").select("dashboard_title,dashboard_subtitle,dashboard_notice").eq("id",1).maybeSingle()
    ]);
    setStudents((ss||[]) as unknown as Student[]);
    setActivities((aa||[]) as Activity[]);
    setPosts((pp||[]) as unknown as Post[]);
    if(cfg) setSettings(cfg as SiteSettings);
  }
  async function logout(){await supabase.auth.signOut();setMe(null);setStudents([]);setActivities([]);setPosts([]);}

  if(loading)return <main className="center"><div className="card">불러오는 중…</div></main>;
  if(!me)return <Auth onLogin={loadMe}/>;

  const nav = me.role==="admin"
    ? [["dashboard","🏠","대시보드"],["students","👥","학생 관리"],["score","✦","점수 입력"],["medals","🏅","메달 관리"],["board","💬","게시판"],["ranking","🏆","전체 비교"],["settings","⚙","설정"]]
    : me.role==="teacher"
    ? [["dashboard","🏠","선생님 홈"],["score","✦","점수 입력"],["medals","🏅","메달 현황"],["board","💬","게시판"],["ranking","🏆","전체 비교"]]
    : [["dashboard","🌱","나의 성장"],["medals","🏅","메달"],["board","💬","게시판"],["ranking","🏆","전체 비교"]];

  return <div className={`app ${collapsed?"navCollapsed":""}`}>
    <aside className="side">
      <div className="sideTop">
        <div className="brand"><span className="brandIcon">✦</span><span className="brandText">청소년부 성장관리</span></div>
        <button className="collapseBtn" aria-label="메뉴 접기/펼치기" onClick={()=>setCollapsed(v=>!v)}>{collapsed?"›":"‹"}</button>
      </div>
      <div className="nav">
        {nav.map(([id,icon,label])=><button title={label} key={id} className={page===id?"active":""} onClick={()=>{setPage(id);setSelectedPost(null);setWriting(false)}}>
          <span className="navIcon">{icon}</span><span className="navLabel">{label}</span>
        </button>)}
        <button title="로그아웃" onClick={logout}><span className="navIcon">↩</span><span className="navLabel">로그아웃</span></button>
      </div>
    </aside>
    <main className="main">
      {page==="dashboard" && <Dashboard me={me} students={students} activities={activities} settings={settings} onDone={()=>refresh()}/>}
      {page==="students" && me.role==="admin" && <StudentsAdmin students={students} onDone={()=>refresh()}/>}
      {page==="score" && (me.role==="admin"||me.role==="teacher") && <ScorePage students={students} activities={activities} me={me} onDone={()=>refresh()}/>}
      {page==="medals" && <Medals me={me} students={students} activities={activities}/>}
      {page==="ranking" && <Ranking students={students} activities={activities} me={me}/>}
      {page==="board" && <Board me={me} posts={posts} selected={selectedPost} setSelected={setSelectedPost} writing={writing} setWriting={setWriting} onDone={()=>refresh()}/>}
      {page==="settings" && me.role==="admin" && <Settings/>}
    </main>
  </div>;
}

function Auth({onLogin}:{onLogin:(uid:string)=>Promise<void>}){
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [msg,setMsg]=useState("");
  async function login(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg("");
    const f=new FormData(e.currentTarget), username=String(f.get("username")||""), password=String(f.get("password")||"");
    const r=await fetch("/api/auth/resolve",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username})});
    const j=await r.json(); if(!r.ok)return setMsg(j.error||"로그인 실패");
    const {data,error}=await supabase.auth.signInWithPassword({email:j.email,password});
    if(error||!data.user)return setMsg("아이디 또는 비밀번호를 확인하세요.");
    await onLogin(data.user.id);
  }
  async function signup(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg("");
    const f=new FormData(e.currentTarget), body=Object.fromEntries(f.entries());
    if(body.password!==body.password2)return setMsg("비밀번호가 서로 다릅니다.");
    const r=await fetch("/api/auth/signup",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const j=await r.json(); if(!r.ok)return setMsg(j.error||"회원가입 실패");
    setMsg("회원가입이 완료되었습니다. 로그인해 주세요.");setMode("login");
  }
  return <main className="auth"><div className="authbox"><div className="logo">🌱</div><h1>청소년부 신앙 성장</h1><p className="sub">점수보다 성장, 경쟁보다 격려</p>
    <div className="tabs"><button type="button" className={mode==="login"?"active":""} onClick={()=>setMode("login")}>로그인</button><button type="button" className={mode==="signup"?"active":""} onClick={()=>setMode("signup")}>회원가입</button></div>
    {mode==="login"?<form onSubmit={login}><Field label="아이디" name="username"/><Field label="비밀번호" name="password" type="password"/><button className="btn full">로그인</button></form>
    :<form onSubmit={signup}><Field label="이름" name="fullName"/><div className="formgrid"><Field label="학년" name="grade"/><Field label="반" name="className"/></div><Field label="아이디" name="username"/><Field label="비밀번호" name="password" type="password"/><Field label="비밀번호 확인" name="password2" type="password"/><button className="btn full">학생 회원가입</button></form>}
    {msg&&<div className="notice">{msg}</div>}
  </div></main>
}
function Field({label,name,type="text",defaultValue=""}:{label:string;name:string;type?:string;defaultValue?:string}) {
  return <label className="field"><span>{label}</span><input className="input" name={name} type={type} defaultValue={defaultValue} required={["username","password","fullName"].includes(name)}/></label>
}

function totalFor(id:string, acts:Activity[]){return acts.filter(a=>a.student_id===id).reduce((n,a)=>n+a.points,0)}
function profileOf(s:Student){return Array.isArray(s.profiles)?s.profiles[0]:s.profiles}
function medalFor(id:string, acts:Activity[]){const p=totalFor(id,acts);return p>=120?"🥇":p>=80?"🥈":p>=40?"🥉":"🌱"}

function Dashboard({me,students,activities,settings,onDone}:{me:Profile;students:Student[];activities:Activity[];settings:SiteSettings;onDone:()=>void}){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(settings);
  useEffect(()=>setDraft(settings),[settings]);

  async function saveDashboard(){
    const {error}=await supabase.from("site_settings").update({
      dashboard_title:draft.dashboard_title.trim()||DEFAULT_SETTINGS.dashboard_title,
      dashboard_subtitle:draft.dashboard_subtitle.trim(),
      dashboard_notice:draft.dashboard_notice.trim(),
      updated_by:me.id,
      updated_at:new Date().toISOString()
    }).eq("id",1);
    if(error)return alert(error.message);
    setEditing(false);onDone();
  }

  if(me.role==="student"){
    const s=students.find(s=>s.id===me.id), total=totalFor(me.id,activities);
    return <>
      <Header title={`🌱 ${settings.dashboard_title}`} sub={`${me.full_name} · ${s?.grade||""} ${s?.class_name||""}`}/>
      {settings.dashboard_notice&&<div className="announcement">📢 {settings.dashboard_notice}</div>}
      <div className="card"><div className="muted">현재 총점</div><div className="bigscore">{total}점</div><div className="stars">{activities.filter(a=>a.student_id===me.id).map(a=>a.icon).join(" ")||"아직 점수가 없습니다."}</div></div>
      <div className="grid2"><div className="card"><h3>현재 메달</h3><div className="medalBig">{medalFor(me.id,activities)}</div></div><div className="card"><h3>최근 활동</h3>{activities.filter(a=>a.student_id===me.id).slice(0,8).map(a=><Row key={a.id} left={a.reason} right={`${a.icon} +${a.points}`}/>)}</div></div>
    </>;
  }

  const active=students.filter(s=>s.active), avg=active.length?Math.round(active.reduce((n,s)=>n+totalFor(s.id,activities),0)/active.length):0;
  return <>
    <div className="top">
      <div className="title"><h1>{me.role==="admin"?settings.dashboard_title:"선생님 홈"}</h1><p>{settings.dashboard_subtitle||"학생들의 성장을 확인하고 기록하세요."}</p></div>
      {me.role==="admin"&&<button className="btn gray" onClick={()=>setEditing(v=>!v)}>✏️ 대시보드 편집</button>}
    </div>
    {settings.dashboard_notice&&<div className="announcement">📢 {settings.dashboard_notice}</div>}
    {editing&&<div className="card editor">
      <h3>대시보드 문구 편집</h3>
      <label className="field"><span>대시보드 제목</span><input className="input" value={draft.dashboard_title} onChange={e=>setDraft({...draft,dashboard_title:e.target.value})}/></label>
      <label className="field"><span>부제목</span><input className="input" value={draft.dashboard_subtitle} onChange={e=>setDraft({...draft,dashboard_subtitle:e.target.value})}/></label>
      <label className="field"><span>전체 공지</span><textarea className="input textarea smallTextArea" value={draft.dashboard_notice} onChange={e=>setDraft({...draft,dashboard_notice:e.target.value})} placeholder="학생과 선생님에게 보여줄 공지"/></label>
      <div className="actions"><button className="btn" onClick={saveDashboard}>저장</button><button className="btn gray" onClick={()=>{setDraft(settings);setEditing(false)}}>취소</button></div>
    </div>}
    <div className="grid"><Stat t="학생" v={`${active.length}명`}/><Stat t="평균 점수" v={`${avg}점`}/><Stat t="동메달 이상" v={`${active.filter(s=>totalFor(s.id,activities)>=40).length}명`}/><Stat t="점수 기록" v={`${activities.length}건`}/></div>
    <div className="card mt"><h3>🏆 현재 순위</h3>{active.slice().sort((a,b)=>totalFor(b.id,activities)-totalFor(a.id,activities)).slice(0,7).map((s,i)=><Row key={s.id} left={`${i+1}위 ${profileOf(s)?.full_name||"학생"}`} right={`${totalFor(s.id,activities)}점`}/>)}</div>
  </>;
}
function Header({title,sub}:{title:string;sub?:string}){return <div className="top"><div className="title"><h1>{title}</h1>{sub&&<p>{sub}</p>}</div></div>}
function Stat({t,v}:{t:string;v:string}){return <div className="card"><div className="muted">{t}</div><div className="num">{v}</div></div>}
function Row({left,right}:{left:string;right:string}){return <div className="row"><span>{left}</span><b>{right}</b></div>}

function StudentsAdmin({students,onDone}:{students:Student[];onDone:()=>void}){
  const [showStudentForm,setShowStudentForm]=useState(false);
  const [student,setStudent]=useState({fullName:"",grade:"",className:"",username:"",password:""});
  const [teacher,setTeacher]=useState({fullName:"",username:"",password:""});

  async function authHeaders(){
    const {data:{session}}=await supabase.auth.getSession();
    return session?{"content-type":"application/json","authorization":`Bearer ${session.access_token}`}:null;
  }
  async function addStudent(){
    const headers=await authHeaders(); if(!headers)return;
    const r=await fetch("/api/admin/student",{method:"POST",headers,body:JSON.stringify(student)});
    const j=await r.json(); if(!r.ok)return alert(j.error||"학생 등록 실패");
    alert("학생이 등록되었습니다.");
    setStudent({fullName:"",grade:"",className:"",username:"",password:""});setShowStudentForm(false);onDone();
  }
  async function addTeacher(){
    const headers=await authHeaders(); if(!headers)return;
    const r=await fetch("/api/admin/teacher",{method:"POST",headers,body:JSON.stringify(teacher)});
    const j=await r.json(); if(!r.ok)return alert(j.error||"생성 실패");
    alert("선생님 계정이 생성되었습니다.");setTeacher({fullName:"",username:"",password:""});onDone();
  }
  async function editStudent(s:Student){
    const current=profileOf(s);
    const name=prompt("학생 이름",current?.full_name||""); if(name===null)return;
    const grade=prompt("학년",s.grade||""); if(grade===null)return;
    const cls=prompt("반",s.class_name||""); if(cls===null)return;
    const active=confirm("활동 중인 학생으로 설정할까요?\n확인=활동 / 취소=비활동");
    const {error:e1}=await supabase.from("profiles").update({full_name:name.trim()}).eq("id",s.id);
    const {error:e2}=await supabase.from("students").update({grade:grade.trim(),class_name:cls.trim(),active}).eq("id",s.id);
    if(e1||e2)return alert(e1?.message||e2?.message);onDone();
  }

  return <>
    <div className="top"><div className="title"><h1>👥 학생 관리</h1><p>학생을 직접 등록하고 정보를 수정할 수 있습니다.</p></div><button className="btn" onClick={()=>setShowStudentForm(v=>!v)}>+ 학생 등록</button></div>
    {showStudentForm&&<div className="card editor">
      <h3>새 학생 등록</h3>
      <div className="formgrid">
        <input className="input" placeholder="학생 이름" value={student.fullName} onChange={e=>setStudent({...student,fullName:e.target.value})}/>
        <input className="input" placeholder="학년 (예: 중2)" value={student.grade} onChange={e=>setStudent({...student,grade:e.target.value})}/>
        <input className="input" placeholder="반 (예: 1반)" value={student.className} onChange={e=>setStudent({...student,className:e.target.value})}/>
        <input className="input" placeholder="로그인 아이디" value={student.username} onChange={e=>setStudent({...student,username:e.target.value.toLowerCase()})}/>
        <input className="input" type="password" placeholder="초기 비밀번호 (6자 이상)" value={student.password} onChange={e=>setStudent({...student,password:e.target.value})}/>
      </div>
      <div className="actions mtSmall"><button className="btn" onClick={addStudent}>학생 등록하기</button><button className="btn gray" onClick={()=>setShowStudentForm(false)}>취소</button></div>
    </div>}
    <div className="card"><div className="tablewrap"><table><thead><tr><th>이름</th><th>학년/반</th><th>아이디</th><th>상태</th><th></th></tr></thead><tbody>{students.map(s=><tr key={s.id}><td>{profileOf(s)?.full_name}</td><td>{s.grade} / {s.class_name}</td><td>{profileOf(s)?.username}</td><td>{s.active?"활동":"비활동"}</td><td><button className="btn gray compactBtn" onClick={()=>editStudent(s)}>정보 수정</button></td></tr>)}</tbody></table></div></div>
    <div className="card mt"><h3>+ 선생님 계정</h3><div className="formgrid"><input className="input" placeholder="선생님 이름" value={teacher.fullName} onChange={e=>setTeacher({...teacher,fullName:e.target.value})}/><input className="input" placeholder="아이디" value={teacher.username} onChange={e=>setTeacher({...teacher,username:e.target.value.toLowerCase()})}/><input className="input" type="password" placeholder="비밀번호" value={teacher.password} onChange={e=>setTeacher({...teacher,password:e.target.value})}/></div><button className="btn mtSmall" onClick={addTeacher}>선생님 추가</button></div>
  </>;
}

function ScorePage({students,activities,me,onDone}:{students:Student[];activities:Activity[];me:Profile;onDone:()=>void}){
  const active=students.filter(s=>s.active),[sid,setSid]=useState(active[0]?.id||""),[reason,setReason]=useState(""),[category,setCategory]=useState("자유점수");
  async function give(p:number,icon:string){
    if(!sid||!reason.trim())return alert("학생과 점수 사유를 입력하세요.");
    const {error}=await supabase.from("activities").insert({student_id:sid,giver_id:me.id,points:p,icon,reason:reason.trim(),category:category.trim()||"자유점수"});
    if(error)return alert(error.message);setReason("");onDone();
  }
  return <><Header title="✦ 점수 입력" sub="관리자와 선생님이 1·2·4·8점을 자유롭게 줄 수 있습니다."/><div className="card"><div className="formgrid"><label className="field"><span>학생</span><select className="input" value={sid} onChange={e=>setSid(e.target.value)}>{active.map(s=><option key={s.id} value={s.id}>{profileOf(s)?.full_name} ({totalFor(s.id,activities)}점)</option>)}</select></label><label className="field"><span>점수 사유</span><input className="input" value={reason} onChange={e=>setReason(e.target.value)} placeholder="예: 친구를 도와줌"/></label></div><label className="field"><span>분류</span><input className="input" value={category} onChange={e=>setCategory(e.target.value)}/></label><div className="scoregrid">{SCORE_OPTIONS.map(x=><button className="score" key={x.p} onClick={()=>give(x.p,x.i)}>{x.i} <small>{x.p}점</small></button>)}</div></div></>;
}

function Medals({me,students,activities}:{me:Profile;students:Student[];activities:Activity[]}){
  const list=me.role==="student"?students.filter(s=>s.id===me.id):students.filter(s=>s.active);
  return <><Header title={me.role==="student"?"🏅 나의 메달":"🏅 메달 현황"} sub="동 40점 · 은 80점 · 금 120점"/><div className="card">{list.map(s=><Row key={s.id} left={`${profileOf(s)?.full_name||""} · ${totalFor(s.id,activities)}점`} right={medalFor(s.id,activities)}/>)}</div></>;
}
function Ranking({students,activities,me}:{students:Student[];activities:Activity[];me:Profile}){
  const list=students.filter(s=>s.active).slice().sort((a,b)=>totalFor(b.id,activities)-totalFor(a.id,activities));
  return <><Header title="🏆 전체 비교" sub="현재 누적 점수 기준"/><div className="card">{list.map((s,i)=><Row key={s.id} left={`${i+1}위 ${profileOf(s)?.full_name||""}${s.id===me.id?" (나)":""}`} right={`${medalFor(s.id,activities)} ${totalFor(s.id,activities)}점`}/>)}</div></>;
}

function Board({me,posts,selected,setSelected,writing,setWriting,onDone}:{me:Profile;posts:Post[];selected:Post|null;setSelected:(p:Post|null)=>void;writing:boolean;setWriting:(b:boolean)=>void;onDone:()=>void}){
  if(writing)return <PostWriter me={me} onCancel={()=>setWriting(false)} onDone={async()=>{setWriting(false);await onDone();}}/>;
  if(selected){const fresh=posts.find(p=>p.id===selected.id)||selected;return <PostDetail me={me} post={fresh} onBack={()=>setSelected(null)} onDone={onDone}/>;}
  return <><div className="top"><div className="title"><h1>💬 청소년부 게시판</h1><p>서로의 글을 읽고 댓글로 대화할 수 있습니다.</p></div><button className="btn" onClick={()=>setWriting(true)}>✏️ 글쓰기</button></div><div className="boardlist">{posts.map(p=><button key={p.id} className="postcard" onClick={()=>setSelected(p)}><b>{p.title}</b><span>{p.profiles?.full_name||"사용자"} · 댓글 {p.comments?.length||0} · 첨부 {p.post_media?.length||0}</span><p>{p.body}</p></button>)}{!posts.length&&<div className="card">아직 게시글이 없습니다.</div>}</div></>;
}
function PostWriter({me,onCancel,onDone}:{me:Profile;onCancel:()=>void;onDone:()=>void}){
  const [title,setTitle]=useState(""),[body,setBody]=useState(""),[files,setFiles]=useState<File[]>([]),[busy,setBusy]=useState(false);
  async function submit(){
    if(!title.trim()||!body.trim())return alert("제목과 내용을 입력하세요.");
    setBusy(true);
    const {data:post,error}=await supabase.from("posts").insert({author_id:me.id,title:title.trim(),body:body.trim()}).select("id").single();
    if(error||!post){setBusy(false);return alert(error?.message||"게시글 저장 실패");}
    for(const file of files){
      if(file.size>50*1024*1024){alert(`${file.name}: 50MB를 초과해 제외했습니다.`);continue;}
      const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
      const path=`${me.id}/${post.id}/${crypto.randomUUID()}-${safe}`;
      const up=await supabase.storage.from("board-media").upload(path,file,{contentType:file.type,upsert:false});
      if(up.error){alert(`${file.name} 업로드 실패: ${up.error.message}`);continue;}
      await supabase.from("post_media").insert({post_id:post.id,uploader_id:me.id,path,media_type:file.type});
    }
    setBusy(false);onDone();
  }
  return <><button className="btn gray" onClick={onCancel}>← 게시판</button><div className="card mt"><h2>✏️ 글쓰기</h2><label className="field"><span>제목</span><input className="input" value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="field"><span>내용</span><textarea className="input textarea" value={body} onChange={e=>setBody(e.target.value)}/></label><label className="field"><span>사진 / 영상</span><input className="input" type="file" multiple accept="image/*,video/*" onChange={e=>setFiles(Array.from(e.target.files||[]))}/></label><div className="muted">{files.map(f=>f.name).join(" · ")}</div><button className="btn mtSmall" disabled={busy} onClick={submit}>{busy?"업로드 중…":"게시하기"}</button></div></>;
}
function PostDetail({me,post,onBack,onDone}:{me:Profile;post:Post;onBack:()=>void;onDone:()=>void}){
  const [comment,setComment]=useState("");
  async function addComment(){if(!comment.trim())return;const {error}=await supabase.from("comments").insert({post_id:post.id,author_id:me.id,body:comment.trim()});if(error)return alert(error.message);setComment("");await onDone();}
  async function deletePost(){if(!confirm("이 글을 삭제할까요?"))return;const paths=(post.post_media||[]).map(m=>m.path);if(paths.length)await supabase.storage.from("board-media").remove(paths);const {error}=await supabase.from("posts").delete().eq("id",post.id);if(error)return alert(error.message);await onDone();onBack();}
  return <><button className="btn gray" onClick={onBack}>← 목록</button><article className="card mt"><div className="posthead"><div><h2>{post.title}</h2><div className="muted">{post.profiles?.full_name||"사용자"} · {new Date(post.created_at).toLocaleString("ko-KR")}</div></div>{(me.role==="admin"||me.id===post.author_id)&&<button className="btn red" onClick={deletePost}>삭제</button>}</div><p className="postbody">{post.body}</p><div className="media">{(post.post_media||[]).map(m=><Media key={m.id} row={m}/>)}</div><div className="comments"><h3>댓글 {post.comments?.length||0}</h3>{post.comments?.map(c=><div className="comment" key={c.id}><b>{c.profiles?.full_name||"사용자"}</b><p>{c.body}</p></div>)}<div className="commentform"><input className="input" value={comment} onChange={e=>setComment(e.target.value)} placeholder="댓글을 입력하세요"/><button className="btn" onClick={addComment}>댓글</button></div></div></article></>;
}
function Media({row}:{row:MediaRow}){
  const [url,setUrl]=useState("");
  useEffect(()=>{const {data}=supabase.storage.from("board-media").getPublicUrl(row.path);setUrl(data.publicUrl)},[row.path]);
  if(!url)return null;
  return row.media_type.startsWith("video/")?<video controls src={url}/>:<img src={url} alt="게시글 첨부"/>;
}
function Settings(){return <><Header title="⚙ 설정"/><div className="card"><h3>권한</h3><Row left="관리자" right="전체 관리"/><Row left="선생님" right="점수·메달·게시판"/><Row left="학생" right="나의 성장·메달·게시판·순위"/></div></>}
