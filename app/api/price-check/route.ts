// app/api/price-check/route.ts

import { getCurrentPriceFromDatabento } from "@/app/lib/data/databento/getCurrentPrice";
import { getActiveTrade, updateTradeStatus } from "@/lib/data/trades";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("[/api/price-check] Checking price...");

    const price = await getCurrentPriceFromDatabento();
    if (!price) {
      console.warn("[/api/price-check] No price returned.");
      return NextResponse.json({ error: "Price unavailable" }, { status: 500 });
    }

    console.log("[/api/price-check] Current price:", price);

    const trade = await getActiveTrade();
    if (!trade) {
      console.log("[/api/price-check] No active trade.");
      return NextResponse.json({ message: "No active trade" });
    }

    const { entry, stop, target, id } = trade;

    if (price <= stop) {
      console.log(`[STOP LOSS] Price ${price} hit stop at ${stop}`);
      await updateTradeStatus(id, "stopped");
      return NextResponse.json({ message: "Trade stopped." });
    }

    if (price >= target) {
      console.log(`[TARGET HIT] Price ${price} hit target at ${target}`);
      await updateTradeStatus(id, "target_hit");
      return NextResponse.json({ message: "Trade target hit." });
    }

    console.log("[/api/price-check] Price within bounds.");
    return NextResponse.json({ message: "Trade still active", price });

  } catch (err) {
    console.error("[/api/price-check] ERROR:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
