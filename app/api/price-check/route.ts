export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    price: null,
    message: "Databento price check is disabled in this deployment environment.",
  });
}
