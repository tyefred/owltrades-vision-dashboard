import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export type VisionAnalysisResult = {
  setupDetected: boolean;
  direction: 'long' | 'short' | null;
  entryPrice: number | null;
  stopLoss: number | null;
  target: number | null;
  summary: string;
};

export async function analyzeImage(imageUrl: string): Promise<VisionAnalysisResult> {
  const prompt = `
You are an elite futures trading assistant. Visually analyze the provided chart and return either a long or short A+ setup, or reject it.

SETUP DETECTION LOGIC:

✅ LONG SETUP
- Price is above both the 9 and 21 EMA
- Pullback to 9 or 21 EMA
- Breakout candle closes ABOVE prior pullback high
- Breakout has increased volume
- Flag or wedge structure preferred
- Entry = close of breakout candle
- Stop = Entry - (Tick Risk × 0.25)
- Target = Entry + (2 × (Entry - Stop))

✅ SHORT SETUP
- Price is below both the 9 and 21 EMA
- Pullback to 9 or 21 EMA
- Breakdown candle closes BELOW prior pullback low
- Breakdown has increased volume
- Bear flag or wedge preferred
- Entry = close of breakdown candle
- Stop = Entry + (Tick Risk × 0.25)
- Target = Entry - (2 × (Stop - Entry))

📌 TICK RISK:
If the chart displays a “Tick Risk” value (top-right corner), use it.
- Each tick = 0.25
- Use Tick Risk × 0.25 to calculate stop distance
- DO NOT use swing high/low if Tick Risk is visible

📦 RESPONSE FORMAT:
Return **ONLY** valid JSON — no markdown, no explanation:

{
  "setupDetected": true,
  "direction": "short",
  "entryPrice": 21500.25,
  "stopLoss": 21506.50,
  "target": 21487.50,
  "summary": "A+ short setup with Tick Risk 25 (6.25 pts). Breakdown below pullback with volume."
}

If no valid setup is present:

{
  "setupDetected": false,
  "direction": null,
  "entryPrice": null,
  "stopLoss": null,
  "target": null,
  "summary": "No A+ setup detected."
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a precise trading setup detector. Only respond with strict JSON.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    console.log('🔍 Raw Vision response:', content);

    const cleaned = content?.replace(/```json|```/g, '').trim();
    const json = JSON.parse(cleaned ?? '');

    return {
      setupDetected: !!json.setupDetected,
      direction: json.direction ?? null,
      entryPrice: json.entryPrice ?? null,
      stopLoss: json.stopLoss ?? null,
      target: json.target ?? null,
      summary: json.summary ?? 'No summary returned.',
    };
  } catch (err) {
    console.error('❌ Vision API Error:', err);
    return {
      setupDetected: false,
      direction: null,
      entryPrice: null,
      stopLoss: null,
      target: null,
      summary: '❌ Vision API error — check logs for more detail.',
    };
  }
}
