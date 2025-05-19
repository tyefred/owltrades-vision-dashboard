import { NextResponse } from 'next/server';
import { insertNewTrade } from '../../lib/tradeLifecycle';

export async function POST(req: Request) {
  try {
    const now = new Date().toISOString();
    const fakeImage = 'https://placehold.co/800x400?text=Vision+AI+Chart';

    // Inject a fake trade for UI testing
    await insertNewTrade({
      setup_detected: true,
      entry_triggered: true,
      entry_price: 21500.25,
      stop_loss: 21475.75,
      target_price: 21600,
      breakeven_reached: true,
      exited: true,
      exit_reason: 'TP',
      screenshot_url: fakeImage,
      entry_time: now,
      exit_time: now,
    });

    // Return mocked AI response
    return NextResponse.json({
      image: fakeImage,
      summary: '✅ A+ Setup: EMA pullback + breakout with volume above PDH. Target hit.',
      uploadedAt: now,
    });
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
