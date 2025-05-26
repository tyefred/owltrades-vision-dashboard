'use client';

import { useEffect, useState } from 'react';

export function useLivePrice() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/live-price');
        const data = await res.json();
        setPrice(data.price ?? null);
      } catch (err) {
        console.error('Failed to fetch from /api/live-price:', err);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 15000);
    return () => clearInterval(interval);
  }, []);

  return price;
}
