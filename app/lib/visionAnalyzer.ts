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
You are a futures trading assistant. Your task is to analyze the chart image and always return a trade setup, even if it's borderline or marginal.

INSTRUCTIONS:
- Assume some form of trend is present
- If there's any breakout, pullback, or impulse pattern, mark it as a setup
- Ignore EMA alignment or volume confirmation for now
- Use Tick Risk if it's visible in the top-right of the chart
  - Tick size = 0.25
  - For long: SL = Entry - (Tick Risk × 0.25)
  - For short: SL = Entry + (Tick Risk × 0.25)
  - TP = 2x risk distance

RESPONSE FORMAT (required):

{
  "setupDetected": true,
  "direction": "long" or "short",
  "entryPrice": 21500.25,
  "stopLoss": 21493.75,
  "target": 21513.75,
  "summary": "Test setup for validation. Tick Risk: 25."
}

Always fill in real numbers. Do not return nulls. Do not skip detection.

If you absolutely must say no setup, return:

{
  "setupDetected": false,
  "direction": null,
  "entryPrice": null,
  "stopLoss": null,
  "target": null,
  "summary": "No visible pattern at all"
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
