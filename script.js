const foodGuide = [
  {
    name: '현미밥 + 된장국 + 계란',
    impact: '몸은 안정되고, 집중이 오래 유지돼요.',
    icon: '🍚'
  },
  {
    name: '김밥 + 우유 + 과일',
    impact: '간단하지만 에너지가 균형 있게 들어와요.',
    icon: '🍱'
  },
  {
    name: '떡볶이, 탄산음료',
    impact: '잠깐은 맛있지만, 몸이 들떠서 집중이 흐트러질 수 있어요.',
    icon: '🥤'
  }
];

const tilePalette = ['tile-peach', 'tile-mint', 'tile-rose', 'tile-taupe'];

const tileGrid = document.getElementById('tile-grid');
const kidBanner = document.getElementById('kid-banner');
const photoInput = document.getElementById('food-photo');
const avatarIcon = document.getElementById('avatar-icon');
const avatarThumb = document.getElementById('avatar-thumb');
const pillHint = document.getElementById('pill-hint');
const analyzeBtn = document.getElementById('analyze-btn');
const analysisStatus = document.getElementById('analysis-status');
const dropZone = document.getElementById('drop-zone');
const modeTabs = document.querySelectorAll('.mode-tabs .tab');

let selectedFile = null;
let currentMode = 'quick';

function makeTile(cls, icon, title, text, wide) {
  const tile = document.createElement('div');
  tile.className = `tile ${cls}${wide ? ' tile-wide' : ''}`;
  tile.innerHTML = `<span class="tile-icon">${icon}</span><div class="tile-copy"><strong>${title}</strong><p>${text}</p></div>`;
  return tile;
}

function renderDefaultGuide() {
  tileGrid.innerHTML = '';

  foodGuide.forEach((item, index) => {
    tileGrid.appendChild(
      makeTile(tilePalette[index % tilePalette.length], item.icon, item.name, item.impact)
    );
  });

  tileGrid.appendChild(
    makeTile(
      'tile-taupe',
      '💡',
      '엄마가 기억할 포인트',
      '짜고 달고 자극적인 음식은 잠깐 기분이 좋아도, 몸과 마음의 리듬을 흔들 수 있어요.',
      true
    )
  );

  kidBanner.innerHTML = `
    <span class="kid-banner-label">아이가 들었으면 하는 말</span>
    <p>배고플 때는 몸이 먼저 말해줘요. 그래서 가볍고 든든한 음식을 고르면 공부도 더 잘돼요.</p>
  `;
}

function analyzeFood(fileName) {
  const lowerName = fileName.toLowerCase();
  const isJunk = /(떡볶이|라면|과자|초콜릿|탄산|패스트푸드|햄버거|치킨|도넛|핫도그|컵라면|스낵|음료)/i.test(lowerName);
  const isBalanced = /(밥|현미|계란|두부|야채|고기|우유|과일|김밥|샌드위치|죽)/i.test(lowerName);

  if (isJunk) {
    return {
      title: '정크푸드로 보이는 음식입니다',
      body: '혈당이 급격히 오르내릴 수 있어 몸이 들뜨고, 피로가 쉽게 쌓일 수 있어요.',
      emotion: '짜고 달고 자극적인 음식은 기분을 들뜨게 만들다가도 금세 불안하거나 짜증 나게 만들 수 있어요.',
      study: '집중력이 흐트러지고, 머리가 맑지 않게 느껴질 수 있어요.',
      parent: '아이가 잠깐 만족해도, 장기적으로는 컨디션과 정서에 부담을 줄 수 있어요.',
      kid: '오늘은 잠깐의 맛보다, 몸이 편안해지는 선택이 더 좋아요.'
    };
  }

  if (isBalanced) {
    return {
      title: '몸과 마음에 비교적 안정적인 음식입니다',
      body: '탄수화물과 단백질이 균형 있게 들어와서 몸이 덜 흔들리고 에너지가 오래 가요.',
      emotion: '평온한 상태를 유지하기 쉬워서 기분이 안정적으로 유지돼요.',
      study: '집중력과 기억력이 더 오래 이어질 가능성이 높아요.',
      parent: '아이의 몸과 기분을 함께 챙기는 선택으로 좋습니다.',
      kid: '배가 든든하면 머리도 맑아져요.'
    };
  }

  return {
    title: '사진 속 음식은 조금 더 살펴볼 필요가 있어요',
    body: '음식의 종류와 양에 따라 몸의 반응이 달라질 수 있어요.',
    emotion: '기분과 에너지의 흐름이 조금 흔들릴 수 있어요.',
    study: '공부할 때 몸이 무겁거나 집중이 덜 될 수 있어요.',
    parent: '아이의 컨디션과 기분을 같이 확인해보는 것이 좋아요.',
    kid: '오늘은 몸이 편안한 선택을 해보자.'
  };
}

function renderAnalysisResult(result) {
  tileGrid.innerHTML = '';

  tileGrid.appendChild(makeTile('tile-peach', '💪', '신체적 영향', result.body));
  tileGrid.appendChild(makeTile('tile-rose', '💛', '정서적 영향', result.emotion));
  tileGrid.appendChild(makeTile('tile-mint', '🧠', '집중·공부 영향', result.study));

  const parentText = result.tip ? `${result.parent} ${result.tip}` : result.parent;
  tileGrid.appendChild(makeTile('tile-taupe', '📝', '부모님 안내', parentText, true));

  kidBanner.innerHTML = `
    <span class="kid-banner-label">${result.title}</span>
    <p>${result.kid}</p>
  `;
}

function showPreview(file) {
  if (!file) {
    avatarThumb.classList.add('hidden');
    avatarThumb.src = '';
    avatarIcon.classList.remove('hidden');
    return;
  }

  avatarThumb.src = URL.createObjectURL(file);
  avatarThumb.classList.remove('hidden');
  avatarIcon.classList.add('hidden');
}

function handleFileSelection(file) {
  if (!file) {
    analysisStatus.textContent = '사진이 선택되지 않았습니다. 다시 시도해 주세요.';
    return;
  }

  selectedFile = file;
  showPreview(file);
  pillHint.textContent = file.name;
  analysisStatus.textContent = `${file.name}을 선택했어요. 분석 시작을 눌러주세요.`;
}

photoInput.addEventListener('change', (event) => {
  handleFileSelection(event.target.files?.[0]);
});

pillHint.addEventListener('click', () => {
  photoInput.click();
});

dropZone.addEventListener('click', (event) => {
  if (event.target === dropZone) {
    photoInput.click();
  }
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('drag-over');
  handleFileSelection(event.dataTransfer?.files?.[0]);
});

modeTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    modeTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    currentMode = tab.dataset.mode;
  });
});

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function runAnalysis() {
  if (!selectedFile) {
    analysisStatus.textContent = '먼저 사진을 올려주세요.';
    return;
  }

  analysisStatus.textContent = '분석 중입니다... 잠시만 기다려주세요.';
  analyzeBtn.disabled = true;

  try {
    const fileName = selectedFile.name;

    if (currentMode === 'ai') {
      const imageDataUrl = await readFileAsDataUrl(selectedFile);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, imageDataUrl })
      });

      // 서버 함수가 미배포면 JSON 대신 HTML이 올 수 있으므로 안전하게 파싱한다.
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.ok && data && data.title) {
        renderAnalysisResult(data);
        // notice가 있으면(키 없음/AI 실패 등) 그 원인을 그대로 보여준다.
        analysisStatus.textContent = data.notice || 'AI 분석 결과를 확인했습니다.';
        return;
      }

      // 지원하지 않는 형식(HEIC 등) 같은 명확한 오류는 그대로 안내하고 멈춘다.
      if (data && data.message) {
        analysisStatus.textContent = data.message;
        return;
      }

      // 그 외(함수 미배포로 HTML 응답 등)에는 원인을 솔직히 알린다.
      analysisStatus.textContent =
        'AI 분석 서버에 연결하지 못했어요. 잠시 후 다시 시도하거나 관리자에게 문의해주세요.';
      return;
    }

    // 빠른 가이드 모드
    const fallback = analyzeFood(fileName);
    renderAnalysisResult(fallback);
    analysisStatus.textContent = '빠른 가이드를 확인했습니다.';
  } catch (error) {
    analysisStatus.textContent =
      '분석 중 문제가 생겼어요. 네트워크 상태를 확인하고 다시 시도해주세요.';
  } finally {
    analyzeBtn.disabled = false;
  }
}

analyzeBtn.addEventListener('click', runAnalysis);

renderDefaultGuide();
