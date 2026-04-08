const express = require('express');
const router = express.Router();
const { scrapeArticle } = require('../services/scraper');
const { streamSummary } = require('../services/claude');

router.post('/summarize', async (req, res) => {
  const { type, content, length = 'medium', tone = 'neutral' } = req.body;

  if (!type || !content) {
    return res.status(400).json({ error: 'type과 content는 필수입니다.' });
  }

  if (!['url', 'text'].includes(type)) {
    return res.status(400).json({ error: 'type은 "url" 또는 "text"여야 합니다.' });
  }

  if (!['short', 'medium', 'long'].includes(length)) {
    return res.status(400).json({ error: 'length는 "short", "medium", "long" 중 하나여야 합니다.' });
  }

  if (!['neutral', 'professional', 'easy'].includes(tone)) {
    return res.status(400).json({ error: 'tone은 "neutral", "professional", "easy" 중 하나여야 합니다.' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let finished = false;
  const timeout = setTimeout(() => {
    if (!finished) {
      finished = true;
      res.write(`data: ${JSON.stringify({ type: 'error', message: '요청 시간이 초과되었습니다. 다시 시도해주세요.' })}\n\n`);
      res.end();
    }
  }, 30000);

  try {
    let articleContent = '';
    let articleTitle = '';
    let originalText = '';

    if (type === 'url') {
      res.write(`data: ${JSON.stringify({ type: 'status', message: 'URL에서 기사를 가져오는 중...' })}\n\n`);

      try {
        const scraped = await scrapeArticle(content.trim());
        articleContent = scraped.content;
        articleTitle = scraped.title;
        originalText = scraped.content;
      } catch (scrapeErr) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: scrapeErr.message })}\n\n`);
        clearTimeout(timeout);
        finished = true;
        return res.end();
      }
    } else {
      articleContent = content.trim();
      originalText = content.trim();

      if (articleContent.length < 10) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: '기사 내용이 너무 짧습니다.' })}\n\n`);
        clearTimeout(timeout);
        finished = true;
        return res.end();
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Claude AI가 요약 중...' })}\n\n`);

    if (articleTitle) {
      res.write(`data: ${JSON.stringify({ type: 'title', title: articleTitle })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'originalText', text: originalText })}\n\n`);

    await streamSummary({ content: articleContent, length, tone }, res);

  } catch (err) {
    console.error('Summarize error:', err);
    const message = err.status === 401
      ? 'API 키가 유효하지 않습니다. 백엔드 .env 파일을 확인해주세요.'
      : err.message || '요약 중 오류가 발생했습니다.';
    res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
  } finally {
    clearTimeout(timeout);
    finished = true;
    res.end();
  }
});

module.exports = router;
