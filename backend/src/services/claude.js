const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const LENGTH_MAP = {
  short: '3문장 이내',
  medium: '5-7문장',
  long: '10문장 이내',
};

const TONE_MAP = {
  neutral: '중립적이고 객관적인',
  professional: '전문적이고 분석적인',
  easy: '쉽고 친근한',
};

/**
 * Stream a Claude summary via SSE.
 * @param {object} params
 * @param {string} params.content - Article text to summarize
 * @param {string} params.length - "short" | "medium" | "long"
 * @param {string} params.tone - "neutral" | "professional" | "easy"
 * @param {import('express').Response} res - Express response object (SSE)
 */
async function streamSummary({ content, length, tone }, res) {
  const lengthStr = LENGTH_MAP[length] || LENGTH_MAP.medium;
  const toneStr = TONE_MAP[tone] || TONE_MAP.neutral;

  const userPrompt = `다음 기사를 ${lengthStr} 길이로 ${toneStr} 톤으로 요약해주세요:\n\n${content}`;

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: '당신은 기사 요약 전문가입니다. 한국어로 핵심 내용을 간결하게 요약합니다.',
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      const text = chunk.delta.text;
      res.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
    }
  }

  await stream.finalMessage();
  res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
}

module.exports = { streamSummary };
