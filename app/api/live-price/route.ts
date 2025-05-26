// app/api/live-price/route.ts
import { NextResponse } from "next/server";
import { initLivePriceStream, getLastPrice } from "@/app/lib/databentoLivePrice";

export async function GET() {
  await initLivePriceStream();

  const price = getLastPrice();
  if (price === null) {
    return NextResponse.json({ message: "No recent tick" }, { status: 204 });
  }

  return NextResponse.json({ price });
}
