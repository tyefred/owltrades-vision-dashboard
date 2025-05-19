import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export type VisionAnalysisResult = {
  setupDetected: boolean;
  entryPrice: number | null;
  stopLoss: number | null;
  target: number | null;
  summary: string;
};

export async function analyzeImage(imageUrl: string): Promise<VisionAnalysisResult> {
  const prompt = `
You are a professional futures trader assistant. Visually analyze the chart and respond only in this strict JSON format:

{
  "setupDetected": true or false,
  "entryPrice": number or null,
  "stopLoss": number or null,
  "target": number or null,
  "summary": "brief explanation of what you see and why this is or isn’t an A+ setup"
}

Trading plan:
- Only confirm A+ setups that meet the following criteria:
  - Clear trend direction (price above/below 9/21 EMA stack)
  - Pullback to EMA or key level (PDH/ONH/VWAP)
  - Bull/bear flag or tight consolidation
  - Breakout candle on increased volume
  - Avoid chop, ORB, or weak follow-through
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
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

    const json = JSON.parse(content ?? '');
    return {
      setupDetected: !!json.setupDetected,
      entryPrice: json.entryPrice ?? null,
      stopLoss: json.stopLoss ?? null,
      target: json.target ?? null,
      summary: json.summary ?? 'No summary returned.',
    };
  } catch (err) {
    console.error('❌ Vision API Error:', err);
    return {
      setupDetected: false,
      entryPrice: null,
      stopLoss: null,
      target: null,
      summary: '❌ Vision API error — check logs for more detail.',
    };
  }
}
