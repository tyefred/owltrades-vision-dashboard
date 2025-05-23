import { NextResponse } from "next/server";
import { getCurrentPriceFromDatabento } from "../../lib/data/databento/getCurrentPrice";
import { getActiveTrade, updateTradeStatus } from "../../lib/data/trades";

export async function GET() {
  try {
    console.log("[/api/price-check] Checking price...");

    const price = await getCurrentPriceFromDatabento();
    if (!price) {
      console.warn("[/api/price-check] No price available — likely outside market hours.");
      return NextResponse.json({
        message: "Market inactive — no recent tick data from Databento.",
      });
    }

    console.log("[/api/price-check] Current price:", price);

    const trade = await getActiveTrade();
    if (!trade) {
      console.log("[/api/price-check] No active trade.");
      return NextResponse.json({ message: "No active trade" });
    }

    const { id, stop_loss: stop, target_price: target } = trade;

    if (price <= stop) {
      console.log(`[STOP LOSS] Price ${price} hit stop at ${stop}`);
      await updateTradeStatus(id, "SL");
      return NextResponse.json({ message: "Trade stopped." });
    }

    if (price >= target) {
      console.log(`[TARGET HIT] Price ${price} hit target at ${target}`);
      await updateTradeStatus(id, "TP");
      return NextResponse.json({ message: "Trade target hit." });
    }

    return NextResponse.json({ message: "Trade still active", price });

  } catch (err) {
    console.error("[/api/price-check] ERROR:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
