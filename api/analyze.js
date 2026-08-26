import { GoogleGenerativeAI } from '@google/generative-ai';

// 키가 없거나 호출이 실패했을 때 보여줄 기본 안내문
const FALLBACK = {
  title: '사진 속 음식은 조금 더 살펴볼 필요가 있어요',
  body: '음식의 종류와 양에 따라 몸의 반응이 달라질 수 있어요.',
  emotion: '기분과 에너지의 흐름이 조금 흔들릴 수 있어요.',
  study: '공부할 때 몸이 무겁거나 집중이 덜 될 수 있어요.',
  parent: '아이의 컨디션과 기분을 같이 확인해보는 것이 좋아요.',
  kid: '오늘은 몸이 편안한 선택을 해보자.',
  tip: '사진 속 음식이 자극적이면 몸과 마음이 흔들릴 수 있어요. 가볍고 든든한 식사로 이어주세요.'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { fileName, imageDataUrl } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  // 키가 없으면 기본 안내문으로 넘어감
  if (!apiKey) {
    res.status(200).json(FALLBACK);
    return;
  }

  if (!imageDataUrl) {
    res.status(400).json({ error: 'No image data provided.' });
    return;
  }

  try {
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
      res.status(200).json(FALLBACK);
      return;
    }

    const safeResult = {
      title: parsed.title || `${fileName || '사진'}의 의미를 살펴보겠습니다.`,
      body: parsed.body || FALLBACK.body,
      emotion: parsed.emotion || FALLBACK.emotion,
      study: parsed.study || FALLBACK.study,
      parent: parsed.parent || FALLBACK.parent,
      kid: parsed.kid || FALLBACK.kid,
      tip: parsed.tip || FALLBACK.tip
    };

    res.status(200).json(safeResult);
  } catch (error) {
    console.error(error);
    // 호출 실패 시 기본 안내문으로 넘어감
    res.status(200).json(FALLBACK);
  }
}
