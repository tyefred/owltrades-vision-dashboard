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
You are an elite futures trading assistant. Your job is to visually inspect the chart and detect either an A+ long OR A+ short setup.

LONG CRITERIA:
- Price is above the 9 and 21 EMA stack
- Pullback to the 9 or 21 EMA
- Breakout candle closes ABOVE the pullback high
- Breakout occurs on increased volume
- Structure is clean: flag or wedge preferred
- Entry is the close of the breakout candle
- Stop Loss is below the most recent swing low
- Target is 2x the risk

SHORT CRITERIA:
- Price is below the 9 and 21 EMA stack
- Pullback back up into the 9 or 21 EMA
- Breakdown candle closes BELOW the pullback low
- Breakdown occurs on increased volume
- Structure is clean: bear flag or wedge preferred
- Entry is the close of the breakdown candle
- Stop Loss is above the most recent swing high
- Target is 2x the risk

RESPONSE FORMAT (return ONLY this JSON — no explanation, markdown, or wrapping):

{
  "setupDetected": true,
  "direction": "short",  // or "long"
  "entryPrice": 21500.25,
  "stopLoss": 21518.00,
  "target": 21464.00,
  "summary": "Bear flag into 21 EMA with breakdown candle on volume below swing low."
}

If no valid setup is present, respond with:

{
  "setupDetected": false,
  "direction": null,
  "entryPrice": null,
  "stopLoss": null,
  "target": null,
  "summary": "No valid A+ setup detected."
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a precise trading setup detector.',
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
