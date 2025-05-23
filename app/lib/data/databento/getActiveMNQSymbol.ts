// app/lib/data/databento/getActiveMNQSymbol.ts

export function getActiveMNQSymbol(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-1); // "5" for 2025

  const month = now.getMonth() + 1; // Jan = 1

  // Determine current quarter symbol code
  const contractMap: [number, string][] = [
    [3, "H"], // March
    [6, "M"], // June
    [9, "U"], // September
    [12, "Z"], // December
  ];

  let symbolCode = "Z";

  for (const [cutoffMonth, code] of contractMap) {
    if (month <= cutoffMonth) {
      symbolCode = code;
      break;
    }
  }

  return `MNQ${symbolCode}${year}`;
}
