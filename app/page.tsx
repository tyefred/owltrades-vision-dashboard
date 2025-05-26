'use client';

import { useEffect, useState } from 'react';
import TradeStatePanel from './components/TradeStatePanel';
import TradeLogPanel from './components/TradeLogPanel';
import { getActiveMNQSymbol } from './lib/data/databento/getActiveMNQSymbol';

function useLivePrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://live.databento.com/v0/last", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": process.env.NEXT_PUBLIC_DATABENTO_API_KEY!,
          },
          body: JSON.stringify({
            dataset: "GLBX.MDP3",
            schema: "trades",
            symbols: [symbol],
          }),
        });

        const data = await res.json();
        const px = data?.[0]?.px;
        setPrice(typeof px === "number" ? px : null);
      } catch (err) {
        console.error("Client-side Databento fetch failed", err);
        setPrice(null);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 15000);
    return () => clearInterval(interval);
  }, [symbol]);

  return price;
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [uploadedAt, setUploadedAt] = useState('');
  const [aiActive, setAiActive] = useState(true);

  const symbol = getActiveMNQSymbol();
  const lastPrice = useLivePrice(symbol);

  const toggleAI = async () => {
    try {
      const res = await fetch('/api/ai-status', {
        method: 'POST',
        body: JSON.stringify({ is_active: !aiActive }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setAiActive(data.is_active);
    } catch (err) {
      console.error('Failed to toggle AI status:', err);
    }
  };

  useEffect(() => {
    let lastSeenId: string | null = null;

    const fetchAIStatus = async () => {
      try {
        const res = await fetch('/api/ai-status');
        const data = await res.json();
        setAiActive(data.is_active);
      } catch (err) {
        console.error('Failed to fetch AI status:', err);
      }
    };

    const checkForNewScreenshot = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/uploaded_images?select=id,url,created_at&order=created_at.desc&limit=1`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
          }
        );

        const [latest] = await res.json();
        if (!latest) return;

        if (latest.id !== lastSeenId) {
          lastSeenId = latest.id;

          const analyze = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: latest.url,
              uploadedAt: latest.created_at,
            }),
          });

          const data = await analyze.json();
          if (data?.image) {
            setImageUrl(`${data.image}?updated=${Date.now()}`);
            setAnalysis(data.summary);
            setUploadedAt(data.uploadedAt);
            setTimestamp(new Date().toLocaleTimeString());
          } else {
            console.warn('No image or summary returned from analysis');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    fetchAIStatus();
    checkForNewScreenshot();
    const interval = setInterval(checkForNewScreenshot, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-6 space-y-6">
      <h1 className="text-4xl font-bold text-blue-700 mb-1">🦉 OwlTrades Vision AI</h1>
      <p className="text-sm text-gray-500 mb-4">
        Active Contract: <span className="font-mono text-black">{symbol}</span>
        <span className="text-gray-700 font-semibold ml-4">
          Last Price:{' '}
          <span className="text-black font-mono">
            {lastPrice !== null ? lastPrice.toFixed(2) : '— (no recent tick)'}
          </span>
        </span>
      </p>

      <button
        onClick={toggleAI}
        className={`px-4 py-2 rounded text-white transition ${
          aiActive ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {aiActive ? '⏸️ Pause AI Analysis' : '▶️ Start AI Analysis'}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl w-full mt-6">
        <div className="col-span-1 flex flex-col items-center">
          {imageUrl && (
            <img
              key={imageUrl}
              src={imageUrl}
              alt="Chart Screenshot"
              className="rounded-lg shadow-xl border border-gray-300 max-w-full max-h-[500px] object-contain transition-opacity duration-300 opacity-0 animate-fade-in"
            />
          )}
          {uploadedAt && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Screenshot taken at: {new Date(uploadedAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="col-span-1 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>🧠 GPT-4o Analysis</span>
            <span>Updated: {timestamp}</span>
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
            {analysis}
          </div>
        </div>

        <div className="col-span-1">
          <TradeStatePanel />
        </div>
      </div>

      <TradeLogPanel />
    </main>
  );
}
