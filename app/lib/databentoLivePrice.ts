// app/lib/databentoLivePrice.ts
import { getActiveMNQSymbol } from "./data/databento/getActiveMNQSymbol";

let socket: WebSocket | null = null;
let lastPrice: number | null = null;
let activeSymbol: string | null = null;
let connecting = false;

export async function initLivePriceStream() {
  if (socket || connecting) return;

  connecting = true;
  activeSymbol = await getActiveMNQSymbol();
  const API_KEY = process.env.DATABENTO_API_KEY;

  if (!API_KEY || !activeSymbol) {
    console.error("❌ Missing Databento API key or active symbol");
    connecting = false;
    return;
  }

  const ws = new WebSocket("wss://live.databento.com/v0/live");
  socket = ws;

  ws.onopen = () => {
    console.log(`🟢 Subscribing to ${activeSymbol}`);
    ws.send(
      JSON.stringify({
        action: "subscribe",
        dataset: "GLBX.MDP3",
        schema: "trades",
        symbols: [activeSymbol],
        encoding: "json",
        key: API_KEY,
      })
    );
    connecting = false;
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.schema === "trades" && data.symbol === activeSymbol && data.px) {
      lastPrice = data.px;
    }
  };

  ws.onerror = (err) => console.error("❌ WebSocket error", err);
  ws.onclose = () => {
    console.warn("🔌 WebSocket closed");
    socket = null;
    connecting = false;
  };
}

export async function getLastPrice(): Promise<number | null> {
  const API_KEY = process.env.DATABENTO_API_KEY!;
  const symbol = getActiveMNQSymbol(); // assuming this is still sync

  try {
    const res = await fetch("https://live.databento.com/v0/last", {
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
    return typeof px === "number" ? px : null;
  } catch (err) {
    console.error("Databento REST fetch failed:", err);
    return null;
  }
}
