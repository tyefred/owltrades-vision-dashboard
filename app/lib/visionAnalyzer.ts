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
You are an elite futures trading assistant. Visually analyze the chart and return either a long or short A+ setup — or at minimum, any clean breakout/pullback structure.

CRITERIA FOR TRIGGERING SETUP (Loosened):
- Price generally trending (not sideways chop)
- EMAs should support the move, but minor overlap is allowed
- Pullback and continuation structure is preferred, but not required to be perfect
- Entry = breakout or breakdown candle close
- Stop = Entry ± (Tick Risk × 0.25)
- Target = 2x risk

If the chart shows "Tick Risk" (top-right), use it to determine stop size. Use:
- Stop = Entry - (Tick Risk × 0.25) for long
- Stop = Entry + (Tick Risk × 0.25) for short
- Target = 2x risk distance

RESPONSE FORMAT:
{
  "setupDetected": true,
  "direction": "long" | "short",
  "entryPrice": 21500.25,
  "stopLoss": 21493.75,
  "target": 21513.75,
  "summary": "Clean uptrend continuation. Tick Risk 25 used to size SL."
}

If you see nothing usable, return:
{
  "setupDetected": false,
  "direction": null,
  "entryPrice": null,
  "stopLoss": null,
  "target": null,
  "summary": "No valid setup."
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
