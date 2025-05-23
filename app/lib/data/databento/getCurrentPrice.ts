// lib/data/databento/getCurrentPrice.ts

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
    const last = json?.[0]?.px;

    return last ? parseFloat(last) : null;
  } catch (err) {
    console.error("Failed to fetch price from Databento:", err);
    return null;
  }
}
