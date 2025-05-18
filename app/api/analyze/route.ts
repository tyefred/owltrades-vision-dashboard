import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import OpenAI from "openai";

// ✅ Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET(req: NextRequest) {
  try {
    // ✅ Fetch most recent screenshot from the configured folder
    const result = await cloudinary.search
      .expression(`folder:${process.env.CLOUDINARY_FOLDER} AND resource_type:image`)
      .sort_by("created_at", "desc")
      .max_results(1)
      .execute();

    const image = result.resources[0]?.secure_url;
    if (!image) throw new Error("No images found in Cloudinary folder.");

    // ✅ Ask GPT-4o to analyze the image
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
    return Response.json({ image, summary });

  } catch (err: any) {
    console.error("[API ERROR]", err);
    return Response.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
