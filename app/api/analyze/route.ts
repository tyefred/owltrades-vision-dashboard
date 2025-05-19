import { NextResponse } from 'next/server';
import { getLatestTrade, insertNewTrade, updateTrade } from '@/app/lib/tradeLifecycle';

// Placeholder logic for AI — replace with real detectors later
function detectSetup(imageUrl: string) {
  // This should call your Vision AI and detect an A+ setup
  // For now, return a dummy response
  return { isValid: imageUrl.includes('setup') }; // crude placeholder
}

function detectEntry(currentPrice: number, lastTrade: any) {
  const entryPrice = lastTrade.entry_price ?? currentPrice;
  const trigger = currentPrice > entryPrice + 5; // adjust this logic
  return {
    triggered: trigger,
    price: currentPrice,
    stopLoss: currentPrice - 20, // 20 ticks SL
    target: currentPrice + 40,   // 40 ticks TP
  };
}

function detectBreakeven(currentPrice: number, trade: any) {
  return currentPrice >= (trade.entry_price ?? 0) + 30;
}

function detectStopOrTarget(currentPrice: number, trade: any) {
  if (currentPrice <= trade.stop_loss) return { reason: 'SL' };
  if (currentPrice >= trade.target_price) return { reason: 'TP' };
  return null;
}

export async function POST(req: Request) {
  try {
    const { imageUrl, currentPrice, timestamp } = await req.json();

    const latest = await getLatestTrade();

    // 1. No trade exists or previous trade exited — check for new setup
    if (!latest || (latest.exited && !latest.setup_detected)) {
      const setup = detectSetup(imageUrl);
      if (setup.isValid) {
        await insertNewTrade({
          setup_detected: true,
          screenshot_url: imageUrl,
          created_at: new Date(),
        });
        return NextResponse.json({ status: 'setup_detected', message: 'New A+ setup detected' });
      }
      return NextResponse.json({ status: 'watching', message: 'No setup yet' });
    }

    // 2. Setup detected but not entered
    if (latest.setup_detected && !latest.entry_triggered) {
      const entry = detectEntry(currentPrice, latest);
      if (entry.triggered) {
        await updateTrade(latest.id, {
          entry_triggered: true,
          entry_price: entry.price,
          entry_time: timestamp,
          stop_loss: entry.stopLoss,
          target_price: entry.target,
        });
        return NextResponse.json({ status: 'entry_triggered', message: 'Trade entry confirmed' });
      }
      return NextResponse.json({ status: 'setup_confirmed', message: 'Waiting for entry trigger' });
    }

    // 3. Trade active, manage it
    if (latest.entry_triggered && !latest.exited) {
      if (!latest.breakeven_reached && detectBreakeven(currentPrice, latest)) {
        await updateTrade(latest.id, { breakeven_reached: true });
        return NextResponse.json({ status: 'breakeven_reached', message: 'Breakeven status reached' });
      }

      const exit = detectStopOrTarget(currentPrice, latest);
      if (exit) {
        await updateTrade(latest.id, {
          exited: true,
          exit_reason: exit.reason,
          exit_time: timestamp,
        });
        return NextResponse.json({ status: 'trade_closed', message: `Trade exited: ${exit.reason}` });
      }

      return NextResponse.json({ status: 'trade_active', message: 'Trade still active' });
    }

    return NextResponse.json({ status: 'idle', message: 'No changes made' });
  } catch (error) {
    console.error('Analyze route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
