import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req:Request){
  const origin=req.headers.get("origin");
  if(origin&&new URL(origin).host!==new URL(req.url).host){
    return NextResponse.json({error:"허용되지 않은 요청입니다."},{status:403});
  }

  let body:{viewKey?:string;target?:string;postId?:number};
  try{body=await req.json();}
  catch{return NextResponse.json({error:"요청 형식이 올바르지 않습니다."},{status:400});}

  const viewKey=String(body.viewKey||"");
  if(!UUID_PATTERN.test(viewKey))return NextResponse.json({error:"조회 세션이 올바르지 않습니다."},{status:400});

  const admin=createAdminClient();
  if(body.target==="home"){
    const {data,error}=await admin.rpc("record_home_view",{p_view_key:viewKey});
    if(error)return NextResponse.json({error:"조회수 DB 설치가 필요합니다."},{status:503});
    return NextResponse.json({viewCount:Number(data||0)},{headers:{"cache-control":"no-store"}});
  }

  if(body.target==="post"){
    const postId=Number(body.postId);
    if(!Number.isSafeInteger(postId)||postId<1)return NextResponse.json({error:"게시글 번호가 올바르지 않습니다."},{status:400});
    const {data,error}=await admin.rpc("record_post_view",{p_view_key:viewKey,p_post_id:postId});
    if(error)return NextResponse.json({error:"조회수 DB 설치가 필요합니다."},{status:503});
    return NextResponse.json({viewCount:Number(data||0)},{headers:{"cache-control":"no-store"}});
  }

  return NextResponse.json({error:"조회 대상이 올바르지 않습니다."},{status:400});
}
