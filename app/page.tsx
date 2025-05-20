'use client';

import { useEffect, useState } from 'react';
import TradeStatePanel from './components/TradeStatePanel';
import TradeLogPanel from './components/TradeLogPanel';

export default function Home() {
  const [imageUrl, setImageUrl] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [uploadedAt, setUploadedAt] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [aiActive, setAiActive] = useState(true);

  const fetchAIStatus = async () => {
    try {
      const res = await fetch('/api/ai-status');
      const data = await res.json();
      setAiActive(data.is_active);
    } catch (err) {
      console.error('Failed to fetch AI status:', err);
    }
  };

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

  const fetchData = async () => {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: "",          // optional: use current image
        currentPrice: 0,       // set dynamically later
        timestamp: new Date().toISOString(),
      }),
    });
    const data = await res.json();

    if (data?.image) {
      setImageUrl(`${data.image}?updated=${Date.now()}`);
      setAnalysis(data.summary);
      setUploadedAt(data.uploadedAt);
      setTimestamp(new Date().toLocaleTimeString());
      setCountdown(60);
    } else {
      console.error("No image or summary returned:", data);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
};

  useEffect(() => {
  let lastSeenId: string | null = null;

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

        // Run analysis on exact screenshot
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
          setCountdown(60);
        } else {
          console.warn('No image or summary returned from analysis');
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  checkForNewScreenshot(); // run once
  const interval = setInterval(checkForNewScreenshot, 5000);
  return () => clearInterval(interval);
}, []);


  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-6 space-y-6">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">🦉 OwlTrades Vision AI</h1>

      <div className="text-sm text-gray-600 mb-2">
        Next update in <span className="font-semibold">{countdown}s</span>
      </div>

      <button
        onClick={toggleAI}
        className={`px-4 py-2 rounded text-white transition ${
          aiActive ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {aiActive ? '⏸️ Pause AI Analysis' : '▶️ Start AI Analysis'}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl w-full mt-6">
        {/* Chart + Screenshot */}
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

        {/* AI Analysis */}
        <div className="col-span-1 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>🧠 GPT-4o Analysis</span>
            <span>Updated: {timestamp}</span>
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
            {analysis}
          </div>
        </div>

        {/* Trade Lifecycle Panel */}
        <div className="col-span-1">
          <TradeStatePanel />
        </div>
      </div>

<TradeLogPanel />

    </main>
  );
}
