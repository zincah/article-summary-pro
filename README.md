# ArticleSummary Pro

Claude AI(claude-sonnet-4-6)를 활용한 AI 기반 기사 요약 서비스입니다.  
URL 또는 텍스트를 입력하면 실시간 스트리밍으로 기사를 요약해 드립니다.

> **Note**: 현재 백엔드 서버는 내려져 있습니다. 로컬 환경에서 직접 실행하여 사용하세요.

## 주요 기능

- URL 또는 텍스트 직접 입력으로 기사 요약
- Claude AI 스트리밍 — 실시간 타이핑 효과
- 요약 길이(짧음 / 중간 / 길음) 및 톤(중립 / 전문 / 쉬움) 선택
- 요약 결과 클립보드 복사
- 로컬 스토리지 기반 히스토리 저장 / 삭제 / 즐겨찾기
- 다크모드 지원
- 모바일 우선 반응형 UI (max-width: 480px)

## 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| 프론트엔드 | React 18, Vite, Tailwind CSS, Zustand |
| 백엔드 | Node.js, Express.js, @anthropic-ai/sdk |
| 웹 스크래핑 | Cheerio, node-fetch |
| 상태 저장 | 로컬 스토리지 |

## 프로젝트 구조

```
article-summary-pro/
├── frontend/       # React + Vite 앱
└── backend/        # Express.js API 서버
```

## 로컬 실행 방법

### 1. API 키 설정

```bash
# backend/.env 파일 생성 후 키 입력
ANTHROPIC_API_KEY=your_api_key_here
```

### 2. 백엔드 실행

```bash
cd backend
npm install
npm run dev
# http://localhost:3001
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/summarize` | 기사 요약 (SSE 스트리밍) |
| GET | `/api/health` | 서버 상태 확인 |
