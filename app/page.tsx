"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [imageUrl, setImageUrl] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [uploadedAt, setUploadedAt] = useState("");
  const [countdown, setCountdown] = useState(60);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/analyze");
      const data = await res.json();

      if (data?.image) {
        setImageUrl(`${data.image}?updated=${Date.now()}`); // 👈 force new image fetch
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
    fetchData();
    const fetchInterval = setInterval(fetchData, 60000);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-6 space-y-6">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">🦉 OwlTrades Vision AI</h1>

      <div className="text-sm text-gray-600 mb-2">
        Next update in <span className="font-semibold">{countdown}s</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl w-full">
        <div className="flex flex-col items-center">
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

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>🧠 GPT-4o Analysis</span>
            <span>Updated: {timestamp}</span>
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
            {analysis}
          </div>
        </div>
      </div>
    </main>
  );
}
