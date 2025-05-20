import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { analyzeImage } from '../../lib/visionAnalyzer';
import { insertNewTrade, getLatestTrade } from '../../lib/tradeLifecycle';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { imageUrl, uploadedAt } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    const result = await analyzeImage(imageUrl);

    if (
      result.setupDetected &&
      result.entryPrice &&
      result.stopLoss &&
      result.target &&
      result.direction
    ) {
      const active = await getLatestTrade();
      if (!active || active.exited) {
        await insertNewTrade({
          setup_detected: true,
          entry_triggered: false,
          direction: result.direction,
          entry_price: result.entryPrice,
          stop_loss: result.stopLoss,
          target_price: result.target,
          breakeven_reached: false,
          exited: false,
          screenshot_url: imageUrl,
        });
      } else {
        console.log('⏳ Active trade exists — skipping new insert.');
      }
    }

    return NextResponse.json({
      image: imageUrl,
      summary: result.summary,
      uploadedAt,
    });
  } catch (err) {
    console.error('❌ Analyze route error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
