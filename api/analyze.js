export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { fileName, imageDataUrl, apiKey } = req.body || {};

  if (!apiKey) {
    res.status(400).json({ error: 'API key is required' });
    return;
  }

  const lowerName = String(fileName || '').toLowerCase();
  const isJunk = /(떡볶이|라면|과자|초콜릿|탄산|패스트푸드|햄버거|치킨|도넛|핫도그|컵라면|스낵|음료)/i.test(lowerName);
  const isBalanced = /(밥|현미|계란|두부|야채|고기|우유|과일|김밥|샌드위치|죽)/i.test(lowerName);

  let title = '사진 속 음식은 조금 더 살펴볼 필요가 있어요';
  let body = '음식의 종류와 양에 따라 몸의 반응이 달라질 수 있어요.';
  let emotion = '기분과 에너지의 흐름이 조금 흔들릴 수 있어요.';
  let study = '공부할 때 몸이 무겁거나 집중이 덜 될 수 있어요.';
  let parent = '아이의 컨디션과 기분을 같이 확인해보는 것이 좋아요.';
  let kid = '오늘은 몸이 편안한 선택을 해보자.';
  let tip = '사진 속 음식이 자극적이면 몸과 마음이 흔들릴 수 있어요. 가볍고 든든한 식사로 이어주세요.';

  if (isJunk) {
    title = '정크푸드로 보이는 음식입니다';
    body = '혈당이 급격히 오르내릴 수 있어 몸이 들뜨고, 피로가 쉽게 쌓일 수 있어요.';
    emotion = '짜고 달고 자극적인 음식은 기분을 들뜨게 만들다가도 금세 불안하거나 짜증 나게 만들 수 있어요.';
    study = '집중력이 흐트러지고, 머리가 맑지 않게 느껴질 수 있어요.';
    parent = '아이가 잠깐 만족해도, 장기적으로는 컨디션과 정서에 부담을 줄 수 있어요.';
    kid = '오늘은 잠깐의 맛보다, 몸이 편안해지는 선택이 더 좋아요.';
    tip = '짧은 만족보다 긴 안정을 위해 가볍고 든든한 대안을 추천해 주세요.';
  } else if (isBalanced) {
    title = '몸과 마음에 비교적 안정적인 음식입니다';
    body = '탄수화물과 단백질이 균형 있게 들어와서 몸이 덜 흔들리고 에너지가 오래 가요.';
    emotion = '평온한 상태를 유지하기 쉬워서 기분이 안정적으로 유지돼요.';
    study = '집중력과 기억력이 더 오래 이어질 가능성이 높아요.';
    parent = '아이의 몸과 기분을 함께 챙기는 선택으로 좋습니다.';
    kid = '배가 든든하면 머리도 맑아져요.';
    tip = '이런 음식은 공부와 정서 안정에 도움이 되는 편입니다.';
  }

  res.status(200).json({ title, body, emotion, study, parent, kid, tip });
}
