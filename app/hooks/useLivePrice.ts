// app/hooks/useLivePrice.ts
"use client";

import { useEffect, useState } from "react";

export function useLivePrice() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      const res = await fetch("/api/last-price");
      const data = await res.json();
      setPrice(data.price ?? null);
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000); // every 10s
    return () => clearInterval(interval);
  }, []);

  return price;
}
