import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const table = process.env.SUPABASE_TABLE || "uploaded_images";

    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?order=created_at.desc&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    const data = await res.json();
    const image = data[0]?.url;
    const uploadedAt = data[0]?.created_at;

    if (!image) throw new Error("No screenshot found in Supabase.");

    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional scalper. Analyze this futures chart visually.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Here's a chart screenshot. What do you see?
- What setup (if any) is forming?
- What are you waiting for to confirm an A+ trade?
- What's the current action: Watch, Enter, or Ignore?`,
            },
            {
              type: "image_url",
              image_url: { url: image, detail: "auto" },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const summary = chat.choices[0].message.content;
    return Response.json({ image, summary, uploadedAt });

  } catch (err: any) {
    console.error("[API ERROR]", err);
    return Response.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
