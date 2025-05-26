import { NextResponse } from "next/server";
import { initLivePriceStream, getLastPrice } from "../../lib/databentoLivePrice";

export async function GET() {
  await initLivePriceStream();

  const price = getLastPrice();
  return NextResponse.json({ price: price ?? null });
}
