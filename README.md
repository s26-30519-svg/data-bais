# data-bias

추천 알고리즘 편향 분석 실험실

이 저장소는 데이터 편향이 추천 시스템에 미치는 영향을 시각적으로 탐구하는 웹 기반 실험 도구입니다.

- Express 백엔드 서버
- Vercel AI SDK 기반 AI 호출 API
- 추천 편향 실험용 프론트엔드 UI
- 기본 추천, 편향 적용, 비교 분석, 개선 단계 포함

## 실행 방법

1. `npm install`
2. `.env` 파일에 `AI_GATEWAY_API_KEY` 설정
3. `node index.js`로 서버 실행
4. 브라우저에서 `http://localhost:3000` 접속
