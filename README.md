# ArticleSummary Pro

AI 기반 기사 요약 서비스. Claude AI (claude-sonnet-4-6)를 사용하여 URL 또는 텍스트로 입력된 기사를 실시간 스트리밍으로 요약합니다.

## 기술 스택

- **프론트엔드**: React 18 + Vite + Tailwind CSS + Zustand
- **백엔드**: Node.js + Express.js + @anthropic-ai/sdk
- **웹 스크래핑**: Cheerio + node-fetch
- **저장소**: 로컬 스토리지 (히스토리)

## 시작하기

### 1. API 키 설정

```bash
cp backend/.env.example backend/.env
# backend/.env 파일을 열어 ANTHROPIC_API_KEY에 실제 키를 입력하세요
```

### 2. 백엔드 실행

```bash
cd backend
npm install
npm run dev
# http://localhost:3001 에서 실행
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173 에서 실행
```

## 기능

- URL 또는 텍스트 직접 입력으로 기사 요약
- Claude AI 스트리밍으로 실시간 타이핑 효과
- 요약 길이 (짧음/중간/길음) 및 톤 (중립/전문/쉬움) 선택
- 요약 결과 클립보드 복사
- 로컬 스토리지 기반 히스토리 저장/삭제/즐겨찾기
- 다크모드 지원
- 모바일 우선 반응형 UI (max-width: 480px)

## API 엔드포인트

- `POST /api/summarize` - 기사 요약 (SSE 스트리밍)
- `GET /api/health` - 서버 상태 확인
