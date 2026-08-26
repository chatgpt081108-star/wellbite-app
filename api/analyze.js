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

// Gemini가 안정적으로 읽는 이미지 형식만 허용
const SUPPORTED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const SUPPORTED_EXT = ['jpg', 'jpeg', 'png', 'webp'];

// 업로드한 이미지의 형식을 확인한다.
function inspectFormat(imageDataUrl, fileName) {
  const mimeMatch = String(imageDataUrl).match(/^data:([^;]+);base64,/);
  const mime = mimeMatch ? mimeMatch[1].toLowerCase() : '';
  const ext = (String(fileName || '').toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';

  const isHeic =
    mime.includes('heic') || mime.includes('heif') || ext === 'heic' || ext === 'heif';
  const supported = SUPPORTED_MIME.includes(mime) || SUPPORTED_EXT.includes(ext);

  return { isHeic, supported };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed', message: 'POST로 요청해주세요.' });
    return;
  }

  const { fileName, imageDataUrl } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!imageDataUrl) {
    res.status(400).json({ error: 'no_image', message: '사진 데이터가 없어요. 다시 올려주세요.' });
    return;
  }

  // 지원하지 않는 형식(HEIC 등)이면 원인을 분명히 알려준다.
  const { isHeic, supported } = inspectFormat(imageDataUrl, fileName);
  if (isHeic) {
    res.status(415).json({
      error: 'unsupported_format',
      message:
        'HEIC(아이폰 기본) 형식은 분석할 수 없어요. 아이폰 [설정 > 카메라 > 포맷 > 호환성 우선]으로 바꾸거나, JPG·PNG로 변환해서 올려주세요.'
    });
    return;
  }
  if (!supported) {
    res.status(415).json({
      error: 'unsupported_format',
      message: '지원하지 않는 이미지 형식이에요. JPG, PNG, WEBP 파일로 올려주세요.'
    });
    return;
  }

  // 키가 없으면 기본 안내문으로 넘어가되, 원인을 함께 전달한다.
  if (!apiKey) {
    res.status(200).json({
      ...FALLBACK,
      notice: '서버에 AI 키(GEMINI_API_KEY)가 설정되지 않아 기본 가이드로 안내했어요.'
    });
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
      res.status(200).json({
        ...FALLBACK,
        notice: 'AI 응답을 이해하지 못해 기본 가이드로 안내했어요. 잠시 후 다시 시도해주세요.'
      });
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
    // 호출 실패 시 기본 안내문으로 넘어가되, 원인을 함께 전달한다.
    res.status(200).json({
      ...FALLBACK,
      notice: 'AI 분석이 잠시 어려워 기본 가이드로 안내했어요. 잠시 후 다시 시도해주세요.'
    });
  }
}
