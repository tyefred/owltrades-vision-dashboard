'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Trade = {
  id: string;
  created_at: string;
  direction: 'long' | 'short';
  entry_price: number;
  stop_loss: number;
  target_price: number;
  exited: boolean;
  exit_reason: 'TP' | 'SL' | 'Manual' | null;
  exit_time: string | null;
  screenshot_url: string;
};

export default function TradeLogPanel() {
  const [trades, setTrades] = useState<Trade[]>([]);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from('trade_lifecycle')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTrades(data);
    } else {
      console.error('Failed to fetch trade log:', error);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 w-full max-w-7xl">
      <h2 className="text-lg font-bold text-black-100 mb-2">📜 Trade Log</h2>
      <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-lg">
        <table className="min-w-full text-sm text-zinc-300">
          <thead className="bg-zinc-800 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2">Dir</th>
              <th className="px-3 py-2">Entry</th>
              <th className="px-3 py-2">SL</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Exit</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2">📷</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-t border-zinc-800">
                <td className="px-3 py-2">{new Date(t.created_at).toLocaleTimeString()}</td>
                <td className="px-3 py-2 text-center">
                  {t.direction === 'long' ? '🟢' : '🔴'}
                </td>
                <td className="px-3 py-2 text-right">{t.entry_price.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{t.stop_loss.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{t.target_price.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  {t.exited && t.exit_time
                    ? new Date(t.exit_time).toLocaleTimeString()
                    : '—'}
                </td>
                <td className="px-3 py-2 text-center">
                  {t.exited ? (t.exit_reason === 'TP' ? '✅ TP' : '🛑 SL') : '⏳ Open'}
                </td>
                <td className="px-3 py-2">
                  {t.screenshot_url && (
                    <a href={t.screenshot_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={t.screenshot_url}
                        alt="Chart"
                        className="h-8 w-14 object-cover rounded border border-zinc-700"
                      />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
