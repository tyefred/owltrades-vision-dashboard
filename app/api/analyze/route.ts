// app/api/analyze/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const dynamic = "force-dynamic"; // ⛔ prevent Vercel caching

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET() {
  const { data, error } = await supabase
    .from("uploaded_images")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.url) {
    console.error("Supabase query error:", error);
    return NextResponse.json({ error: "No screenshot found" }, { status: 500 });
  }

  const imageUrl = data.url;
  const uploadedAt = data.created_at;

  let summary = "No analysis.";
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "You're a professional scalper on NQ. What's the next A+ setup? Give me entry, take profit, and stop loss." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    summary = completion.choices[0].message.content || "No response.";
  } catch (err) {
    console.error("OpenAI error:", err);
  }

  return NextResponse.json(
    {
      image: imageUrl,
      uploadedAt,
      summary,
    },
    {
      headers: {
        "Cache-Control": "no-store", // ⛔ prevent stale responses
      },
    }
  );
}
