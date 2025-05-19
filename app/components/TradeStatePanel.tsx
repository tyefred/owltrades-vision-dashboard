'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

type TradeLifecycle = {
  id: string;
  setup_detected: boolean;
  entry_triggered: boolean;
  entry_price: number | null;
  stop_loss: number | null;
  target_price: number | null;
  breakeven_reached: boolean;
  exited: boolean;
  exit_reason: 'TP' | 'SL' | 'Manual' | null;
  entry_time: string | null;
  exit_time: string | null;
  screenshot_url: string | null;
};

export default function TradeStatePanel() {
  const [trade, setTrade] = useState<TradeLifecycle | null>(null);
  const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from('trade_lifecycle')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error) setTrade(data);
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 5000); // refresh every 5 sec
    return () => clearInterval(interval);
  }, []);

  if (!trade) return <div className="p-4 text-sm text-gray-400">Loading trade state...</div>;

  return (
    <div className="p-4 rounded-xl shadow-lg bg-zinc-900 text-white w-full max-w-md">
      <h2 className="text-lg font-bold mb-3">📊 Trade Lifecycle</h2>

      <ul className="space-y-2 text-sm">
        <li>
          <strong>Setup:</strong>{' '}
          {trade.setup_detected ? '✅ Confirmed' : '⏳ Waiting'}
        </li>
        <li>
          <strong>Entry:</strong>{' '}
          {trade.entry_triggered
            ? `✅ @ ${trade.entry_price}`
            : trade.setup_detected
            ? '🟡 Watching'
            : '—'}
        </li>
        <li>
          <strong>SL:</strong>{' '}
          {trade.stop_loss ? `${trade.stop_loss}` : '—'}
        </li>
        <li>
          <strong>Target:</strong>{' '}
          {trade.target_price ? `${trade.target_price}` : '—'}
        </li>
        <li>
          <strong>Breakeven:</strong>{' '}
          {trade.breakeven_reached ? '✅ Hit' : '❌ Not Yet'}
        </li>
        <li>
          <strong>Status:</strong>{' '}
          {trade.exited
            ? `Exited (${trade.exit_reason})`
            : trade.entry_triggered
            ? 'Trade Active'
            : 'Idle'}
        </li>
      </ul>

      {trade.screenshot_url && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-1">Screenshot:</p>
          <img
            src={trade.screenshot_url}
            alt="chart"
            className="rounded-lg border border-zinc-700"
          />
        </div>
      )}
    </div>
  );
}
