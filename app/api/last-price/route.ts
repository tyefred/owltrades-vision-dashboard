import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.databento.com/v0/last", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.DATABENTO_API_KEY!,
      },
      body: JSON.stringify({
        dataset: "GLBX.MDP3",
        schema: "trades",
        symbols: ["MNQM5"],
      }),
    });

    const data = await res.json();

    console.log("Databento response:", data); // 🐛 Add this
    const px = data?.[0]?.px;

    return NextResponse.json({
      price: typeof px === "number" ? px : null,
      raw: data,
    });
  } catch (err) {
    console.error("Databento fetch failed", err);
    return NextResponse.json({ price: null, error: "Fetch failed" });
  }
}
