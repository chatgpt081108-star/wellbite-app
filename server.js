import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

app.post('/api/analyze', async (req, res) => {
  try {
    const { fileName, imageDataUrl } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });
    }

    if (!imageDataUrl) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `
당신은 아이의 식습관과 웰빙을 돕는 따뜻한 한국어 안내 전문가입니다.
사용자가 업로드한 음식 사진을 보고, 아래 형식으로 한국어로 응답해주세요.

- title: 사진의 의미를 한 문장으로
- body: 신체적 영향 1문장
- emotion: 정서적 영향 1문장
- study: 집중/공부 영향 1문장
- parent: 부모에게 전할 따뜻한 한마디
- kid: 아이에게 전할 따뜻한 한마디
- tip: 부모가 실천할 수 있는 조언 1문장

응답은 JSON 형식으로만 해주세요.
예시:
{"title":"...","body":"...","emotion":"...","study":"...","parent":"...","kid":"...","tip":"..."}
`;

    const mimeMatch = imageDataUrl.match(/^data:(.+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = imageDataUrl.replace(/^data:.+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data
      }
    };

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const fallback = responseText.match(/\{[\s\S]*\}/);
      parsed = fallback ? JSON.parse(fallback[0]) : null;
    }

    if (!parsed || typeof parsed !== 'object') {
      return res.status(502).json({ error: 'AI response was not valid JSON.' });
    }

    const safeResult = {
      title: parsed.title || `${fileName || '사진'}의 의미를 살펴보겠습니다.`,
      body: parsed.body || '몸과 마음에 어떤 영향을 줄 수 있는지 천천히 살펴보세요.',
      emotion: parsed.emotion || '기분의 흐름에 주목해보는 것이 좋아요.',
      study: parsed.study || '공부와 집중에 미칠 수 있는 영향을 생각해볼 수 있어요.',
      parent: parsed.parent || '아이의 컨디션을 함께 살피는 따뜻한 선택이 필요해요.',
      kid: parsed.kid || '몸이 편안해지는 선택을 함께 해보아요.',
      tip: parsed.tip || '가볍고 든든한 선택을 권해보세요.'
    };

    return res.json(safeResult);
  } catch (error) {
    console.error(error);
    return res.status(200).json({
      title: 'AI 분석이 잠시 멈췄어요',
      body: '오늘은 Gemini 사용량이 잠시 제한되어, 따뜻한 가이드로 대신 안내드려요.',
      emotion: '몸과 마음을 편안하게 돌보는 작은 선택을 이어가면 좋아요.',
      study: '공부가 힘들 때는 가볍고 든든한 식사를 먼저 떠올려보세요.',
      parent: '아이의 컨디션을 함께 살피며 오늘은 편안한 선택을 해보세요.',
      kid: '몸이 편안해지는 선택을 하면 마음도 조금 더 가벼워져요.',
      tip: 'Gemini 쿼터가 회복되면 실제 AI 분석으로 자동 연결됩니다.'
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Wellbite server running on http://localhost:${port}`);
});
