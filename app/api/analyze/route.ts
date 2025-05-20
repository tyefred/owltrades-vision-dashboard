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
    // Get the latest uploaded screenshot
    const { data: imageData, error: imageError } = await supabase
      .from('uploaded_images')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (imageError || !imageData?.url) {
      console.error('📷 Screenshot fetch error:', imageError);
      return NextResponse.json(
        { status: 'error', message: 'No uploaded image found.' },
        { status: 500 }
      );
    }

    const imageUrl = imageData.url;
    const uploadedAt = imageData.created_at;

    // Run Vision AI on screenshot
    const result = await analyzeImage(imageUrl);

    // Only proceed if there's a valid setup
    if (result.setupDetected && result.entryPrice && result.stopLoss && result.target && result.direction) {
      // Check if there's an active trade
      const active = await getLatestTrade();
      if (!active || active.exited) {
        // Insert new trade
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
