import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  // Optional: cron protection
  if (
    process.env.CRON_SECRET &&
    req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    console.warn('⛔ Unauthorized cron access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ✅ Fetch live price from Yahoo Finance (NQ Futures)
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/NQ=F');
    const json = await res.json();
    const currentPrice = json?.chart?.result?.[0]?.meta?.regularMarketPrice;

    if (!currentPrice) throw new Error('Unable to get price from Yahoo Finance');

    // ✅ Get the active trade (if any)
    const { data: trades } = await supabase
      .from('trade_lifecycle')
      .select('*')
      .eq('exited', false)
      .order('created_at', { ascending: false })
      .limit(1);

    const trade = trades?.[0];
    if (!trade) return NextResponse.json({ status: 'no-active-trade' });

    const isLong = trade.direction === 'long';
    const hasEntered = trade.entry_triggered;
    const hasBreakeven = trade.breakeven_reached;

    const shouldEnter = isLong
      ? currentPrice >= trade.entry_price
      : currentPrice <= trade.entry_price;

    const shouldSL = isLong
      ? currentPrice <= trade.stop_loss
      : currentPrice >= trade.stop_loss;

    const shouldTP = isLong
      ? currentPrice >= trade.target_price
      : currentPrice <= trade.target_price;

    const updates: any = {};

    if (!hasEntered && shouldEnter) {
      updates.entry_triggered = true;
      updates.entry_time = new Date().toISOString();
    }

    if (hasEntered && !hasBreakeven) {
      const rrDistance = Math.abs(trade.entry_price - trade.stop_loss);
      const breakevenPrice = isLong
        ? trade.entry_price + rrDistance
        : trade.entry_price - rrDistance;

      const crossed = isLong
        ? currentPrice >= breakevenPrice
        : currentPrice <= breakevenPrice;

      if (crossed) updates.breakeven_reached = true;
    }

    if (hasEntered && (shouldTP || shouldSL)) {
      updates.exited = true;
      updates.exit_time = new Date().toISOString();
      updates.exit_reason = shouldTP ? 'TP' : 'SL';
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('trade_lifecycle').update(updates).eq('id', trade.id);
    }

    return NextResponse.json({
      status: 'updated',
      price: currentPrice,
      updates,
    });
  } catch (err) {
    console.error('❌ Price check error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
