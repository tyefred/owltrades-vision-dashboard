// app/lib/databentoLivePrice.ts
import { getActiveMNQSymbol } from "./getActiveMNQSymbol";

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

export function getLastPrice(): number | null {
  return lastPrice;
}
