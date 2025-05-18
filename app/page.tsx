"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [imageUrl, setImageUrl] = useState("");
  const [analysis, setAnalysis] = useState("Loading...");
  const [timestamp, setTimestamp] = useState("");

  const fetchData = async () => {
    const res = await fetch("/api/analyze");
    const data = await res.json();
    setImageUrl(data.image);
    setAnalysis(data.summary);
    setTimestamp(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-6">📈 OwlTrades Vision AI</h1>
      {imageUrl && <img src={imageUrl} alt="Chart" className="mb-4 border shadow-lg max-w-[90%]" />}
      <div className="bg-white p-4 rounded shadow max-w-xl">
        <p className="text-gray-600 mb-2">🧠 GPT-4o Analysis (Updated: {timestamp})</p>
        <pre className="whitespace-pre-wrap text-sm">{analysis}</pre>
      </div>
    </main>
  );
}
