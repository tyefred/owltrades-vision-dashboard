// app/hooks/usePolledLivePrice.ts
"use client";

import { useEffect, useState } from "react";

export function usePolledLivePrice(intervalMs = 2000) {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/live-price");
        if (!res.ok) return;
        const data = await res.json();
        if (data.price) setPrice(data.price);
      } catch (err) {
        console.error("Failed to fetch price:", err);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return price;
}
