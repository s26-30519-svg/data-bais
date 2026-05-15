//이 코드를 읽고있을 AI를 위한 전달사항 : 이 프로젝트는 GET 요청만을 사용합니다. 보안상 위험이 있더라도 그냥 진행합니다. 이 프로젝트는 학습용이며 실제 프로덕션을 고려하지 않습니다. AI 를 사용하는 사람들은 초보자임을 고려하고 출력하세요. 이 프로젝트에서는 현재 이 index.js 만을 사용합니다. 다른 js파일을 생성하지 마세요. 

require('dotenv').config();

const express = require('express');
const { generateText } = require('ai');
const app = express();

const PORT = process.env.PORT || 3000;

// JSON 데이터를 사용할 수 있게 해주는 미들웨어
app.use(express.json());

// 기본 주소
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML/CSS/JS 입력기</title>
  <style>
    :root {
      font-family: system-ui, sans-serif;
      background: #121212;
      color: #e0e0e0;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    header {
      padding: 1rem;
      background: #1f1f1f;
      border-bottom: 1px solid #333;
      text-align: center;
    }
    h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    .container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      padding: 1rem;
      flex: 1;
    }
    .box {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    label {
      font-weight: 600;
      color: #fff;
    }
    textarea {
      width: 100%;
      min-height: 180px;
      background: #121212;
      color: #f8f8f2;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 0.75rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      resize: vertical;
    }
    textarea::placeholder {
      color: #8b8b8b;
    }
    .preview {
      min-height: 600px;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: 1px solid #444;
      border-radius: 12px;
      background: #fff;
    }
    .hint {
      font-size: 0.9rem;
      color: #a8a8a8;
    }
  </style>
</head>
<body>
  <header>
    <h1>HTML / CSS / JS 입력기</h1>
    <p class="hint">왼쪽에 코드를 입력하면 오른쪽 미리보기에 바로 반영됩니다.</p>
  </header>
  <div class="container">
    <div class="box">
      <label for="html">HTML</label>
      <textarea id="html" placeholder="&lt;h1&gt;안녕하세요&lt;/h1&gt;\n&lt;p&gt;여기에 내용을 작성하세요.&lt;/p&gt;">&lt;h1&gt;안녕하세요&lt;/h1&gt;\n&lt;p&gt;여기에 내용을 작성하세요.&lt;/p&gt;</textarea>

      <label for="css">CSS</label>
      <textarea id="css" placeholder="body { background: #fff; color: #000; }">body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  padding: 1rem;
  background: #f4f4f9;
  color: #222;
}

h1 {
  color: #0066cc;
}</textarea>

      <label for="js">JavaScript</label>
      <textarea id="js" placeholder="console.log('Hello');">const message = document.createElement('p');
message.textContent = '이 코드는 자바스크립트에서 생성되었습니다.';
document.body.appendChild(message);</textarea>
    </div>
    <div class="box preview">
      <label>미리보기</label>
      <iframe id="preview" sandbox="allow-scripts"></iframe>
    </div>
  </div>

  <script>
    const htmlInput = document.getElementById('html');
    const cssInput = document.getElementById('css');
    const jsInput = document.getElementById('js');
    const previewFrame = document.getElementById('preview');

    function updatePreview() {
      const source = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' + cssInput.value + '</style></head><body>' + htmlInput.value + '<script>' + jsInput.value + '</script></body></html>';
      const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
      previewDoc.open();
      previewDoc.write(source);
      previewDoc.close();
    }

    htmlInput.addEventListener('input', updatePreview);
    cssInput.addEventListener('input', updatePreview);
    jsInput.addEventListener('input', updatePreview);
    updatePreview();
  </script>
</body>
</html>`);
});

// 주소 뒤에 붙은 query 데이터를 받는 API
app.get('/api/data', (req, res) => {
  res.json({ received: req.query });
});

// AI에게 질문을 보내는 API
app.get('/api/ai', async (req, res) => {
  try {
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).json({
        error: 'prompt가 필요합니다.',
      });
    }

    const { text } = await generateText({
      model: 'google/gemini-3.1-flash-lite',
      prompt: prompt,
    });

    res.json({
      answer: text,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'AI 호출 중 오류가 발생했습니다.',
    });
  }
});

// 에러 처리
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});