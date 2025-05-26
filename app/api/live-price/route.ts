export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getLastPrice } from "../../lib/databentoLivePrice";

export async function GET() {
  const price = await getLastPrice();
  return NextResponse.json({ price: price ?? null });
}
