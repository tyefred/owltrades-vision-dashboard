// app/api/last-price/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.databento.com/v0/last", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.DATABENTO_API_KEY!, // store this in .env.local
      },
      body: JSON.stringify({
        dataset: "GLBX.MDP3",
        schema: "trades",
        symbols: ["MNQM4"], // or whatever current contract works
      }),
    });

    const data = await res.json();
    const px = data?.[0]?.px;
    return NextResponse.json({ price: typeof px === "number" ? px : null });
  } catch (err) {
    console.error("Databento fetch failed", err);
    return NextResponse.json({ price: null, error: "Databento fetch failed" });
  }
}
