# API 명세서

## 개요
이 문서는 `data-bias` 프로젝트에서 제공하는 서버 API 엔드포인트를 설명합니다. 현재 서버는 Express 기반으로 동작하며, 클라이언트에서 사용하는 주요 API는 다음과 같습니다.

- `GET /`
- `GET /api/data`
- `GET /api/ai`

---

## 1. 기본 페이지

### `GET /`

- 설명: 기본 HTML 페이지를 반환합니다.
- 응답 형식: `text/html`
- 파라미터: 없음
- 사용 예:
  - 브라우저에서 `http://localhost:3000/` 접속

### 응답 예시
- HTML 문서 전체가 반환됩니다.

---

## 2. 쿼리 데이터 수신 API

### `GET /api/data`

- 설명: URL 쿼리 문자열로 전달된 데이터를 그대로 JSON으로 반환합니다.
- 요청 형식: `GET`
- 요청 헤더: 없음
- 요청 쿼리 파라미터: 자유롭게 사용 가능

### 응답 형식
- `application/json`

### 성공 응답 예시
```json
{
  "received": {
    "name": "홍길동",
    "age": "30"
  }
}
```

### 사용 예시
- `GET /api/data?name=%ED%99%8D%EA%B8%B8%EB%8F%99&age=30`

---

## 3. AI 질문 API

### `GET /api/ai`

- 설명: `prompt` 쿼리 매개변수로 전달된 질문을 AI에 보내고, AI가 생성한 텍스트 응답을 반환합니다.
- 요청 형식: `GET`
- 요청 헤더: 없음
- 요청 쿼리 파라미터:
  - `prompt` (string, required): AI에게 보낼 질문 또는 명령어

### 성공 응답 형식
- `application/json`

### 성공 응답 예시
```json
{
  "answer": "AI가 생성한 응답 텍스트"
}
```

### 에러 응답
- `400 Bad Request`
  - `prompt`가 누락된 경우
  - 예시:
    ```json
    {
      "error": "prompt가 필요합니다."
    }
    ```
- `500 Internal Server Error`
  - AI 호출 중 오류가 발생한 경우
  - 예시:
    ```json
    {
      "error": "AI 호출 중 오류가 발생했습니다."
    }
    ```

### 사용 예시
- `GET /api/ai?prompt=%EC%95%84%EC%9D%B4%EC%9D%98%20%EC%9A%94%EC%B2%AD%EC%9D%84%20%EB%B3%B4%EB%82%B4%EC%84%B8%EC%9A%94`

---

## 4. 서버 설정

- 기본 포트: `3000`
- 환경 변수:
  - `AI_GATEWAY_API_KEY` : AI SDK 호출을 위한 API 키
- 실행 명령:
  ```bash
  npm install
  node index.js
  ```

---

## 5. 참고

- 현재 구현은 `GET` 요청만 사용합니다.
- 프로덕션 환경에서는 `GET /api/ai` 대신 `POST`를 사용하고, 입력 검증과 보안 처리를 강화하는 것이 좋습니다.
