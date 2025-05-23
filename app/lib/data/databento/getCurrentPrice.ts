import { getActiveMNQSymbol } from "./getActiveMNQSymbol";

export async function getCurrentPriceFromDatabento(): Promise<number | null> {
  try {
    const symbol = getActiveMNQSymbol();

    const res = await fetch(
      `https://live.databento.com/v0/last?dataset=GLBX.MDP3&symbols=${symbol}`,
      {
        headers: {
          "X-API-Key": process.env.DATABENTO_API_KEY!,
        },
      }
    );

    if (!res.ok) {
      console.error("Databento error:", await res.text());
      return null;
    }

    const json = await res.json();
    console.log(`[Databento] Response for ${symbol}:`, JSON.stringify(json, null, 2));

    if (!Array.isArray(json) || json.length === 0 || !json[0]?.px) {
      console.warn(`No tick data for symbol ${symbol}`);
      return null;
    }

    return parseFloat(json[0].px);
  } catch (err) {
    console.error("Failed to fetch price from Databento:", err);
    return null;
  }
}
