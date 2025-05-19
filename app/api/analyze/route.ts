import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET() {
  // 🧠 1. Check AI toggle first
  const { data: settings, error: settingsError } = await supabase
    .from("ai_settings")
    .select("is_active")
    .limit(1)
    .single();

  const aiEnabled = settings?.is_active ?? false;
  console.log("AI Toggle Status:", aiEnabled);

  // 📸 2. Get latest screenshot
  const { data: latest, error: latestError } = await supabase
    .from("uploaded_images")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (latestError || !latest?.url || !latest?.public_id) {
    console.error("Screenshot fetch error:", latestError);
    return NextResponse.json({ error: "No screenshot found" }, { status: 500 });
  }

  if (!aiEnabled) {
    return NextResponse.json(
      {
        image: latest.url,
        uploadedAt: latest.created_at,
        summary: "⏸️ AI is paused. No analysis was run.",
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  // 🔁 3. If already analyzed, return cached summary
  const { data: existing } = await supabase
    .from("analyzed_images")
    .select("*")
    .eq("public_id", latest.public_id)
    .single();

  if (existing) {
    return NextResponse.json(
      {
        image: latest.url,
        uploadedAt: latest.created_at,
        summary: existing.summary,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  // 🤖 4. Run new GPT analysis
  let summary = "No analysis.";
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
You're a trading educator analyzing a live futures chart for educational purposes.

1. Identify any A+ setups with direction, entry, stop, and target.
2. If no setup, explain why.
              `.trim(),
            },
            { type: "image_url", image_url: { url: latest.url } },
          ],
        },
      ],
    });

    summary = completion.choices[0].message.content || "No response.";
  } catch (err) {
    console.error("OpenAI error:", err);
  }

  // 💾 5. Save result
  await supabase.from("analyzed_images").upsert({
    public_id: latest.public_id,
    url: latest.url,
    summary,
  });

  return NextResponse.json(
    {
      image: latest.url,
      uploadedAt: latest.created_at,
      summary,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
