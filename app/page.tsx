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
type Activity = { id:number; student_id:string; giver_id:string; points:number; icon:string; reason:string; category:string; created_at:string };
type Post = { id:number; author_id:string; title:string; body:string; created_at:string; view_count:number; profiles?:Profile; comments?:CommentRow[]; post_media?:MediaRow[] };
type CommentRow = { id:number; post_id:number; author_id:string; body:string; created_at:string; profiles?:Profile };
type MediaRow = { id:number; post_id:number; path:string; media_type:string };
type SiteSettings = {
  dashboard_title:string; dashboard_subtitle:string; dashboard_notice:string;
  home_view_count:number; home_today_view_count:number; home_view_date:string;
};
type FaithCheck = {
  id:number; student_id:string; check_date:string; bible_reading:boolean; prayer:boolean;
  qt:boolean; worship:boolean; note:string; checked_by:string|null; created_at:string; updated_at:string;
};
type BibleChapterCheck = {
  id:number; student_id:string; book_code:string; chapter:number; read_on:string;
  checked_by:string|null; created_at:string;
};
type DailyFaithComparison = {
  student_id:string; check_date:string; bible_reading:boolean; prayer:boolean; qt:boolean; worship:boolean;
};
type BibleBook = { code:string; name:string; testament:"old"|"new"; chapters:number };
type FaithHabitKey = "bible_reading"|"prayer"|"qt"|"worship";

const supabase = createClient();
const SCORE_OPTIONS = [{p:1,i:"○"},{p:2,i:"●"},{p:4,i:"☆"},{p:8,i:"★"}];
const BIBLE_BOOKS:BibleBook[] = [
  {code:"GEN",name:"창세기",testament:"old",chapters:50},{code:"EXO",name:"출애굽기",testament:"old",chapters:40},
  {code:"LEV",name:"레위기",testament:"old",chapters:27},{code:"NUM",name:"민수기",testament:"old",chapters:36},
  {code:"DEU",name:"신명기",testament:"old",chapters:34},{code:"JOS",name:"여호수아",testament:"old",chapters:24},
  {code:"JDG",name:"사사기",testament:"old",chapters:21},{code:"RUT",name:"룻기",testament:"old",chapters:4},
  {code:"1SA",name:"사무엘상",testament:"old",chapters:31},{code:"2SA",name:"사무엘하",testament:"old",chapters:24},
  {code:"1KI",name:"열왕기상",testament:"old",chapters:22},{code:"2KI",name:"열왕기하",testament:"old",chapters:25},
  {code:"1CH",name:"역대상",testament:"old",chapters:29},{code:"2CH",name:"역대하",testament:"old",chapters:36},
  {code:"EZR",name:"에스라",testament:"old",chapters:10},{code:"NEH",name:"느헤미야",testament:"old",chapters:13},
  {code:"EST",name:"에스더",testament:"old",chapters:10},{code:"JOB",name:"욥기",testament:"old",chapters:42},
  {code:"PSA",name:"시편",testament:"old",chapters:150},{code:"PRO",name:"잠언",testament:"old",chapters:31},
  {code:"ECC",name:"전도서",testament:"old",chapters:12},{code:"SNG",name:"아가",testament:"old",chapters:8},
  {code:"ISA",name:"이사야",testament:"old",chapters:66},{code:"JER",name:"예레미야",testament:"old",chapters:52},
  {code:"LAM",name:"예레미야애가",testament:"old",chapters:5},{code:"EZK",name:"에스겔",testament:"old",chapters:48},
  {code:"DAN",name:"다니엘",testament:"old",chapters:12},{code:"HOS",name:"호세아",testament:"old",chapters:14},
  {code:"JOL",name:"요엘",testament:"old",chapters:3},{code:"AMO",name:"아모스",testament:"old",chapters:9},
  {code:"OBA",name:"오바댜",testament:"old",chapters:1},{code:"JON",name:"요나",testament:"old",chapters:4},
  {code:"MIC",name:"미가",testament:"old",chapters:7},{code:"NAM",name:"나훔",testament:"old",chapters:3},
  {code:"HAB",name:"하박국",testament:"old",chapters:3},{code:"ZEP",name:"스바냐",testament:"old",chapters:3},
  {code:"HAG",name:"학개",testament:"old",chapters:2},{code:"ZEC",name:"스가랴",testament:"old",chapters:14},
  {code:"MAL",name:"말라기",testament:"old",chapters:4},{code:"MAT",name:"마태복음",testament:"new",chapters:28},
  {code:"MRK",name:"마가복음",testament:"new",chapters:16},{code:"LUK",name:"누가복음",testament:"new",chapters:24},
  {code:"JHN",name:"요한복음",testament:"new",chapters:21},{code:"ACT",name:"사도행전",testament:"new",chapters:28},
  {code:"ROM",name:"로마서",testament:"new",chapters:16},{code:"1CO",name:"고린도전서",testament:"new",chapters:16},
  {code:"2CO",name:"고린도후서",testament:"new",chapters:13},{code:"GAL",name:"갈라디아서",testament:"new",chapters:6},
  {code:"EPH",name:"에베소서",testament:"new",chapters:6},{code:"PHP",name:"빌립보서",testament:"new",chapters:4},
  {code:"COL",name:"골로새서",testament:"new",chapters:4},{code:"1TH",name:"데살로니가전서",testament:"new",chapters:5},
  {code:"2TH",name:"데살로니가후서",testament:"new",chapters:3},{code:"1TI",name:"디모데전서",testament:"new",chapters:6},
  {code:"2TI",name:"디모데후서",testament:"new",chapters:4},{code:"TIT",name:"디도서",testament:"new",chapters:3},
  {code:"PHM",name:"빌레몬서",testament:"new",chapters:1},{code:"HEB",name:"히브리서",testament:"new",chapters:13},
  {code:"JAS",name:"야고보서",testament:"new",chapters:5},{code:"1PE",name:"베드로전서",testament:"new",chapters:5},
  {code:"2PE",name:"베드로후서",testament:"new",chapters:3},{code:"1JN",name:"요한일서",testament:"new",chapters:5},
  {code:"2JN",name:"요한이서",testament:"new",chapters:1},{code:"3JN",name:"요한삼서",testament:"new",chapters:1},
  {code:"JUD",name:"유다서",testament:"new",chapters:1},{code:"REV",name:"요한계시록",testament:"new",chapters:22}
];
const FAITH_HABITS:{key:FaithHabitKey;icon:string;label:string;description:string}[] = [
  {key:"bible_reading",icon:"📖",label:"성경읽기",description:"하나님의 말씀을 읽었어요"},
  {key:"prayer",icon:"🙏",label:"기도",description:"하나님께 마음을 나누었어요"},
  {key:"qt",icon:"🌿",label:"큐티",description:"말씀을 묵상하고 적용했어요"},
  {key:"worship",icon:"⛪",label:"예배 참석",description:"공동체 예배에 참여했어요"}
];
const DEFAULT_SETTINGS:SiteSettings = {
  dashboard_title:"비전제일교회 청소년부",
  dashboard_subtitle:"주님 안에서 함께 웃고, 믿음으로 자라요",
  dashboard_notice:"",
  home_view_count:0,
  home_today_view_count:0,
  home_view_date:""
};

function getViewKey(){
  if(typeof window==="undefined")return "";
  try{
    const storageKey="joyful-youth-view-session";
    const saved=sessionStorage.getItem(storageKey);
    if(saved)return saved;
    const created=crypto.randomUUID();
    sessionStorage.setItem(storageKey,created);
    return created;
  }catch{return "";}
}
async function recordView(target:"home"|"post",postId?:number){
  const viewKey=getViewKey();
  if(!viewKey)return null;
  try{
    const response=await fetch("/api/analytics/view",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({viewKey,target,postId})
    });
    if(!response.ok)return null;
    const result=await response.json();
    return Number(result.viewCount||0);
  }catch{return null;}
}

export default function Home() {
  const [me,setMe]=useState<Profile|null>(null);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState("dashboard");
  const [students,setStudents]=useState<Student[]>([]);
  const [teachers,setTeachers]=useState<Profile[]>([]);
  const [activities,setActivities]=useState<Activity[]>([]);
  const [faithChecks,setFaithChecks]=useState<FaithCheck[]>([]);
  const [bibleChecks,setBibleChecks]=useState<BibleChapterCheck[]>([]);
  const [faithDbState,setFaithDbState]=useState<"checking"|"ready"|"missing">("checking");
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
    await recordView("home");
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
    const [studentResult,teacherResult,activityResult,postResult,settingsResult,faithResult,bibleResult]=await Promise.all([
      supabase.from("students").select("id,grade,class_name,active,service,nt_read,discipleship,ot_read,evangelism,profiles!students_id_fkey(id,username,full_name,role)").order("created_at"),
      supabase.from("profiles").select("id,username,full_name,role").eq("role","teacher").order("created_at"),
      supabase.from("activities").select("*").order("created_at",{ascending:false}),
      supabase.from("posts").select("*,profiles!posts_author_id_fkey(id,username,full_name,role),comments(*,profiles!comments_author_id_fkey(id,username,full_name,role)),post_media(*)").order("created_at",{ascending:false}),
      supabase.from("site_settings").select("*").eq("id",1).maybeSingle(),
      supabase.from("faith_checks").select("*").order("check_date",{ascending:false}),
      supabase.from("bible_chapter_checks").select("*").order("created_at",{ascending:false})
    ]);
    const {data:ss}=studentResult,{data:tt}=teacherResult,{data:aa}=activityResult,{data:pp}=postResult,{data:cfg}=settingsResult,{data:ff}=faithResult,{data:bb}=bibleResult;
    setStudents((ss||[]) as unknown as Student[]);
    setTeachers((tt||[]) as Profile[]);
    setActivities((aa||[]) as Activity[]);
    setFaithChecks((ff||[]) as FaithCheck[]);
    setBibleChecks((bb||[]) as BibleChapterCheck[]);
    setFaithDbState(faithResult.error||bibleResult.error?"missing":"ready");
    setPosts((pp||[]) as unknown as Post[]);
    if(cfg) setSettings({...DEFAULT_SETTINGS,...cfg} as SiteSettings);
  }
  async function logout(){await supabase.auth.signOut();setMe(null);setStudents([]);setTeachers([]);setActivities([]);setFaithChecks([]);setBibleChecks([]);setFaithDbState("checking");setPosts([]);}

  if(loading)return <main className="center"><div className="card">불러오는 중…</div></main>;
  if(!me)return <Auth onLogin={loadMe}/>;

  const nav = me.role==="admin"
    ? [["dashboard","🏠","대시보드"],["students","👥","학생 관리"],["faith","🙏","신앙 체크"],["score","✦","점수 입력"],["history","📋","점수 내역"],["medals","🏅","메달 관리"],["board","💬","게시판"],["ranking","🏆","전체 비교"],["settings","⚙","설정"]]
    : me.role==="teacher"
    ? [["dashboard","🏠","선생님 홈"],["students","👥","학생 관리"],["faith","🙏","신앙 체크"],["score","✦","점수 입력"],["history","📋","점수 내역"],["medals","🏅","메달 현황"],["board","💬","게시판"],["ranking","🏆","전체 비교"]]
    : [["dashboard","🌱","나의 성장"],["faith","🙏","신앙 체크"],["history","📋","나의 점수"],["medals","🏅","메달"],["board","💬","게시판"],["ranking","🏆","전체 비교"]];

  return <div className={`app role-${me.role} ${collapsed?"navCollapsed":""}`}>
    <aside className="side">
      <div className="sideTop">
        <div className="brand">
          <span className="brandIcon">✦</span>
          <span className="brandText"><strong>비전제일교회</strong><small>JOYFUL YOUTH</small></span>
        </div>
        <button className="collapseBtn" aria-label="메뉴 접기/펼치기" onClick={()=>setCollapsed(v=>!v)}>{collapsed?"›":"‹"}</button>
      </div>
      <div className="nav">
        {nav.map(([id,icon,label])=><button title={label} key={id} className={page===id?"active":""} onClick={()=>{setPage(id);setSelectedPost(null);setWriting(false)}}>
          <span className="navIcon">{icon}</span><span className="navLabel">{label}</span>
        </button>)}
        <button title="로그아웃" onClick={logout}><span className="navIcon">↩</span><span className="navLabel">로그아웃</span></button>
      </div>
      <div className="sideFoot">
        <span className="sideAvatar">{me.full_name.slice(0,1)}</span>
        <span className="sideIdentity"><b>{me.full_name}</b><small>{me.role==="admin"?"관리자":me.role==="teacher"?"선생님":"학생"}</small></span>
      </div>
    </aside>
    <main className="main">
      {page==="dashboard" && <Dashboard me={me} students={students} activities={activities} settings={settings} onDone={()=>refresh()}/>}
      {page==="students" && (me.role==="admin"||me.role==="teacher") && <PeopleManagement me={me} students={students} teachers={teachers} activities={activities} onDone={()=>refresh()}/>}
      {page==="faith" && <FaithJourney me={me} students={students} faithChecks={faithChecks} bibleChecks={bibleChecks} dbState={faithDbState} onDone={()=>refresh()}/>}
      {page==="score" && (me.role==="admin"||me.role==="teacher") && <ScorePage students={students} activities={activities} me={me} onDone={()=>refresh()}/>}
      {page==="history" && <ScoreHistory me={me} students={students} teachers={teachers} activities={activities}/>}
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
  return <main className="auth">
    <section className="authIntro" aria-label="청소년부 소개">
      <span className="introMark">JOY</span>
      <p className="introEyebrow">비전제일교회 청소년부</p>
      <h1>주님 안에서<br/><em>행복하게,</em><br/>함께 자라요</h1>
      <p>예배와 말씀, 사랑의 섬김을 통해<br/>서로를 응원하는 밝은 공동체입니다.</p>
      <div className="introTags"><span>예배</span><span>말씀</span><span>사랑</span></div>
    </section>
    <div className="authbox"><div className="logo">✦</div><p className="loginEyebrow">WELCOME BACK</p><h2>반가워요!</h2><p className="sub">오늘도 기쁨으로 함께 성장해요.</p>
    <div className="tabs"><button type="button" className={mode==="login"?"active":""} onClick={()=>setMode("login")}>로그인</button><button type="button" className={mode==="signup"?"active":""} onClick={()=>setMode("signup")}>회원가입</button></div>
    {mode==="login"?<form onSubmit={login}><Field label="아이디" name="username"/><Field label="비밀번호" name="password" type="password"/><button className="btn full">로그인</button></form>
    :<form onSubmit={signup}><Field label="이름" name="fullName"/><div className="formgrid"><Field label="학년" name="grade"/><Field label="반" name="className"/></div><Field label="아이디" name="username"/><Field label="비밀번호" name="password" type="password"/><Field label="비밀번호 확인" name="password2" type="password"/><button className="btn full">학생 회원가입</button></form>}
    {msg&&<div className="notice">{msg}</div>}
    <p className="authHelp">로그인에 어려움이 있다면 담당 선생님께 알려주세요.</p>
  </div></main>
}
function Field({label,name,type="text",defaultValue=""}:{label:string;name:string;type?:string;defaultValue?:string}) {
  return <label className="field"><span>{label}</span><input className="input" name={name} type={type} defaultValue={defaultValue} required={["username","password","fullName"].includes(name)}/></label>
}

function totalFor(id:string, acts:Activity[]){return acts.filter(a=>a.student_id===id).reduce((n,a)=>n+a.points,0)}
function profileOf(s:Student|undefined){if(!s)return undefined;return Array.isArray(s.profiles)?s.profiles[0]:s.profiles}
function medalStatus(s:Student|undefined, acts:Activity[]){
  if(!s) return {points:0,bronze:false,silver:false,gold:false,label:"🌱"};
  const points=totalFor(s.id,acts);
  const bronze=points>=40 && !!s.service;
  const silver=bronze && points>=80 && !!s.discipleship && !!s.nt_read;
  const gold=silver && !!s.evangelism && !!s.ot_read;
  return {points,bronze,silver,gold,label:gold?"🥇":silver?"🥈":bronze?"🥉":"🌱"};
}
function medalFor(id:string, students:Student[], acts:Activity[]){
  return medalStatus(students.find(s=>s.id===id),acts).label;
}

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
      <div className="grid2"><div className="card"><h3>현재 메달</h3><div className="medalBig">{medalFor(me.id,students,activities)}</div></div><div className="card"><h3>최근 활동</h3>{activities.filter(a=>a.student_id===me.id).slice(0,8).map(a=><Row key={a.id} left={a.reason} right={`${a.icon} +${a.points}`}/>)}</div></div>
    </>;
  }

  const active=students.filter(s=>s.active), avg=active.length?Math.round(active.reduce((n,s)=>n+totalFor(s.id,activities),0)/active.length):0;
  return <>
    <div className="top">
      <div className="title"><p className="pageEyebrow">GROWING TOGETHER</p><h1>{me.role==="admin"?settings.dashboard_title:"선생님 홈"}</h1><p>{settings.dashboard_subtitle||"주님 안에서 자라나는 학생들의 오늘을 함께 기록해요."}</p></div>
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
    <div className="joyBanner"><span>☀️</span><div><b>오늘도 기쁨으로 한 걸음!</b><p>작은 실천 하나하나가 믿음의 성장이 됩니다.</p></div></div>
    <div className="grid"><Stat t="함께하는 학생" v={`${active.length}명`}/><Stat t="평균 성장 점수" v={`${avg}점`}/><Stat t="동메달 이상" v={`${active.filter(s=>medalStatus(s,activities).bronze).length}명`}/><Stat t="칭찬 기록" v={`${activities.length}건`}/></div>
    {me.role==="admin"&&<div className="card visitPanel mt">
      <div className="visitPanelTitle"><span>👀</span><div><h3>홈페이지 조회수</h3><p>같은 브라우저 세션의 반복 새로고침은 한 번만 집계합니다.</p></div></div>
      <div className="visitMetrics"><div><span>전체 조회수</span><b>{Number(settings.home_view_count||0).toLocaleString("ko-KR")}</b><small>회</small></div><div><span>오늘 조회수</span><b>{settings.home_view_date===localISODate()?Number(settings.home_today_view_count||0).toLocaleString("ko-KR"):"0"}</b><small>회</small></div></div>
    </div>}
    <div className="card mt"><h3>🏆 현재 순위</h3>{active.slice().sort((a,b)=>totalFor(b.id,activities)-totalFor(a.id,activities)).slice(0,7).map((s,i)=><Row key={s.id} left={`${i+1}위 ${profileOf(s)?.full_name||"학생"}`} right={`${totalFor(s.id,activities)}점`}/>)}</div>
  </>;
}
function Header({title,sub}:{title:string;sub?:string}){return <div className="top"><div className="title"><h1>{title}</h1>{sub&&<p>{sub}</p>}</div></div>}
function Stat({t,v}:{t:string;v:string}){return <div className="card"><div className="muted">{t}</div><div className="num">{v}</div></div>}
function Row({left,right}:{left:string;right:string}){return <div className="row"><span>{left}</span><b>{right}</b></div>}

function PeopleManagement({me,students,teachers,activities,onDone}:{me:Profile;students:Student[];teachers:Profile[];activities:Activity[];onDone:()=>void}){
  const isAdmin=me.role==="admin";
  const [tab,setTab]=useState<"students"|"teachers">("students");
  const [showStudentForm,setShowStudentForm]=useState(false);
  const [showTeacherForm,setShowTeacherForm]=useState(false);
  const [student,setStudent]=useState({fullName:"",grade:"",className:"",username:"",password:""});
  const [teacher,setTeacher]=useState({fullName:"",username:"",password:""});
  const [editingStudent,setEditingStudent]=useState<Student|null>(null);
  const [editForm,setEditForm]=useState({
    fullName:"",grade:"",className:"",active:true,
    service:false,nt_read:false,discipleship:false,ot_read:false,evangelism:false
  });

  async function authHeaders(){
    const {data:{session}}=await supabase.auth.getSession();
    return session?{"content-type":"application/json","authorization":`Bearer ${session.access_token}`}:null;
  }

  async function addStudent(){
    if(!isAdmin)return;
    const headers=await authHeaders(); if(!headers)return;
    const r=await fetch("/api/admin/student",{method:"POST",headers,body:JSON.stringify(student)});
    const j=await r.json(); if(!r.ok)return alert(j.error||"학생 등록 실패");
    alert("학생이 등록되었습니다.");
    setStudent({fullName:"",grade:"",className:"",username:"",password:""});setShowStudentForm(false);onDone();
  }

  async function addTeacher(){
    if(!isAdmin)return;
    const headers=await authHeaders(); if(!headers)return;
    const r=await fetch("/api/admin/teacher",{method:"POST",headers,body:JSON.stringify(teacher)});
    const j=await r.json(); if(!r.ok)return alert(j.error||"생성 실패");
    alert("선생님 계정이 생성되었습니다.");
    setTeacher({fullName:"",username:"",password:""});setShowTeacherForm(false);onDone();
  }

  function editStudent(s:Student){
    if(!isAdmin)return;
    const current=profileOf(s);
    setEditingStudent(s);
    setEditForm({
      fullName:current?.full_name||"",
      grade:s.grade||"",
      className:s.class_name||"",
      active:s.active!==false,
      service:!!s.service,
      nt_read:!!s.nt_read,
      discipleship:!!s.discipleship,
      ot_read:!!s.ot_read,
      evangelism:!!s.evangelism
    });
  }

  async function saveStudentEdit(){
    if(!isAdmin||!editingStudent)return;
    if(!editForm.fullName.trim())return alert("학생 이름을 입력하세요.");
    const {error:e1}=await supabase.from("profiles").update({
      full_name:editForm.fullName.trim()
    }).eq("id",editingStudent.id);
    const {error:e2}=await supabase.from("students").update({
      grade:editForm.grade.trim(),
      class_name:editForm.className.trim(),
      active:editForm.active,
      service:editForm.service,
      nt_read:editForm.nt_read,
      discipleship:editForm.discipleship,
      ot_read:editForm.ot_read,
      evangelism:editForm.evangelism
    }).eq("id",editingStudent.id);
    if(e1||e2)return alert(e1?.message||e2?.message);
    setEditingStudent(null);
    onDone();
  }

  async function editTeacher(t:Profile){
    if(!isAdmin)return;
    const fullName=prompt("선생님 이름",t.full_name||""); if(fullName===null)return;
    const username=prompt("선생님 아이디",t.username||""); if(username===null)return;
    const password=prompt("새 비밀번호 (변경하지 않으려면 비워두세요)",""); if(password===null)return;
    const headers=await authHeaders(); if(!headers)return;
    const r=await fetch("/api/admin/teacher",{
      method:"PATCH",headers,
      body:JSON.stringify({id:t.id,fullName:fullName.trim(),username:username.trim().toLowerCase(),password})
    });
    const j=await r.json(); if(!r.ok)return alert(j.error||"수정 실패");
    alert("선생님 정보가 수정되었습니다.");onDone();
  }

  async function deleteTeacher(t:Profile){
    if(!isAdmin)return;
    if(!confirm(`${t.full_name} 선생님 계정을 삭제할까요?`))return;
    const headers=await authHeaders(); if(!headers)return;
    const r=await fetch(`/api/admin/teacher?id=${encodeURIComponent(t.id)}`,{method:"DELETE",headers});
    const j=await r.json(); if(!r.ok)return alert(j.error||"삭제 실패");
    alert("선생님 계정이 삭제되었습니다.");onDone();
  }

  return <>
    <div className="top">
      <div className="title"><h1>👥 학생 관리</h1><p>{isAdmin?"학생과 교사 계정을 관리합니다.":"학생과 교사 목록을 확인할 수 있습니다."}</p></div>
    </div>

    <div className="peopleTabs">
      <button className={tab==="students"?"active":""} onClick={()=>setTab("students")}>학생 목록 <span>{students.length}</span></button>
      <button className={tab==="teachers"?"active":""} onClick={()=>setTab("teachers")}>교사 목록 <span>{teachers.length}</span></button>
    </div>

    {isAdmin&&editingStudent&&<div className="card editor medalEditor">
      <div className="sectionToolbar">
        <div>
          <h3>학생 정보 수정 · 메달 조건</h3>
          <p className="muted">기본 정보와 메달 미션을 함께 수정합니다.</p>
        </div>
        <button className="btn gray" onClick={()=>setEditingStudent(null)}>닫기</button>
      </div>

      <div className="formgrid">
        <label className="field"><span>이름</span><input className="input" value={editForm.fullName} onChange={e=>setEditForm({...editForm,fullName:e.target.value})}/></label>
        <label className="field"><span>학년</span><input className="input" value={editForm.grade} onChange={e=>setEditForm({...editForm,grade:e.target.value})}/></label>
        <label className="field"><span>반</span><input className="input" value={editForm.className} onChange={e=>setEditForm({...editForm,className:e.target.value})}/></label>
        <label className="checkRow"><input type="checkbox" checked={editForm.active} onChange={e=>setEditForm({...editForm,active:e.target.checked})}/><span>활동 중</span></label>
      </div>

      <div className="medalRuleGrid">
        <div className="medalRuleCard">
          <div className="medalRuleTitle">🥉 동메달</div>
          <div className="muted">40점 이상 + 봉사</div>
          <label className="checkRow"><input type="checkbox" checked={editForm.service} onChange={e=>setEditForm({...editForm,service:e.target.checked})}/><span>봉사 완료</span></label>
        </div>

        <div className="medalRuleCard">
          <div className="medalRuleTitle">🥈 은메달</div>
          <div className="muted">동메달 + 80점 이상 + 제자훈련 + 신약통독</div>
          <label className="checkRow"><input type="checkbox" checked={editForm.discipleship} onChange={e=>setEditForm({...editForm,discipleship:e.target.checked})}/><span>제자훈련 완료</span></label>
          <label className="checkRow"><input type="checkbox" checked={editForm.nt_read} onChange={e=>setEditForm({...editForm,nt_read:e.target.checked})}/><span>신약통독 완료</span></label>
        </div>

        <div className="medalRuleCard">
          <div className="medalRuleTitle">🥇 금메달</div>
          <div className="muted">은메달 + 전도 + 구약통독</div>
          <label className="checkRow"><input type="checkbox" checked={editForm.evangelism} onChange={e=>setEditForm({...editForm,evangelism:e.target.checked})}/><span>전도 완료</span></label>
          <label className="checkRow"><input type="checkbox" checked={editForm.ot_read} onChange={e=>setEditForm({...editForm,ot_read:e.target.checked})}/><span>구약통독 완료</span></label>
        </div>
      </div>

      <div className="medalPreview">
        현재 점수: <b>{totalFor(editingStudent.id,activities)}점</b>
      </div>

      <div className="actions mtSmall">
        <button className="btn" onClick={saveStudentEdit}>저장</button>
        <button className="btn gray" onClick={()=>setEditingStudent(null)}>취소</button>
      </div>
    </div>}

    {tab==="students"&&<>
      <div className="sectionToolbar">
        <div><h3>학생 목록</h3><p className="muted">이름, 학년, 반, 아이디, 활동 상태를 확인합니다.</p></div>
        {isAdmin&&<button className="btn" onClick={()=>setShowStudentForm(v=>!v)}>+ 학생 등록</button>}
      </div>
      {isAdmin&&showStudentForm&&<div className="card editor">
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
      <div className="card">
        <div className="tablewrap"><table><thead><tr><th>이름</th><th>학년/반</th><th>아이디</th><th>상태</th>{isAdmin&&<th>관리</th>}</tr></thead>
        <tbody>{students.map(s=><tr key={s.id}>
          <td><b>{profileOf(s)?.full_name}</b></td>
          <td>{s.grade||"-"} / {s.class_name||"-"}</td>
          <td>{profileOf(s)?.username||"-"}</td>
          <td><span className={`statusPill ${s.active?"on":"off"}`}>{s.active?"활동":"비활동"}</span></td>
          {isAdmin&&<td><button className="btn gray compactBtn" onClick={()=>editStudent(s)}>정보 수정</button></td>}
        </tr>)}</tbody></table></div>
      </div>
    </>}

    {tab==="teachers"&&<>
      <div className="sectionToolbar">
        <div><h3>교사 목록</h3><p className="muted">{isAdmin?"교사 계정을 추가·수정·삭제할 수 있습니다.":"함께 섬기는 교사 목록입니다."}</p></div>
        {isAdmin&&<button className="btn" onClick={()=>setShowTeacherForm(v=>!v)}>+ 교사 추가</button>}
      </div>
      {isAdmin&&showTeacherForm&&<div className="card editor">
        <h3>새 교사 계정</h3>
        <div className="formgrid">
          <input className="input" placeholder="선생님 이름" value={teacher.fullName} onChange={e=>setTeacher({...teacher,fullName:e.target.value})}/>
          <input className="input" placeholder="아이디" value={teacher.username} onChange={e=>setTeacher({...teacher,username:e.target.value.toLowerCase()})}/>
          <input className="input" type="password" placeholder="비밀번호 (6자 이상)" value={teacher.password} onChange={e=>setTeacher({...teacher,password:e.target.value})}/>
        </div>
        <div className="actions mtSmall"><button className="btn" onClick={addTeacher}>교사 추가</button><button className="btn gray" onClick={()=>setShowTeacherForm(false)}>취소</button></div>
      </div>}
      <div className="card">
        {teachers.length?<div className="teacherGrid">{teachers.map(t=><div className="teacherCard" key={t.id}>
          <div className="teacherAvatar">👨‍🏫</div>
          <div className="teacherInfo"><b>{t.full_name}</b><span>@{t.username}</span></div>
          {isAdmin&&<div className="teacherActions"><button className="btn gray compactBtn" onClick={()=>editTeacher(t)}>수정</button><button className="btn red compactBtn" onClick={()=>deleteTeacher(t)}>삭제</button></div>}
        </div>)}</div>:<div className="emptyState">등록된 교사가 없습니다.</div>}
      </div>
    </>}
  </>;
}

function localISODate(date=new Date()){
  const year=date.getFullYear();
  const month=String(date.getMonth()+1).padStart(2,"0");
  const day=String(date.getDate()).padStart(2,"0");
  return `${year}-${month}-${day}`;
}
function dateDaysAgo(days:number){
  const date=new Date();
  date.setHours(12,0,0,0);
  date.setDate(date.getDate()-days);
  return localISODate(date);
}
function inclusiveDays(start:string,end:string){
  const first=new Date(`${start}T12:00:00`).getTime();
  const last=new Date(`${end}T12:00:00`).getTime();
  return Math.max(1,Math.round((last-first)/86400000)+1);
}
function faithDateText(value:string){
  const date=new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("ko-KR",{month:"long",day:"numeric",weekday:"short"}).format(date);
}

function FaithJourney({me,students,faithChecks,bibleChecks,dbState,onDone}:{
  me:Profile;students:Student[];faithChecks:FaithCheck[];bibleChecks:BibleChapterCheck[];
  dbState:"checking"|"ready"|"missing";onDone:()=>Promise<void>
}){
  const isStaff=me.role==="admin"||me.role==="teacher";
  const canEdit=isStaff||me.role==="student";
  const activeStudents=students.filter(s=>s.active);
  const [tab,setTab]=useState<"daily"|"bible"|"compare"|"overview">("daily");
  const [selectedStudent,setSelectedStudent]=useState(isStaff?activeStudents[0]?.id||"":me.id);
  const [checkDate,setCheckDate]=useState(localISODate());
  const [readDate,setReadDate]=useState(localISODate());
  const [saving,setSaving]=useState(false);
  const [busyChapter,setBusyChapter]=useState("");
  const [testament,setTestament]=useState<"old"|"new">("old");
  const [selectedBookCode,setSelectedBookCode]=useState("GEN");
  const [bookQuery,setBookQuery]=useState("");
  const [actionNotice,setActionNotice]=useState("");
  const [compareDate,setCompareDate]=useState(localISODate());
  const [comparisonRows,setComparisonRows]=useState<DailyFaithComparison[]>([]);
  const [comparisonLoading,setComparisonLoading]=useState(false);
  const [comparisonError,setComparisonError]=useState("");
  const [startDate,setStartDate]=useState(dateDaysAgo(29));
  const [endDate,setEndDate]=useState(localISODate());
  const [daily,setDaily]=useState({bible_reading:false,prayer:false,qt:false,worship:false,note:""});

  useEffect(()=>{
    if(isStaff&&!activeStudents.some(s=>s.id===selectedStudent))setSelectedStudent(activeStudents[0]?.id||"");
  },[isStaff,students,selectedStudent]);

  const studentId=isStaff?selectedStudent:me.id;
  const currentStudent=students.find(s=>s.id===studentId);
  const currentDaily=faithChecks.find(row=>row.student_id===studentId&&row.check_date===checkDate);

  useEffect(()=>{
    setDaily({
      bible_reading:!!currentDaily?.bible_reading,
      prayer:!!currentDaily?.prayer,
      qt:!!currentDaily?.qt,
      worship:!!currentDaily?.worship,
      note:currentDaily?.note||""
    });
  },[currentDaily,studentId,checkDate]);

  useEffect(()=>{
    if(isStaff||tab!=="compare"||dbState!=="ready")return;
    let cancelled=false;
    async function loadComparison(){
      setComparisonLoading(true);
      setComparisonError("");
      const {data,error}=await supabase.rpc("get_daily_faith_comparison",{p_check_date:compareDate});
      if(cancelled)return;
      setComparisonLoading(false);
      if(error){setComparisonRows([]);setComparisonError("친구 비교 기능을 사용하려면 최신 Supabase SQL을 실행해 주세요.");return;}
      setComparisonRows((data||[]) as DailyFaithComparison[]);
    }
    loadComparison();
    return ()=>{cancelled=true};
  },[isStaff,tab,compareDate,dbState]);

  async function saveDaily(){
    if(!canEdit||!studentId)return;
    if(!checkDate)return alert("기록 날짜를 선택해 주세요.");
    setSaving(true);
    const {error}=await supabase.from("faith_checks").upsert({
      student_id:studentId,
      check_date:checkDate,
      ...daily,
      note:daily.note.trim(),
      checked_by:me.id,
      updated_at:new Date().toISOString()
    },{onConflict:"student_id,check_date"});
    setSaving(false);
    if(error)return alert(error.message);
    await onDone();
    setActionNotice("신앙 점검이 저장되었습니다.");
  }

  const studentBibleChecks=bibleChecks.filter(row=>row.student_id===studentId);
  const checkedKeys=new Set(studentBibleChecks.map(row=>`${row.book_code}:${row.chapter}`));
  const totalBibleChapters=BIBLE_BOOKS.reduce((sum,book)=>sum+book.chapters,0);
  const oldChapterTotal=BIBLE_BOOKS.filter(book=>book.testament==="old").reduce((sum,book)=>sum+book.chapters,0);
  const newChapterTotal=totalBibleChapters-oldChapterTotal;
  const oldChecked=studentBibleChecks.filter(row=>BIBLE_BOOKS.find(book=>book.code===row.book_code)?.testament==="old").length;
  const newChecked=studentBibleChecks.length-oldChecked;
  const selectedBook=BIBLE_BOOKS.find(book=>book.code===selectedBookCode)||BIBLE_BOOKS[0];
  const selectedBookChecked=studentBibleChecks.filter(row=>row.book_code===selectedBook.code).length;
  const visibleBooks=BIBLE_BOOKS.filter(book=>book.testament===testament&&book.name.includes(bookQuery.trim()));

  async function toggleChapter(book:BibleBook,chapter:number){
    if(!canEdit||!studentId)return;
    if(!readDate)return alert("성경을 읽은 날짜를 선택해 주세요.");
    const key=`${book.code}:${chapter}`;
    setBusyChapter(key);
    const existing=studentBibleChecks.find(row=>row.book_code===book.code&&row.chapter===chapter);
    if(existing){
      const {error}=await supabase.from("bible_chapter_checks").delete().eq("id",existing.id);
      setBusyChapter("");
      if(error)return alert(error.message);
      await onDone();
      setActionNotice(`${book.name} ${chapter}장 체크를 해제했습니다.`);
      return;
    }
    const {error}=await supabase.from("bible_chapter_checks").insert({
      student_id:studentId,book_code:book.code,chapter,read_on:readDate,checked_by:me.id
    });
    if(error){setBusyChapter("");return alert(error.message);}

    const sameDay=faithChecks.find(row=>row.student_id===studentId&&row.check_date===readDate);
    const {error:dailyError}=await supabase.from("faith_checks").upsert({
      student_id:studentId,
      check_date:readDate,
      bible_reading:true,
      prayer:!!sameDay?.prayer,
      qt:!!sameDay?.qt,
      worship:!!sameDay?.worship,
      note:sameDay?.note||"",
      checked_by:me.id,
      updated_at:new Date().toISOString()
    },{onConflict:"student_id,check_date"});
    setBusyChapter("");
    if(dailyError)alert(`장별 진도는 저장했지만 일일 성경읽기 표시는 저장하지 못했습니다: ${dailyError.message}`);
    await onDone();
    setActionNotice(`${book.name} ${chapter}장을 말씀 진도에 저장했습니다.`);
  }

  const safeStartDate=startDate||dateDaysAgo(29);
  const safeEndDate=endDate||localISODate();
  const rangeStart=safeStartDate<=safeEndDate?safeStartDate:safeEndDate;
  const rangeEnd=safeStartDate<=safeEndDate?safeEndDate:safeStartDate;
  const rangeDays=inclusiveDays(rangeStart,rangeEnd);
  const overviewStudents=isStaff?activeStudents:students.filter(s=>s.id===me.id);
  const rangeChecks=faithChecks.filter(row=>row.check_date>=rangeStart&&row.check_date<=rangeEnd);
  const completedTotal=rangeChecks
    .filter(row=>overviewStudents.some(s=>s.id===row.student_id))
    .reduce((sum,row)=>sum+FAITH_HABITS.filter(habit=>row[habit.key]).length,0);
  const possibleTotal=overviewStudents.length*rangeDays*FAITH_HABITS.length;
  const overallRate=possibleTotal?Math.round(completedTotal/possibleTotal*100):0;
  const recentRows=faithChecks.filter(row=>row.student_id===studentId).slice(0,14);
  const comparisonMap=new Map(comparisonRows.map(row=>[row.student_id,row]));
  const comparisonParticipants=activeStudents.filter(student=>comparisonMap.has(student.id)).length;
  const comparisonCompleted=comparisonRows.reduce((sum,row)=>sum+FAITH_HABITS.filter(habit=>row[habit.key]).length,0);

  function studentHabitCount(id:string,key:FaithHabitKey){
    return rangeChecks.filter(row=>row.student_id===id&&row[key]).length;
  }
  function studentFaithRate(id:string){
    const done=FAITH_HABITS.reduce((sum,habit)=>sum+studentHabitCount(id,habit.key),0);
    return Math.round(done/(rangeDays*FAITH_HABITS.length)*100);
  }
  function studentBibleCount(id:string){return bibleChecks.filter(row=>row.student_id===id).length;}
  function openTestament(next:"old"|"new"){
    setTestament(next);
    setBookQuery("");
    setSelectedBookCode(BIBLE_BOOKS.find(book=>book.testament===next)?.code||"GEN");
  }

  if(dbState==="missing")return <>
    <Header title="🙏 신앙생활 DB 설치 필요" sub="웹앱은 연결되었지만 Supabase에 신앙생활 테이블이 아직 없습니다."/>
    <div className="card databaseSetupNotice"><span>🛠️</span><div><h3>Supabase SQL을 먼저 실행해 주세요</h3><p>다운로드한 ZIP의 맨 바깥에 있는 <b>1_RUN_IN_SUPABASE.sql</b> 전체를 Supabase SQL Editor에서 실행하면 해결됩니다.</p><small>반드시 Vercel의 NEXT_PUBLIC_SUPABASE_URL과 같은 Supabase 프로젝트에서 실행해야 합니다.</small></div></div>
  </>;
  if(dbState==="checking")return <><Header title="🙏 신앙생활" sub="데이터베이스 연결을 확인하고 있습니다."/><div className="card emptyState">확인 중…</div></>;
  if(!currentStudent)return <><Header title="🙏 신앙생활" sub="학생 등록 후 신앙생활 기록을 시작할 수 있습니다."/><div className="card emptyState">활동 중인 학생이 없습니다.</div></>;

  return <>
    <Header
      title={isStaff?"🙏 신앙생활 체크":"🌱 나의 신앙생활"}
      sub={isStaff?"작은 믿음의 습관을 기록하고 성장을 함께 응원해 주세요.":"말씀과 기도, 큐티와 예배의 걸음을 직접 기록해요."}
    />

    {!isStaff&&<div className="studentFaithActions" aria-label="학생 신앙 기록 바로가기">
      <button type="button" className={tab==="daily"?"active":""} onClick={()=>{setTab("daily");setActionNotice("")}}>
        <span>✅</span><div><b>오늘의 신앙 점검</b><small>성경읽기·기도·큐티·예배를 체크해요</small></div>
      </button>
      <button type="button" className={tab==="bible"?"active":""} onClick={()=>{setTab("bible");setActionNotice("")}}>
        <span>📖</span><div><b>읽은 말씀 체크</b><small>성경 66권에서 읽은 장을 직접 눌러요</small></div>
      </button>
      <button type="button" className={tab==="compare"?"active":""} onClick={()=>{setTab("compare");setActionNotice("")}}>
        <span>👫</span><div><b>친구와 하루 비교</b><small>서로의 하루 체크리스트만 함께 봐요</small></div>
      </button>
    </div>}

    {isStaff&&<div className="card faithStudentPicker">
      <label className="field"><span>학생 선택</span><select className="input" value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)}>
        {activeStudents.map(student=><option key={student.id} value={student.id}>{profileOf(student)?.full_name||"이름 없음"} · {student.grade} {student.class_name}</option>)}
      </select></label>
      <div className="faithSelectedName"><span>지금 기록하는 학생</span><b>{profileOf(currentStudent)?.full_name}</b></div>
    </div>}

    <div className="faithTabs" role="tablist" aria-label="신앙생활 메뉴">
      <button className={tab==="daily"?"active":""} onClick={()=>{setTab("daily");setActionNotice("")}}>✅ 생활 체크</button>
      <button className={tab==="bible"?"active":""} onClick={()=>{setTab("bible");setActionNotice("")}}>📚 성경 66권</button>
      {!isStaff&&<button className={tab==="compare"?"active":""} onClick={()=>{setTab("compare");setActionNotice("")}}>👫 친구 비교</button>}
      <button className={tab==="overview"?"active":""} onClick={()=>{setTab("overview");setActionNotice("")}}>📊 {isStaff?"한눈에 보기":"나의 기록"}</button>
    </div>

    {actionNotice&&<div className="faithActionNotice" role="status">✓ {actionNotice}</div>}

    {tab==="daily"&&<section>
      <div className="card dailyCheckCard">
        <div className="sectionToolbar faithToolbar">
          <div><h3>{isStaff?"오늘의 신앙생활 기록":"오늘의 신앙 점검"}</h3><p className="muted">{faithDateText(checkDate)} · {profileOf(currentStudent)?.full_name}</p></div>
          <label className="dateField"><span>기록 날짜</span><input className="input" type="date" max={localISODate()} value={checkDate} onChange={e=>{setCheckDate(e.target.value);setActionNotice("")}}/></label>
        </div>
        <div className="habitGrid">
          {FAITH_HABITS.map(habit=><button
            type="button"
            key={habit.key}
            disabled={!canEdit}
            aria-pressed={daily[habit.key]}
            className={`habitCard ${daily[habit.key]?"done":""} ${!canEdit?"readOnly":""}`}
            onClick={()=>{if(canEdit){setDaily({...daily,[habit.key]:!daily[habit.key]});setActionNotice("")}}}
          >
            <span className="habitIcon">{habit.icon}</span>
            <span className="habitCopy"><b>{habit.label}</b><small>{habit.description}</small></span>
            <span className="habitCheck">{daily[habit.key]?"✓":"○"}</span>
          </button>)}
        </div>
        {canEdit?<>
          <label className="field faithNote"><span>메모 (선택)</span><textarea className="input" rows={3} maxLength={500} value={daily.note} onChange={e=>setDaily({...daily,note:e.target.value})} placeholder="감사 제목이나 함께 기억할 내용을 적어 주세요."/></label>
          <div className="faithSaveRow"><span className="muted">성경 66권에서 장을 체크하면 해당 날짜의 성경읽기도 자동 완료됩니다.</span><button className="btn" disabled={saving} onClick={saveDaily}>{saving?"저장 중…":isStaff?"기록 저장":"내 기록 저장"}</button></div>
        </>:daily.note&&<div className="faithMemo">💬 {daily.note}</div>}
      </div>
    </section>}

    {tab==="bible"&&<section>
      <div className="bibleSummaryGrid">
        <div className="card bibleSummary"><span>성경 전체</span><b>{studentBibleChecks.length} / {totalBibleChapters}장</b><Progress value={studentBibleChecks.length} max={totalBibleChapters}/></div>
        <div className="card bibleSummary"><span>구약</span><b>{oldChecked} / {oldChapterTotal}장</b><Progress value={oldChecked} max={oldChapterTotal}/></div>
        <div className="card bibleSummary"><span>신약</span><b>{newChecked} / {newChapterTotal}장</b><Progress value={newChecked} max={newChapterTotal}/></div>
      </div>

      <div className="card bibleWorkspace">
        <div className="bibleControls">
          <div className="testamentTabs"><button className={testament==="old"?"active":""} onClick={()=>openTestament("old")}>구약 39권</button><button className={testament==="new"?"active":""} onClick={()=>openTestament("new")}>신약 27권</button></div>
          <input className="input bibleSearch" value={bookQuery} onChange={e=>setBookQuery(e.target.value)} placeholder="성경 이름 검색" aria-label="성경 이름 검색"/>
        </div>
        <div className="bibleBookGrid">
          {visibleBooks.map(book=>{
            const count=studentBibleChecks.filter(row=>row.book_code===book.code).length;
            return <button key={book.code} className={`${selectedBook.code===book.code?"active":""} ${count===book.chapters?"complete":""}`} onClick={()=>setSelectedBookCode(book.code)}>
              <b>{book.name}</b><span>{count}/{book.chapters}</span>
            </button>;
          })}
        </div>
        {!visibleBooks.length&&<div className="emptyState">검색되는 성경이 없습니다.</div>}
      </div>

      <div className="card chapterCard">
        <div className="sectionToolbar faithToolbar">
          <div><h3>📖 {selectedBook.name}</h3><p className="muted">{selectedBookChecked}장 완료 · 장 번호를 눌러 기록합니다.</p></div>
          {canEdit&&<label className="dateField"><span>읽은 날짜</span><input className="input" type="date" max={localISODate()} value={readDate} onChange={e=>setReadDate(e.target.value)}/></label>}
        </div>
        <div className="chapterGrid">
          {Array.from({length:selectedBook.chapters},(_,index)=>index+1).map(chapter=>{
            const key=`${selectedBook.code}:${chapter}`;
            const row=studentBibleChecks.find(item=>item.book_code===selectedBook.code&&item.chapter===chapter);
            return <button
              key={chapter}
              disabled={!canEdit||busyChapter===key}
              className={row?"done":""}
              aria-pressed={!!row}
              title={row?`${row.read_on} 완료`:canEdit?`${chapter}장 완료로 표시`:"미완료"}
              onClick={()=>toggleChapter(selectedBook,chapter)}
            >{busyChapter===key?"…":chapter}<small>{row?"✓":""}</small></button>;
          })}
        </div>
        <div className="bibleLegend"><span><i className="legendDone"/>읽음</span><span><i/>아직</span><b>{isStaff?"선생님이 대신 기록할 수 있습니다.":"읽은 장을 직접 눌러 기록하세요."}</b></div>
      </div>
    </section>}

    {tab==="compare"&&!isStaff&&<section>
      <div className="card friendCompareHeader">
        <div><h3>👫 친구와 하루 체크 비교</h3><p className="muted">선택한 하루의 성경읽기·기도·큐티·예배 참석 여부만 함께 볼 수 있어요.</p></div>
        <label className="dateField"><span>비교 날짜</span><input className="input" type="date" max={localISODate()} value={compareDate} onChange={e=>setCompareDate(e.target.value)}/></label>
      </div>
      <div className="friendComparePrivacy"><span>🔒</span><p><b>개인 기록은 안전하게 보호됩니다.</b><small>친구의 메모, 성경 66권 장별 진도, 다른 날짜의 상세 기록은 공개되지 않습니다.</small></p></div>
      {comparisonError?<div className="card databaseSetupNotice"><span>🛠️</span><div><h3>비교 기능 SQL 설치가 필요합니다</h3><p>{comparisonError}</p></div></div>:<>
        <div className="friendCompareSummary">
          <div className="card"><span>비교 날짜</span><b>{faithDateText(compareDate)}</b></div>
          <div className="card"><span>기록한 친구</span><b>{comparisonParticipants} / {activeStudents.length}명</b></div>
          <div className="card"><span>함께 실천한 항목</span><b>{comparisonCompleted}회</b></div>
        </div>
        {comparisonLoading?<div className="card emptyState">친구들의 하루 체크를 불러오는 중…</div>:<div className="friendFaithGrid">
          {activeStudents.map(student=>{
            const row=comparisonMap.get(student.id);
            const completed=row?FAITH_HABITS.filter(habit=>row[habit.key]).length:0;
            const isMe=student.id===me.id;
            return <article key={student.id} className={`card friendFaithCard ${isMe?"mine":""}`}>
              <div className="friendFaithIdentity"><span>{(profileOf(student)?.full_name||"?").slice(0,1)}</span><div><b>{profileOf(student)?.full_name||"이름 없음"}{isMe&&<em>나</em>}</b><small>{student.grade} {student.class_name}</small></div><strong>{completed}/4</strong></div>
              <div className="friendHabitList">{FAITH_HABITS.map(habit=><span key={habit.key} className={row?.[habit.key]?"done":""}><i>{habit.icon}</i><b>{habit.label}</b><small>{row?.[habit.key]?"✓":"○"}</small></span>)}</div>
              <p>{row?completed===4?"오늘의 네 가지를 모두 실천했어요!":"오늘의 체크를 기록했어요.":"아직 오늘의 체크를 기록하지 않았어요."}</p>
            </article>;
          })}
        </div>}
      </>}
    </section>}

    {tab==="overview"&&<section>
      <div className="card overviewFilter">
        <div><b>조회 기간</b><p className="muted">선택한 기간의 실천 횟수와 성경 진도를 모아 봅니다.</p></div>
        <div className="dateRange"><label><span>시작</span><input className="input" type="date" max={localISODate()} value={startDate} onChange={e=>setStartDate(e.target.value)}/></label><span>–</span><label><span>종료</span><input className="input" type="date" max={localISODate()} value={endDate} onChange={e=>setEndDate(e.target.value)}/></label></div>
      </div>
      <div className="overviewSummary">
        <div className="card"><span>조회 기간</span><b>{rangeDays}일</b></div>
        <div className="card"><span>{isStaff?"학생":"나의 기록"}</span><b>{isStaff?`${overviewStudents.length}명`:`${rangeChecks.filter(row=>row.student_id===me.id).length}일`}</b></div>
        <div className="card"><span>완료한 실천</span><b>{completedTotal}회</b></div>
        <div className="card"><span>전체 실천률</span><b>{overallRate}%</b></div>
      </div>
      <div className="card faithOverviewTable">
        <div className="sectionToolbar"><div><h3>{isStaff?"학생별 신앙생활 현황":"나의 신앙생활 현황"}</h3><p className="muted">성경 장별 진도는 전체 1,189장 기준입니다.</p></div></div>
        <div className="tablewrap"><table>
          <thead><tr><th>학생</th><th>📖 성경읽기</th><th>🙏 기도</th><th>🌿 큐티</th><th>⛪ 예배</th><th>기간 실천률</th><th>66권 장별 진도</th></tr></thead>
          <tbody>{overviewStudents.map(student=>{
            const id=student.id;
            const rate=studentFaithRate(id);
            const chapterCount=studentBibleCount(id);
            return <tr key={id} className={id===me.id?"meOverviewRow":""}>
              <td><b>{profileOf(student)?.full_name||"이름 없음"}</b><small className="studentMeta">{student.grade} {student.class_name}</small></td>
              {FAITH_HABITS.map(habit=><td key={habit.key}><span className="habitCount">{studentHabitCount(id,habit.key)}</span><small>/{rangeDays}일</small></td>)}
              <td><b className="rateText">{rate}%</b><Progress value={rate} max={100}/></td>
              <td><b>{chapterCount}장</b><small> · {Math.round(chapterCount/totalBibleChapters*100)}%</small></td>
            </tr>;
          })}</tbody>
        </table></div>
      </div>

      <div className="card recentFaith">
        <div className="sectionToolbar"><div><h3>최근 기록 · {profileOf(currentStudent)?.full_name}</h3><p className="muted">최근 저장된 14일의 체크 내용을 보여줍니다.</p></div></div>
        {recentRows.length?<div className="recentFaithList">{recentRows.map(row=><div className="recentFaithRow" key={row.id}>
          <time>{faithDateText(row.check_date)}</time>
          <div>{FAITH_HABITS.map(habit=><span key={habit.key} className={row[habit.key]?"done":""}>{habit.icon} {habit.label} {row[habit.key]?"✓":"○"}</span>)}</div>
          {row.note&&<p>{row.note}</p>}
        </div>)}</div>:<div className="emptyState">아직 저장된 신앙생활 기록이 없습니다.</div>}
      </div>
    </section>}
  </>;
}

function Progress({value,max}:{value:number;max:number}){
  const percent=max?Math.min(100,Math.round(value/max*100)):0;
  return <div className="progressTrack" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><span style={{width:`${percent}%`}}/></div>;
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


function ScoreHistory({me,students,teachers,activities}:{me:Profile;students:Student[];teachers:Profile[];activities:Activity[]}){
  const isStudent=me.role==="student";
  const [studentFilter,setStudentFilter]=useState("all");
  const [categoryFilter,setCategoryFilter]=useState("all");
  const [query,setQuery]=useState("");

  const visibleBase=isStudent?activities.filter(a=>a.student_id===me.id):activities;
  const categories=Array.from(new Set(visibleBase.map(a=>a.category).filter(Boolean))).sort();

  const visible=visibleBase.filter(a=>{
    if(!isStudent && studentFilter!=="all" && a.student_id!==studentFilter)return false;
    if(categoryFilter!=="all" && a.category!==categoryFilter)return false;
    const q=query.trim().toLowerCase();
    if(!q)return true;
    const studentName=profileOf(students.find(s=>s.id===a.student_id))?.full_name||"";
    return `${studentName} ${a.reason} ${a.category}`.toLowerCase().includes(q);
  });

  function studentName(id:string){
    return profileOf(students.find(s=>s.id===id))?.full_name||"알 수 없음";
  }
  function giverName(id:string){
    if(id===me.id)return me.full_name;
    const teacher=teachers.find(t=>t.id===id);
    return teacher?.full_name||"관리자";
  }
  function dateText(value:string){
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return value;
    return new Intl.DateTimeFormat("ko-KR",{
      year:"numeric",month:"2-digit",day:"2-digit",
      hour:"2-digit",minute:"2-digit"
    }).format(d);
  }

  const shownPoints=visible.reduce((sum,a)=>sum+a.points,0);

  return <>
    <Header
      title={isStudent?"📋 나의 점수 내역":"📋 점수 내역"}
      sub={isStudent?"내가 받은 점수와 점수를 받은 이유를 확인할 수 있습니다.":"청소년부 학생들에게 지급한 점수 기록을 날짜순으로 확인할 수 있습니다."}
    />

    <div className="historySummary">
      <div className="card historyStat"><span>표시된 기록</span><b>{visible.length}건</b></div>
      <div className="card historyStat"><span>표시된 점수 합계</span><b>{shownPoints}점</b></div>
      {isStudent&&<div className="card historyStat"><span>현재 총점</span><b>{totalFor(me.id,activities)}점</b></div>}
    </div>

    <div className="card historyFilters">
      {!isStudent&&<label className="field">
        <span>학생</span>
        <select className="input" value={studentFilter} onChange={e=>setStudentFilter(e.target.value)}>
          <option value="all">전체 학생</option>
          {students.map(s=><option value={s.id} key={s.id}>{profileOf(s)?.full_name||"이름 없음"}</option>)}
        </select>
      </label>}
      <label className="field">
        <span>분류</span>
        <select className="input" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}>
          <option value="all">전체 분류</option>
          {categories.map(c=><option value={c} key={c}>{c}</option>)}
        </select>
      </label>
      <label className="field historySearch">
        <span>검색</span>
        <input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="이름·사유·분류 검색"/>
      </label>
    </div>

    <div className="card">
      {visible.length===0?<div className="emptyState">조건에 맞는 점수 기록이 없습니다.</div>:
      <div className="tablewrap">
        <table className="historyTable">
          <thead><tr>
            <th>날짜</th>
            {!isStudent&&<th>학생</th>}
            <th>점수</th>
            <th>분류</th>
            <th>사유</th>
            {!isStudent&&<th>지급자</th>}
          </tr></thead>
          <tbody>
            {visible.map(a=><tr key={a.id}>
              <td className="historyDate">{dateText(a.created_at)}</td>
              {!isStudent&&<td><b>{studentName(a.student_id)}</b></td>}
              <td><span className="historyPoint">{a.icon} {a.points}점</span></td>
              <td><span className="historyCategory">{a.category}</span></td>
              <td className="historyReason">{a.reason}</td>
              {!isStudent&&<td>{giverName(a.giver_id)}</td>}
            </tr>)}
          </tbody>
        </table>
      </div>}
    </div>
  </>;
}

function Medals({me,students,activities}:{me:Profile;students:Student[];activities:Activity[]}){
  const list=students.filter(s=>s.active).slice().sort((a,b)=>{
    const ma=medalStatus(a,activities), mb=medalStatus(b,activities);
    if(mb.gold!==ma.gold)return Number(mb.gold)-Number(ma.gold);
    if(mb.silver!==ma.silver)return Number(mb.silver)-Number(ma.silver);
    if(mb.bronze!==ma.bronze)return Number(mb.bronze)-Number(ma.bronze);
    return mb.points-ma.points;
  });

  return <>
    <Header
      title={me.role==="student"?"🏅 우리 청소년부 메달":"🏅 메달 현황"}
      sub={me.role==="student"?"친구들과 메달·점수·미션 진행을 함께 비교할 수 있습니다.":"점수와 미션 조건을 모두 충족해야 메달을 획득합니다."}
    />

    <div className="medalSummary">
      <div className="card"><b>🥉 동메달</b><p>40점 + 봉사</p></div>
      <div className="card"><b>🥈 은메달</b><p>동메달 + 80점 + 제자훈련 + 신약통독</p></div>
      <div className="card"><b>🥇 금메달</b><p>은메달 + 전도 + 구약통독</p></div>
    </div>

    {me.role==="student"&&<div className="notice mt">
      다른 학생의 상세 활동 사유는 공개하지 않고, 비교에 필요한 메달·점수·미션 상태만 보여줍니다.
    </div>}

    <div className="card mt">
      {list.map((s,index)=>{
        const m=medalStatus(s,activities);
        const isMe=s.id===me.id;
        return <div className={`medalStudentRow ${isMe?"meRow":""}`} key={s.id}>
          <div className="medalStudentHead">
            <div className="medalRankName">
              <span className="medalRank">{index+1}위</span>
              <b>{profileOf(s)?.full_name||""}{isMe?" (나)":""}</b>
              <span>{m.points}점</span>
            </div>
            <div className="medalCurrent">{m.label}</div>
          </div>

          <div className="missionLine">
            <span className={s.service?"done":""}>봉사 {s.service?"✓":"○"}</span>
            <span className={s.discipleship?"done":""}>제자훈련 {s.discipleship?"✓":"○"}</span>
            <span className={s.nt_read?"done":""}>신약통독 {s.nt_read?"✓":"○"}</span>
            <span className={s.evangelism?"done":""}>전도 {s.evangelism?"✓":"○"}</span>
            <span className={s.ot_read?"done":""}>구약통독 {s.ot_read?"✓":"○"}</span>
          </div>

          <div className="medalSteps">
            <span className={m.bronze?"done":""}>🥉 {m.bronze?"획득":"진행"}</span>
            <span className={m.silver?"done":""}>🥈 {m.silver?"획득":"진행"}</span>
            <span className={m.gold?"done":""}>🥇 {m.gold?"획득":"진행"}</span>
          </div>
        </div>
      })}
    </div>
  </>;
}
function Ranking({students,activities,me}:{students:Student[];activities:Activity[];me:Profile}){
  const list=students.filter(s=>s.active).slice().sort((a,b)=>totalFor(b.id,activities)-totalFor(a.id,activities));
  return <><Header title="🏆 전체 비교" sub="현재 누적 점수 기준"/><div className="card">{list.map((s,i)=><Row key={s.id} left={`${i+1}위 ${profileOf(s)?.full_name||""}${s.id===me.id?" (나)":""}`} right={`${medalFor(s.id,students,activities)} ${totalFor(s.id,activities)}점`}/>)}</div></>;
}

function Board({me,posts,selected,setSelected,writing,setWriting,onDone}:{me:Profile;posts:Post[];selected:Post|null;setSelected:(p:Post|null)=>void;writing:boolean;setWriting:(b:boolean)=>void;onDone:()=>void}){
  if(writing)return <PostWriter me={me} onCancel={()=>setWriting(false)} onDone={async()=>{setWriting(false);await onDone();}}/>;
  if(selected){const fresh=posts.find(p=>p.id===selected.id)||selected;return <PostDetail me={me} post={fresh} onBack={()=>setSelected(null)} onDone={onDone}/>;}
  return <><div className="top"><div className="title"><h1>💬 청소년부 게시판</h1><p>서로의 글을 읽고 댓글로 대화할 수 있습니다.</p></div><button className="btn" onClick={()=>setWriting(true)}>✏️ 글쓰기</button></div><div className="boardlist">{posts.map(p=><button key={p.id} className="postcard" onClick={()=>setSelected(p)}><b>{p.title}</b><span>{p.profiles?.full_name||"사용자"} · 조회 {Number(p.view_count||0).toLocaleString("ko-KR")} · 댓글 {p.comments?.length||0} · 첨부 {p.post_media?.length||0}</span><p>{p.body}</p></button>)}{!posts.length&&<div className="card">아직 게시글이 없습니다.</div>}</div></>;
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
  const [viewCount,setViewCount]=useState(Number(post.view_count||0));
  useEffect(()=>{setViewCount(Number(post.view_count||0))},[post.view_count]);
  useEffect(()=>{
    let active=true;
    void recordView("post",post.id).then(count=>{
      if(active&&count!==null)setViewCount(count);
      if(count!==null)onDone();
    });
    return()=>{active=false};
  },[post.id]);
  async function addComment(){if(!comment.trim())return;const {error}=await supabase.from("comments").insert({post_id:post.id,author_id:me.id,body:comment.trim()});if(error)return alert(error.message);setComment("");await onDone();}
  async function deletePost(){if(!confirm("이 글을 삭제할까요?"))return;const paths=(post.post_media||[]).map(m=>m.path);if(paths.length)await supabase.storage.from("board-media").remove(paths);const {error}=await supabase.from("posts").delete().eq("id",post.id);if(error)return alert(error.message);await onDone();onBack();}
  return <><button className="btn gray" onClick={onBack}>← 목록</button><article className="card mt"><div className="posthead"><div><h2>{post.title}</h2><div className="muted">{post.profiles?.full_name||"사용자"} · {new Date(post.created_at).toLocaleString("ko-KR")} · 조회 {viewCount.toLocaleString("ko-KR")}</div></div>{(me.role==="admin"||me.id===post.author_id)&&<button className="btn red" onClick={deletePost}>삭제</button>}</div><p className="postbody">{post.body}</p><div className="media">{(post.post_media||[]).map(m=><Media key={m.id} row={m}/>)}</div><div className="comments"><h3>댓글 {post.comments?.length||0}</h3>{post.comments?.map(c=><div className="comment" key={c.id}><b>{c.profiles?.full_name||"사용자"}</b><p>{c.body}</p></div>)}<div className="commentform"><input className="input" value={comment} onChange={e=>setComment(e.target.value)} placeholder="댓글을 입력하세요"/><button className="btn" onClick={addComment}>댓글</button></div></div></article></>;
}
function Media({row}:{row:MediaRow}){
  const [url,setUrl]=useState("");
  useEffect(()=>{const {data}=supabase.storage.from("board-media").getPublicUrl(row.path);setUrl(data.publicUrl)},[row.path]);
  if(!url)return null;
  return row.media_type.startsWith("video/")?<video controls src={url}/>:<img src={url} alt="게시글 첨부"/>;
}
function Settings(){return <><Header title="⚙ 설정"/><div className="card"><h3>권한</h3><Row left="관리자" right="전체 관리"/><Row left="선생님" right="신앙 체크·성경 진도·점수·메달·게시판"/><Row left="학생" right="나의 신앙·성경 진도 직접 기록·친구 하루 체크 비교·성장·메달·게시판·순위"/></div></>}
