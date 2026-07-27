// ─────────────────────────────────────────────────────────────────────────────
// castPhoto — 업로드한 인물 사진을 팩에 넣을 수 있게 줄이고, 한 세트로 보이게 보정한다.
//
//   왜 보정이 필요한가
//     6명을 각자 다른 날 다른 조명에서 찍어 올리면 밝기·색감이 제각각이라 따로 논다.
//     이름표만 바뀐 게 아니라 "사건 파일"처럼 보여야 하므로, 모두에게 같은 처리를 준다.
//
//   처리 순서 (dossier 스타일)
//     1) 자동 레벨  — 밝기 분포의 양 끝을 잘라 늘린다. 노출 차이를 없애는 핵심 단계.
//     2) 대비 S커브 — 살짝 또렷하게.
//     3) 듀오톤     — 밝기를 어두운 갈색→종이빛 램프에 매핑. 게임의 종이 팔레트와 맞춘다.
//     4) 그레인     — 인화지 질감. 시드 고정이라 같은 사진은 항상 같은 결과.
//     5) 비네트     — 가장자리를 눌러 시선을 얼굴로.
//
//   전부 이 브라우저 안에서 끝난다 — 사진이 어디로도 전송되지 않는다.
//   (실제 얼굴 사진을 다루므로 중요하다. public/images/people/README.txt 참고)
// ─────────────────────────────────────────────────────────────────────────────

export const PHOTO_SIZE = 600;
export const PHOTO_QUALITY = 0.82;
export const RAW_QUALITY = 0.74; // 재보정용 원본 — 팩 용량을 아끼려 조금 낮게

export const STYLES = {
  dossier: '사건 파일 톤',
  plain: '원본 그대로',
};

// 듀오톤 램프 (그림자 → 중간 → 하이라이트). 게임의 종이 팔레트(#f0ede6/#6b6760)와 어울리게.
const RAMP = [
  [0x24, 0x1f, 0x1a],
  [0x8a, 0x7f, 0x6d],
  [0xf2, 0xec, 0xe0],
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 읽지 못했습니다. JPG 또는 PNG 로 저장한 뒤 다시 시도해 주세요.'));
    img.src = src;
  });
}

function fileURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    r.readAsDataURL(file);
  });
}

// ── 1단계: 정사각형 크롭 + 축소 ──────────────────────────────────────────────
// 보정 전 "원본"에 해당한다. 스타일을 바꾸면 이걸로 다시 보정한다.
export async function fileToRaw(file, size = PHOTO_SIZE) {
  if (!file || !file.type?.startsWith('image/')) throw new Error('이미지 파일이 아닙니다.');
  const img = await loadImage(await fileURL(file));

  // 가운데 정사각형으로 크롭 (얼굴이 가운데 오도록 찍는 것이 전제)
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', RAW_QUALITY);
}

// ── 2단계: 스타일 적용 ───────────────────────────────────────────────────────
export async function applyStyle(dataUri, style = 'dossier') {
  if (!dataUri) return dataUri;
  if (style !== 'dossier') return dataUri; // 'plain' — 손대지 않는다

  const img = await loadImage(dataUri);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  dossier(imageData);
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/jpeg', PHOTO_QUALITY);
}

// 파일 → 최종 사진 + 재보정용 원본
export async function fileToPhoto(file, style = 'dossier') {
  const raw = await fileToRaw(file);
  return { raw, photo: await applyStyle(raw, style) };
}

// ── 보정 본체 ────────────────────────────────────────────────────────────────
// {data: RGBA Uint8, width, height} 를 제자리에서 고친다.
// 캔버스에 의존하지 않으므로 Node 에서도 그대로 돌려 검증할 수 있다.
export function dossier(imageData) {
  const { data, width: w, height: h } = imageData;
  const n = w * h;

  // (1) 자동 레벨 — 밝기 히스토그램의 양 끝 0.5% 를 잘라 0~255 로 늘린다.
  //     조명이 다른 사진들을 같은 노출대로 모으는, 이 파이프라인에서 가장 중요한 단계.
  const hist = new Uint32Array(256);
  const lum = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    const l = (data[p] * 299 + data[p + 1] * 587 + data[p + 2] * 114) / 1000;
    lum[i] = l;
    hist[l | 0]++;
  }
  const clip = Math.max(1, Math.round(n * 0.005));
  let lo = 0;
  let hi = 255;
  for (let acc = 0; lo < 255; lo++) { acc += hist[lo]; if (acc > clip) break; }
  for (let acc = 0; hi > 0; hi--) { acc += hist[hi]; if (acc > clip) break; }
  const span = Math.max(1, hi - lo);

  // (1-b) 중간톤 정합 — 레벨만으로는 양 끝만 늘어날 뿐,
  //       어두운 사진은 여전히 어둡고 밝은 사진은 여전히 밝다.
  //       각 사진의 중간값이 같은 밝기로 오도록 감마를 건다. 이게 "한 세트"를 만드는 두 번째 축.
  let median = 128;
  for (let acc = 0, v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= n / 2) { median = v; break; }
  }
  const medT = Math.min(0.98, Math.max(0.02, (median - lo) / span));
  const TARGET = 0.52;
  const gamma = Math.min(2.2, Math.max(0.45, Math.log(TARGET) / Math.log(medT)));

  // 그레인용 시드 고정 난수 (같은 사진 → 항상 같은 결과)
  let seed = 0x9e3779b9;
  const rand = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return ((seed >>> 0) / 0xffffffff) - 0.5;
  };

  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.hypot(cx, cy);

  for (let i = 0; i < n; i++) {
    // (1) 레벨 적용 + 중간톤 정합
    let t = (lum[i] - lo) / span;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    t = Math.pow(t, gamma);

    // (2) 대비 S커브 (smoothstep 을 절반만 섞어 과하지 않게)
    t = t * 0.5 + (t * t * (3 - 2 * t)) * 0.5;

    // (3) 듀오톤 — 램프에서 색을 뽑는다
    let r;
    let g;
    let b;
    if (t < 0.5) {
      const k = t * 2;
      r = RAMP[0][0] + (RAMP[1][0] - RAMP[0][0]) * k;
      g = RAMP[0][1] + (RAMP[1][1] - RAMP[0][1]) * k;
      b = RAMP[0][2] + (RAMP[1][2] - RAMP[0][2]) * k;
    } else {
      const k = (t - 0.5) * 2;
      r = RAMP[1][0] + (RAMP[2][0] - RAMP[1][0]) * k;
      g = RAMP[1][1] + (RAMP[2][1] - RAMP[1][1]) * k;
      b = RAMP[1][2] + (RAMP[2][2] - RAMP[1][2]) * k;
    }

    // (4) 그레인
    const grain = rand() * 14;
    r += grain; g += grain; b += grain;

    // (5) 비네트 — 가장자리로 갈수록 어둡게
    const x = i % w;
    const y = (i / w) | 0;
    const d = Math.hypot(x - cx, y - cy) / maxR;
    const v = 1 - 0.38 * Math.max(0, d - 0.55) / 0.45;
    r *= v; g *= v; b *= v;

    const p = i * 4;
    data[p] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[p + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[p + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
}

// ── 용량 표시 ────────────────────────────────────────────────────────────────
export function photoBytes(dataUri) {
  if (typeof dataUri !== 'string') return 0;
  const comma = dataUri.indexOf(',');
  if (comma === -1) return 0;
  return Math.round((dataUri.length - comma - 1) * 0.75);
}

export const formatBytes = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}MB` : `${Math.round(n / 1000)}KB`;
