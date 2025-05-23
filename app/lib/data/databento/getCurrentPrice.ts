export async function getCurrentPriceFromDatabento(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://live.databento.com/v0/last?dataset=GLBX.MDP3&symbols=MNQM5",
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
    console.log("[Databento] Raw response:", JSON.stringify(json, null, 2));

    if (!Array.isArray(json) || json.length === 0 || !json[0]?.px) {
      console.warn("No tick data — likely outside market hours.");
      return null;
    }

    return parseFloat(json[0].px);
  } catch (err) {
    console.error("Failed to fetch price from Databento:", err);
    return null;
  }
}
