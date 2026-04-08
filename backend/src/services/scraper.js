const fetch = require('node-fetch');
const cheerio = require('cheerio');

const BLOCKED_PAID_DOMAINS = ['wsj.com', 'ft.com', 'bloomberg.com', 'economist.com', 'hbr.org'];
const BLOCKED_LOGIN_DOMAINS = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com'];
const BLOCKED_FILE_EXTENSIONS = ['.pdf', '.zip', '.exe', '.dmg', '.pkg', '.apk', '.rar', '.tar', '.gz', '.mp3', '.mp4', '.avi', '.mov'];

function validateUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('올바르지 않은 URL입니다.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // 내부 IP / localhost 차단
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  ) {
    throw new Error('접근할 수 없는 URL입니다.');
  }

  // 파일 URL 차단
  const pathname = parsed.pathname.toLowerCase();
  if (BLOCKED_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    throw new Error('요약할 수 없는 파일 형식입니다.');
  }

  // 유료 구독 사이트 차단
  if (BLOCKED_PAID_DOMAINS.some((domain) => hostname === domain || hostname.endsWith('.' + domain))) {
    throw new Error('유료 구독이 필요한 사이트입니다. 기사 본문을 직접 복사해서 텍스트 입력으로 요약해보세요.');
  }

  // 로그인 필요 사이트 차단
  if (BLOCKED_LOGIN_DOMAINS.some((domain) => hostname === domain || hostname.endsWith('.' + domain))) {
    throw new Error('로그인이 필요한 사이트는 지원하지 않습니다.');
  }
}

async function scrapeArticle(url) {
  validateUrl(url);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 8000,
    });

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .ad, .advertisement, .banner, .sidebar, .comment, .comments, noscript, iframe').remove();

    // Try to extract title
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').text().trim() ||
      '제목 없음';

    // Try to extract main article content using common selectors
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.article-body',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content-body',
      '#article-body',
      '#content',
      '.news-content',
      '.article_body',
      '.article-text',
      'main',
    ];

    let bodyText = '';

    for (const selector of contentSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        bodyText = el
          .find('p, h2, h3, h4, li')
          .map((_, el) => $(el).text().trim())
          .get()
          .filter((t) => t.length > 20)
          .join('\n');

        if (bodyText.length > 200) break;
      }
    }

    // Fallback: collect all paragraphs
    if (bodyText.length < 200) {
      bodyText = $('p')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((t) => t.length > 20)
        .join('\n');
    }

    // Final fallback: body text
    if (bodyText.length < 100) {
      bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    }

    const cleanText = bodyText
      .replace(/\t/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (cleanText.length < 50) {
      throw new Error('기사 본문을 추출할 수 없습니다. 해당 사이트는 스크래핑이 제한될 수 있습니다.');
    }

    return {
      title: title.replace(/\s+/g, ' ').trim().substring(0, 200),
      content: cleanText.substring(0, 4000),
    };
  } catch (err) {
    if (
      err.message.includes('기사') ||
      err.message.includes('HTTP') ||
      err.message.includes('유료') ||
      err.message.includes('로그인') ||
      err.message.includes('파일 형식') ||
      err.message.includes('접근할 수 없는')
    ) {
      throw err;
    }
    if (err.type === 'request-timeout' || err.code === 'ETIMEDOUT') {
      throw new Error('사이트 응답이 너무 느립니다. 잠시 후 다시 시도하거나 텍스트를 직접 입력해주세요.');
    }
    throw new Error(`URL 접근 실패: ${err.message}`);
  }
}

module.exports = { scrapeArticle };
