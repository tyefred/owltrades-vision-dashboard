import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { analyzeImage } from '../../lib/visionAnalyzer';
import { insertNewTrade } from '../../lib/tradeLifecycle';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    // Step 1: Get latest screenshot
    const { data, error } = await supabase
      .from('uploaded_images')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data?.url) {
      console.error('Screenshot fetch error:', error);
      return NextResponse.json(
        { status: 'error', message: 'No uploaded image found.' },
        { status: 500 }
      );
    }

    const imageUrl = data.url;
    const uploadedAt = data.created_at;

    // Step 2: Analyze it using Vision AI
    const result = await analyzeImage(imageUrl);

    // Step 3: Optionally insert trade into Supabase
    if (result.setupDetected && result.entryPrice && result.stopLoss && result.target) {
      await insertNewTrade({
        setup_detected: true,
        entry_triggered: false,
        entry_price: result.entryPrice,
        stop_loss: result.stopLoss,
        target_price: result.target,
        breakeven_reached: false,
        exited: false,
        screenshot_url: imageUrl,
      });
    }

    // Step 4: Return to dashboard
    return NextResponse.json({
      image: imageUrl,
      summary: result.summary,
      uploadedAt,
    });
  } catch (err) {
    console.error('Analyze route error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
