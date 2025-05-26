export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getActiveMNQSymbol } from "../../lib/data/databento/getActiveMNQSymbol";

export async function GET() {
  const symbol = getActiveMNQSymbol(); // assumes this is synchronous
  const API_KEY = process.env.DATABENTO_API_KEY;

  if (!API_KEY || !symbol) {
    return NextResponse.json(
      { price: null, error: "Missing API key or symbol" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch("https://api.databento.com/v0/last", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        dataset: "GLBX.MDP3",
        schema: "trades",
        symbols: [symbol],
      }),
    });

    const data = await res.json();
    const px = data?.[0]?.px;

    return NextResponse.json({ price: typeof px === "number" ? px : null });
  } catch (err) {
    console.error("Databento fetch error:", err);
    return NextResponse.json({ price: null, error: "Fetch failed" }, { status: 500 });
  }
}
