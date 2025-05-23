// app/api/auth/ninjatrader/login/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NINJA_CLIENT_ID!;
  const redirectUri = encodeURIComponent("https://owltrades-vision-dashboard.vercel.app/api/auth/ninjatrader/callback");
  const scope = encodeURIComponent("marketdata");

  const url = `https://login.ninjatrader.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

  return NextResponse.redirect(url);
}
