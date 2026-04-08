require('dotenv').config();
const express = require('express');
const cors = require('cors');
const summarizeRouter = require('./routes/summarize');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://article-summary-pro.vercel.app',
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : []),
];

app.use(cors({
  origin: allowedOrigins,
}));

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', summarizeRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: '서버 오류가 발생했습니다.',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`ArticleSummary Pro backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
