# ArticleSummary Pro - 기술 명세서

**최종 업데이트:** 2026-04-08
**버전:** 1.0 (MVP)
**상태:** Production Deployed

---

## 목차
1. [시스템 아키텍처](#1-시스템-아키텍처)
2. [API 엔드포인트 명세](#2-api-엔드포인트-명세)
3. [환경변수 및 설정](#3-환경변수-및-설정)
4. [로컬 개발 환경 설정](#4-로컬-개발-환경-설정)
5. [배포 구성](#5-배포-구성)
6. [보안 고려사항](#6-보안-고려사항)
7. [성능 최적화](#7-성능-최적화)

---

## 1. 시스템 아키텍처

### 1.1 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                      사용자 (Web/Mobile)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
        ┌──────────────────▼──────────────────┐
        │   Vercel (Frontend)                 │
        │   • React 18 + Vite                 │
        │   • Tailwind CSS                    │
        │   • Zustand (State Management)      │
        │   • LocalStorage (History)          │
        └──────────────────┬──────────────────┘
                           │ HTTPS
        ┌──────────────────▼──────────────────┐
        │   Render (Backend)                  │
        │   • Express.js                      │
        │   • Node.js v20 LTS                 │
        │                                     │
        │   Routes:                           │
        │   ├─ POST /api/summarize/url        │
        │   ├─ POST /api/summarize/text       │
        │   └─ GET /api/health                │
        └─┬──────────────────────────────────┬┘
          │                                  │
          ▼                                  ▼
    ┌──────────────┐              ┌──────────────────┐
    │ Cheerio      │              │ Claude API       │
    │ (Scraper)    │              │ (claude-sonnet-  │
    │ + node-fetch │              │  4-6)            │
    └──────────────┘              └──────────────────┘
          │
          ▼
    Web Content
    (본문 추출)
```

### 1.2 요청 흐름 (Request Flow)

#### URL 기반 요약

```
사용자 입력 (URL)
    │
    ▼
프론트엔드 URL 형식 검증 (http/https)
    │
    ▼
백엔드 수신 (/api/summarize/url)
    │
    ▼
URL 유효성 검증
├─ 유료 사이트 차단 (WSJ, Bloomberg, FT 등)
├─ 로그인 필요 사이트 차단 (Facebook, Instagram 등)
├─ 파일 URL (.pdf, .xlsx 등) 차단
└─ 내부 IP (127.0.0.1, 192.168.*, localhost) 차단
    │
    ▼
Cheerio + node-fetch로 웹 페이지 스크래핑 (타임아웃: 8초)
    │
    ▼
본문 추출 및 전처리
├─ 텍스트만 추출 (HTML 태그 제거)
├─ 길이 최적화 (4,000자 제한)
└─ 인코딩 정규화 (UTF-8)
    │
    ▼
Claude API 호출 (Streaming + SSE)
├─ System Prompt (길이/톤 지정)
├─ 사용자 입력 (원문)
└─ Max Tokens: 1024
    │
    ▼
SSE 스트리밍으로 응답 전달 (타이핑 효과)
    │
    ▼
프론트엔드 수신 및 LocalStorage 저장
    │
    ▼
사용자에게 표시

```

#### 텍스트 직접 입력

```
사용자 입력 (텍스트)
    │
    ▼
프론트엔드 길이 검증 (최대 5,000자)
    │
    ▼
백엔드 수신 (/api/summarize/text)
    │
    ▼
텍스트 전처리
├─ 공백 제거
├─ 길이 최적화 (4,000자 제한)
└─ 인코딩 정규화
    │
    ▼
Claude API 호출 (동일)
    │
    ▼
이후 과정은 동일
```

### 1.3 데이터 저장 구조 (LocalStorage)

```json
{
  "summaries": [
    {
      "id": "uuid",
      "type": "url|text",
      "source": "https://... 또는 원문 일부",
      "original": "전체 원문 텍스트",
      "summary": "생성된 요약",
      "length": "short|medium|long",
      "tone": "neutral|expert|simple",
      "isFavorite": false,
      "createdAt": "2026-04-08T12:34:56Z",
      "updatedAt": "2026-04-08T12:34:56Z"
    }
  ],
  "settings": {
    "defaultLength": "medium",
    "defaultTone": "expert",
    "darkMode": true,
    "dataCollectionConsent": false
  }
}
```

---

## 2. API 엔드포인트 명세

### 2.1 URL 기반 요약

**엔드포인트:** `POST /api/summarize/url`

**요청 (Request)**
```json
{
  "url": "https://example.com/article",
  "length": "medium",
  "tone": "expert"
}
```

**요청 헤더 (Headers)**
```
Content-Type: application/json
```

**요청 파라미터 (Parameters)**
| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| url | string | Yes | 기사 URL | https://news.naver.com/... |
| length | string | No | 요약 길이 (short/medium/long) | "medium" |
| tone | string | No | 요약 톤 (neutral/expert/simple) | "expert" |

**응답 (Response) - Streaming (SSE)**
```
event: start
data: {"status": "starting"}

event: content
data: {"chunk": "삼성전자는 8일 "}

event: content
data: {"chunk": "신제품을 공개했다. "}

event: complete
data: {"status": "completed", "summary": "삼성전자는 8일 신제품을 공개했다...", "tokensUsed": 256}

```

**응답 상태 코드 (Status Codes)**
| 코드 | 설명 | 예시 |
|------|------|------|
| 200 | 성공 (SSE 스트리밍 시작) | 요약 생성 중 |
| 400 | 유효하지 않은 요청 | URL 형식 오류 |
| 403 | 접근 차단된 사이트 | 유료 사이트, 로그인 필요 |
| 408 | 요청 타임아웃 | 스크래핑 8초 초과 |
| 500 | 서버 에러 | Claude API 오류 |

**에러 응답**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details"
}
```

**에러 코드**
| 코드 | 의미 | 해결 방법 |
|------|------|----------|
| INVALID_URL | URL 형식 오류 | http 또는 https로 시작하는 유효한 URL 입력 |
| PAYWALL_BLOCKED | 유료 사이트 | 무료 기사 사이트 이용 |
| LOGIN_REQUIRED | 로그인 필요 사이트 | 로그인 후 직접 텍스트 입력 사용 |
| SCRAPE_TIMEOUT | 스크래핑 타임아웃 | URL이 응답하지 않음, 다시 시도 |
| SCRAPE_ERROR | 본문 추출 실패 | 지원하지 않는 웹사이트 형식 |
| API_ERROR | Claude API 오류 | 나중에 다시 시도 |

---

### 2.2 텍스트 직접 입력

**엔드포인트:** `POST /api/summarize/text`

**요청 (Request)**
```json
{
  "text": "삼성전자는 8일 신제품을 공개했다. AI 칩셋 기술이 핵심으로...",
  "length": "medium",
  "tone": "expert"
}
```

**요청 파라미터**
| 파라미터 | 타입 | 필수 | 설명 | 제약 |
|---------|------|------|------|------|
| text | string | Yes | 요약할 텍스트 | 최대 5,000자 (프론트엔드), 최대 4,000자 (백엔드 처리) |
| length | string | No | 요약 길이 | short/medium/long |
| tone | string | No | 요약 톤 | neutral/expert/simple |

**응답**
- URL 기반 요약과 동일 (SSE 스트리밍)

---

### 2.3 헬스 체크

**엔드포인트:** `GET /api/health`

**응답**
```json
{
  "status": "ok",
  "timestamp": "2026-04-08T12:34:56Z",
  "version": "1.0.0"
}
```

---

## 3. 환경변수 및 설정

### 3.1 백엔드 환경변수 (.env)

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# 서버 포트
PORT=3001

# 환경 모드
NODE_ENV=production

# CORS 설정
FRONTEND_URL=https://your-vercel-url.vercel.app

# 로깅
LOG_LEVEL=info

# 요청 타임아웃 (ms)
SCRAPE_TIMEOUT=8000
TOTAL_REQUEST_TIMEOUT=30000

# 텍스트 길이 제한
MAX_TEXT_LENGTH=4000
```

### 3.2 프론트엔드 환경변수 (.env)

```bash
# API 백엔드 URL
VITE_API_URL=https://your-render-url.onrender.com

# 환경
VITE_ENV=production
```

### 3.3 로컬스토리지 키 (Frontend)

```javascript
// 히스토리 저장
localStorage.getItem('summaries')      // 배열
localStorage.getItem('settings')       // 객체
localStorage.getItem('favorites')      // 배열 (현재는 summary의 isFavorite로 관리)
```

---

## 4. 로컬 개발 환경 설정

### 4.1 사전 요구사항

**시스템 요구사항**
- Node.js v20 LTS 이상
- npm 또는 yarn
- Git

**API 키**
- Anthropic API Key (https://console.anthropic.com)

### 4.2 설치 및 실행

#### 백엔드 설정

```bash
# 1. 프로젝트 클론
cd backend

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cat > .env << EOF
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
SCRAPE_TIMEOUT=8000
TOTAL_REQUEST_TIMEOUT=30000
MAX_TEXT_LENGTH=4000
EOF

# 4. 서버 실행
npm run dev
# 또는 npm start

# 서버는 http://localhost:3001에서 실행됨
```

#### 프론트엔드 설정

```bash
# 1. 프로젝트 이동
cd frontend

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cat > .env.local << EOF
VITE_API_URL=http://localhost:3001
VITE_ENV=development
EOF

# 4. 개발 서버 실행
npm run dev
# Vite 개발 서버는 http://localhost:5173에서 실행됨

# 5. 빌드
npm run build

# 6. 프로덕션 프리뷰
npm run preview
```

### 4.3 개발 워크플로우

**로컬 테스트**
```bash
# 터미널 1: 백엔드
cd backend && npm run dev

# 터미널 2: 프론트엔드
cd frontend && npm run dev

# 브라우저에서 http://localhost:5173 접속
```

**API 테스트 (curl)**
```bash
# 텍스트 요약 테스트
curl -X POST http://localhost:3001/api/summarize/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "삼성전자는 8일 신제품을 공개했다.",
    "length": "medium",
    "tone": "expert"
  }' \
  -N

# URL 요약 테스트
curl -X POST http://localhost:3001/api/summarize/url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "length": "medium",
    "tone": "expert"
  }' \
  -N

# 헬스 체크
curl http://localhost:3001/api/health
```

### 4.4 디버깅

**백엔드 디버깅**
```bash
# Node.js 디버거 사용
node --inspect=9229 server.js

# Chrome DevTools에서 chrome://inspect 접속
```

**프론트엔드 디버깅**
```bash
# Vite는 자동으로 Source Maps 생성
# 브라우저 F12 > Sources에서 확인 가능

# React DevTools 설치 권장
# Chrome Extension: React Developer Tools
```

---

## 5. 배포 구성

### 5.1 프론트엔드 배포 (Vercel)

**배포 플랫폼:** Vercel (https://vercel.com)

**배포 URL:** https://your-vercel-url.vercel.app

**배포 설정 (vercel.json)**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://your-render-url.onrender.com",
    "VITE_ENV": "production"
  }
}
```

**배포 프로세스**
```bash
# 1. GitHub 푸시
git push origin main

# 2. Vercel 자동 배포 (GitHub 연동 시)
# 또는 수동 배포:
npm install -g vercel
vercel --prod

# 배포 상태 확인
vercel list
vercel inspect
```

**환경변수 설정 (Vercel Dashboard)**
- Project Settings > Environment Variables
- VITE_API_URL = https://your-render-url.onrender.com
- VITE_ENV = production

### 5.2 백엔드 배포 (Render)

**배포 플랫폼:** Render (https://render.com)

**배포 URL:** https://your-render-url.onrender.com

**배포 설정 (render.yaml)**
```yaml
services:
  - type: web
    name: article-summary-api
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: PORT
        value: 3001
      - key: NODE_ENV
        value: production
      - key: FRONTEND_URL
        value: https://your-vercel-url.vercel.app
      - key: LOG_LEVEL
        value: info
      - key: SCRAPE_TIMEOUT
        value: 8000
      - key: TOTAL_REQUEST_TIMEOUT
        value: 30000
      - key: MAX_TEXT_LENGTH
        value: 4000
```

**배포 프로세스**
```bash
# 1. GitHub에 코드 푸시
git push origin main

# 2. Render Dashboard에서 자동 배포 (GitHub 연동 시)
# 또는 수동 배포:
# - Render.com 로그인
# - New+ > Web Service
# - GitHub 리포지토리 선택
# - render.yaml 자동 감지
# - Deploy 클릭
```

**환경변수 설정 (Render Dashboard)**
- Environment > Environment Variables
- ANTHROPIC_API_KEY = sk-ant-...
- FRONTEND_URL = https://your-vercel-url.vercel.app

### 5.3 배포 체크리스트

```
프론트엔드 배포 전:
[ ] npm run build 성공
[ ] npm run preview에서 정상 작동
[ ] VITE_API_URL 올바른 백엔드 URL로 설정
[ ] .env.local 파일이 .gitignore에 포함됨

백엔드 배포 전:
[ ] npm install && npm start 성공
[ ] ANTHROPIC_API_KEY 설정됨
[ ] PORT 환경변수 설정됨
[ ] FRONTEND_URL 올바르게 설정됨
[ ] CORS 설정 확인

배포 후:
[ ] https://your-vercel-url.vercel.app 접속 가능
[ ] https://your-render-url.onrender.com/api/health 200 응답
[ ] 프론트엔드에서 백엔드 API 호출 가능
[ ] 텍스트 요약 정상 작동
[ ] URL 요약 정상 작동
[ ] 히스토리 로컬스토리지 정상 작동
```

---

## 6. 보안 고려사항

### 6.1 입력 검증 (Input Validation)

**백엔드**
- URL 형식 검증 (http/https만 허용)
- 텍스트 길이 제한 (최대 4,000자)
- SQL Injection 방지 (매개변수화된 쿼리, 현재는 API 기반이므로 해당 없음)
- XSS 방지 (응답 시 HTML 이스케이프)

**프론트엔드**
- URL 형식 검증 (http/https 확인)
- 텍스트 길이 검증 (최대 5,000자)
- 클라이언트 사이드 유효성 검사

### 6.2 차단 목록 (Blocklist)

**유료 사이트 (Paywall)**
- Wall Street Journal (wsj.com)
- Financial Times (ft.com)
- Bloomberg (bloomberg.com)
- 그 외 주요 유료 뉴스 사이트

**로그인 필요 사이트**
- Facebook (facebook.com)
- Instagram (instagram.com)
- LinkedIn (linkedin.com)
- Twitter (x.com)

**차단된 URL 형식**
- 파일 URL (.pdf, .xlsx, .docx 등)
- 내부 IP (127.0.0.1, localhost, 192.168.*, 10.0.0.0/8 등)

### 6.3 API 키 보안

**ANTHROPIC_API_KEY**
- 환경변수로만 관리 (절대 하드코딩 금지)
- 프로덕션 배포 시 별도의 보안 저장소 사용 권장
- 정기적인 키 로테이션 (Anthropic 콘솔에서)
- .env 파일은 .gitignore에 포함

### 6.4 CORS (Cross-Origin Resource Sharing)

**현재 설정**
```javascript
// Express 백엔드
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

**프로덕션**
- FRONTEND_URL = https://your-vercel-url.vercel.app
- 특정 도메인만 허용 (와일드카드 사용 금지)

---

## 7. 성능 최적화

### 7.1 응답 시간 목표

| 작업 | 목표 | 현재 | 다음 개선 |
|------|------|------|---------|
| 프론트엔드 로드 | <2초 | ~1.5초 | 번들 최적화 |
| 텍스트 요약 | <3초 | ~2-3초 | Claude 토큰 최적화 |
| URL 스크래핑 + 요약 | <5초 | ~4-5초 | Redis 캐싱 |
| SSE 스트리밍 | 즉시 | 즉시 | - |

### 7.2 최적화 전략

**프론트엔드**
- Vite 번들 분할 (Code Splitting)
- Lazy Loading (React.lazy)
- 이미지 최적화 (WebP)
- LocalStorage 사용 (히스토리 캐시)

**백엔드**
- 텍스트 길이 제한 (4,000자)
- 스크래핑 타임아웃 (8초)
- Connection pooling (향후)

**API**
- SSE 스트리밍 (지연 최소화)
- 청크 단위 응답 (일부 텍스트부터 표시)
- 캐싱 (Phase 2: Redis)

### 7.3 모니터링

**프론트엔드**
- Vercel Analytics (자동)
- Web Vitals 모니터링
- Error tracking (향후)

**백엔드**
- Render 로그 확인
- 응답 시간 로깅
- API 에러 로깅

---

## 부록

### A. 타사 서비스 통합

#### Anthropic Claude API
- **엔드포인트:** https://api.anthropic.com/v1/messages
- **모델:** claude-sonnet-4-6
- **인증:** Bearer Token (ANTHROPIC_API_KEY)
- **최대 요청:** 1회/초 (Free Plan)
- **가격:** $3 per 1M input tokens, $15 per 1M output tokens

#### Cheerio (웹 스크래핑)
- **라이브러리:** cheerio v1.0.0+
- **목적:** HTML 파싱 및 본문 추출
- **장점:** 가볍고 빠름
- **제약:** 자바스크립트 렌더링 불가 (정적 HTML만)

### B. 의존성 (Dependencies)

**백엔드 (Node.js)**
```json
{
  "express": "^4.18.2",
  "@anthropic-ai/sdk": "^0.8.0",
  "cheerio": "^1.0.0",
  "node-fetch": "^2.6.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.0"
}
```

**프론트엔드 (React)**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "zustand": "^4.3.0",
  "tailwindcss": "^3.3.0",
  "axios": "^1.4.0"
}
```

---

이 문서는 개발 및 배포 시 참고하기 위한 기술 명세서입니다.
정기적으로 업데이트되며, 최신 버전은 GitHub 리포지토리에서 관리됩니다.
