// app/api/ai-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data } = await supabase
    .from("ai_settings")
    .select("is_active")
    .limit(1)
    .single();

  return NextResponse.json({ is_active: data?.is_active ?? false });
}

export async function POST(req: NextRequest) {
  const { is_active } = await req.json();

  const { error } = await supabase
    .from("ai_settings")
    .update({ is_active })
    .neq("is_active", is_active);

  return NextResponse.json({ is_active });
}
