// ─────────────────────────────────────────────────────────────────────────────
// art — 솔로 게임 벡터(SVG) 일러스트. 외부 파일 없이 장면/초상/연출을 그린다.
//   하이브리드: 실제 그림 파일이 있으면 그걸 우선 쓰고(자동 교체), 없으면 SVG로 폴백.
//     · 장면 사진:  /images/scenes/<장소id>.jpg   (예: /images/scenes/ROOM-JH.jpg)
//     · 인물 초상:  gameData의 suspect.image (예: /images/people/s1.png)
//   프롬프트는 docs/solo-art-prompts.md 참고.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';

// 인물/방별 팔레트 (벽/바닥/포인트/따뜻한톤)
const PAL = {
  '최종현': { wall: '#26313f', floor: '#161d26', accent: '#4a7fb5', warm: '#c9a84c' },
  '윤은재': { wall: '#2b2440', floor: '#1a1528', accent: '#8368bd', warm: '#c9a84c' },
  '이현지': { wall: '#123430', floor: '#0c211d', accent: '#2fa384', warm: '#d8c98a' },
  '박희원': { wall: '#34301b', floor: '#221f11', accent: '#c9a84c', warm: '#e0c877' },
  '이사랑': { wall: '#341c28', floor: '#211119', accent: '#cf6f92', warm: '#e6b0c2' },
  '이가현': { wall: '#221d3c', floor: '#151129', accent: '#7a70d6', warm: '#c9c1f0' },
  '목사': { wall: '#2b1517', floor: '#190c0d', accent: '#c05a5a', warm: '#d89a6a' },
  _default: { wall: '#242a36', floor: '#151922', accent: '#5f7599', warm: '#c9a84c' },
};
const palOf = (loc) => PAL[loc?.person] || PAL._default;

// ── 공통 프레임: 벽 + 바닥(원근) + 걸레받이 ──
function Frame({ p }) {
  return (
    <>
      <rect x="0" y="0" width="800" height="300" fill={p.wall} />
      <rect x="0" y="0" width="800" height="300" fill="url(#vin)" />
      <polygon points="0,300 800,300 800,480 0,480" fill={p.floor} />
      <polygon points="0,300 800,300 640,360 160,360" fill="#ffffff08" />
      <rect x="0" y="296" width="800" height="8" fill="#00000040" />
    </>
  );
}
function Window({ x, y, p }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-6" y="-6" width="152" height="132" rx="6" fill="#00000030" />
      <rect x="0" y="0" width="140" height="120" rx="4" fill="url(#sky)" />
      <line x1="70" y1="0" x2="70" y2="120" stroke={p.wall} strokeWidth="6" />
      <line x1="0" y1="60" x2="140" y2="60" stroke={p.wall} strokeWidth="6" />
      <polygon points="10,10 55,10 20,110 10,110" fill="#ffffff22" />
    </g>
  );
}

// ── 침실(용의자 방) ──
function Bedroom({ p }) {
  return (
    <>
      <Frame p={p} />
      <Window x="70" y="70" p={p} />
      {/* 침대 */}
      <g transform="translate(430,270)">
        <rect x="0" y="40" width="330" height="120" rx="10" fill={p.accent} opacity="0.85" />
        <rect x="0" y="20" width="330" height="45" rx="10" fill="#ffffff18" />
        <rect x="12" y="0" width="120" height="55" rx="12" fill="#f2ede0" opacity="0.9" />
        <rect x="0" y="150" width="330" height="14" fill="#00000030" />
      </g>
      {/* 러그 */}
      <ellipse cx="250" cy="410" rx="180" ry="40" fill={p.accent} opacity="0.18" />
      {/* 책상 + 스탠드 */}
      <g transform="translate(60,300)">
        <rect x="0" y="60" width="150" height="16" rx="4" fill="#5a4632" />
        <rect x="8" y="76" width="16" height="80" fill="#4a3a29" />
        <rect x="126" y="76" width="16" height="80" fill="#4a3a29" />
        <rect x="20" y="20" width="46" height="40" rx="3" fill="#efe9dc" opacity="0.85" />
        <circle cx="120" cy="34" r="12" fill={p.warm} opacity="0.9" />
        <rect x="118" y="34" width="4" height="30" fill="#4a3a29" />
      </g>
      {/* 선반 */}
      <g transform="translate(250,120)">
        <rect x="0" y="0" width="120" height="10" fill="#5a4632" />
        {[0, 22, 44, 66, 88].map((x, i) => <rect key={i} x={6 + x} y={-34} width="14" height="34" fill={[p.warm, p.accent, '#c98', '#8ab', '#cb8'][i]} opacity="0.8" />)}
      </g>
      {/* 가방 */}
      <g transform="translate(300,360)">
        <rect x="0" y="0" width="70" height="60" rx="12" fill={p.accent} />
        <path d="M14,0 q21,-26 42,0" fill="none" stroke="#ffffff66" strokeWidth="6" />
      </g>
    </>
  );
}

// ── 목사방(현장) ──
function CrimeScene({ p }) {
  return (
    <>
      <Frame p={p} />
      <Window x="80" y="66" p={p} />
      {/* 침대 + 시신 실루엣 */}
      <g transform="translate(400,250)">
        <rect x="0" y="50" width="360" height="130" rx="10" fill="#3a2a2c" />
        <rect x="0" y="30" width="360" height="42" rx="10" fill="#ffffff12" />
        <rect x="14" y="10" width="120" height="52" rx="12" fill="#e8e0d4" opacity="0.85" />
        {/* 담요 아래 형체 */}
        <path d="M150,60 q60,-24 150,4 q30,10 30,26 l0,26 q-110,20 -210,0 z" fill="#5a4144" />
        <ellipse cx="180" cy="52" rx="26" ry="20" fill="#d8c3b0" opacity="0.6" />
      </g>
      {/* 폴리스 라인 */}
      <g transform="translate(0,150) rotate(-4)">
        <rect x="-20" y="0" width="860" height="26" fill={p.accent} opacity="0.9" />
        <text x="180" y="19" fontFamily="monospace" fontSize="18" fontWeight="700" fill="#1a0c0d" letterSpacing="6">CRIME SCENE · 출입금지 · CRIME SCENE</text>
      </g>
      {/* 넘어진 의자 */}
      <g transform="translate(120,360) rotate(24)">
        <rect x="0" y="0" width="60" height="12" rx="3" fill="#4a3a29" />
        <rect x="0" y="-46" width="12" height="46" fill="#4a3a29" />
        <rect x="6" y="12" width="10" height="40" fill="#4a3a29" />
        <rect x="46" y="12" width="10" height="40" fill="#4a3a29" />
      </g>
      {/* 증거 표식 */}
      {[[250, 400, '1'], [560, 420, '2'], [170, 300, '3']].map(([x, y, n]) => (
        <g key={n} transform={`translate(${x},${y})`}>
          <polygon points="0,0 26,0 13,-30" fill="#f2c14e" />
          <text x="13" y="-8" fontSize="13" fontWeight="700" textAnchor="middle" fill="#1a0c0d">{n}</text>
        </g>
      ))}
    </>
  );
}

// ── CCTV 열람실 ──
function CctvRoom({ p }) {
  return (
    <>
      <rect x="0" y="0" width="800" height="480" fill="#0a0f14" />
      <rect x="0" y="0" width="800" height="480" fill="url(#vin)" />
      {/* 모니터 벽 */}
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
        <g key={`${r}-${c}`} transform={`translate(${70 + c * 175},${40 + r * 120})`}>
          <rect x="0" y="0" width="150" height="96" rx="4" fill="#0d1c26" stroke="#1d3a4a" strokeWidth="2" />
          <rect x="6" y="6" width="138" height="84" fill="#12303e" opacity={0.5 + ((r + c) % 3) * 0.15} />
          <line x1="6" y1={20 + ((r * c) % 60)} x2="144" y2={20 + ((r * c) % 60)} stroke="#3fa0c9" strokeWidth="1.5" opacity="0.5" />
          <circle cx="130" cy="14" r="3" fill="#e05555" />
          <text x="10" y="86" fontSize="8" fontFamily="monospace" fill="#5fd0f0" opacity="0.7">CAM-{r * 4 + c + 1}</text>
        </g>
      )))}
      <rect x="0" y="400" width="800" height="80" fill="#0d151c" />
      <rect x="120" y="410" width="560" height="16" rx="4" fill="#16232e" />
    </>
  );
}

// ── 감식 의뢰실 ──
function Lab({ p }) {
  return (
    <>
      <Frame p={{ wall: '#12242a', floor: '#0b171b' }} />
      {/* 벤치 */}
      <rect x="60" y="330" width="680" height="20" rx="4" fill="#26454e" />
      <rect x="80" y="350" width="16" height="90" fill="#1c363d" />
      <rect x="704" y="350" width="16" height="90" fill="#1c363d" />
      {/* 비커들 */}
      {[[160, '#4fd6a8'], [240, '#c9a84c'], [320, '#cf6f92']].map(([x, c], i) => (
        <g key={i} transform={`translate(${x},250)`}>
          <path d="M6,0 L6,30 L-6,74 L46,74 L34,30 L34,0 Z" fill="#ffffff10" stroke="#7fd7e6" strokeWidth="2" />
          <path d="M-2,52 L42,52 L34,30 L6,30 Z" fill={c} opacity="0.75" />
        </g>
      ))}
      {/* 현미경 */}
      <g transform="translate(480,236)">
        <rect x="0" y="80" width="90" height="14" rx="3" fill="#2b4a52" />
        <rect x="10" y="20" width="14" height="64" fill="#37606b" />
        <rect x="6" y="6" width="40" height="20" rx="4" fill="#2b4a52" />
        <circle cx="26" cy="70" r="8" fill={p.warm} opacity="0.8" />
      </g>
      {/* 샘플 랙 */}
      <g transform="translate(610,270)">
        {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 20} y="0" width="12" height="46" rx="6" fill="#7fd7e6" opacity="0.5" />)}
      </g>
    </>
  );
}

// ── 압수 소지품(휴대폰 테이블) ──
function EvidenceTable({ p }) {
  return (
    <>
      <Frame p={{ wall: '#1a1c26', floor: '#101019' }} />
      <rect x="70" y="300" width="660" height="150" rx="8" fill="#20222e" />
      <rect x="70" y="300" width="660" height="20" rx="8" fill="#ffffff10" />
      {[110, 250, 390, 530, 670].map((x, i) => (
        <g key={i} transform={`translate(${x},250)`}>
          <rect x="0" y="0" width="66" height="120" rx="12" fill="#0c0e14" stroke="#3a3f52" strokeWidth="2" />
          <rect x="6" y="10" width="54" height="96" rx="4" fill={['#2a3550', '#3a2a40', '#213a34', '#3a3520', '#2a2140'][i]} />
          <circle cx="33" cy="112" r="4" fill="#3a3f52" />
          <rect x="6" y="128" width="60" height="14" rx="2" fill={p.warm} opacity="0.8" />
        </g>
      ))}
    </>
  );
}

// ── 공용 현장(복도) ──
function Hallway({ p }) {
  return (
    <>
      <rect x="0" y="0" width="800" height="480" fill={p.wall} />
      <polygon points="0,0 800,0 560,120 240,120" fill="#00000030" />
      <polygon points="0,480 800,480 560,360 240,360" fill={p.floor} />
      <polygon points="240,120 560,120 560,360 240,360" fill="#0000002a" />
      {/* 좌우 벽 문 */}
      {[[60, 160], [110, 200], [640, 200], [690, 160]].map(([x, w], i) => (
        <rect key={i} x={x} y={i < 2 ? 150 : 150} width="70" height={i === 0 || i === 3 ? 170 : 150} rx="4" fill={p.accent} opacity="0.5" />
      ))}
      {/* 천장 조명 */}
      {[280, 400, 520].map((x, i) => <rect key={i} x={x} y="70" width="40" height="10" rx="4" fill={p.warm} opacity="0.7" />)}
      <rect x="360" y="150" width="80" height="210" rx="4" fill="#00000040" />
    </>
  );
}

function SceneSVG({ location }) {
  const p = palOf(location);
  const kind = location.kind;
  let body;
  if (kind === 'cctv') body = <CctvRoom p={p} />;
  else if (kind === 'lab') body = <Lab p={p} />;
  else if (kind === 'phone') body = <EvidenceTable p={p} />;
  else if (kind === 'common') body = <Hallway p={p} />;
  else if (location.showBody || location.person === '목사') body = <CrimeScene p={p} />;
  else body = <Bedroom p={p} />;
  return (
    <svg viewBox="0 0 800 480" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="vin" cx="50%" cy="42%" r="75%">
          <stop offset="60%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </radialGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfe6f5" />
          <stop offset="100%" stopColor="#8fb4cf" />
        </linearGradient>
      </defs>
      {body}
    </svg>
  );
}

const COVER = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };

// 후보 이미지들을 순서대로 시도, 다 실패하면 아무것도 안 그림(뒤 SVG가 보임).
function HybridImg({ candidates, style, extra }) {
  const [i, setI] = useState(0);
  const list = candidates.filter(Boolean);
  if (i >= list.length) return null;
  return <img src={list[i]} alt="" style={style} onError={() => setI((n) => n + 1)} {...extra} />;
}

const scenesFor = (id, image) => [image, `/images/scenes/${id}.jpg`, `/images/scenes/${id}.png`, `/images/scenes/${id}.webp`];

/** 장면 배경 — 실제 그림(/images/scenes/<id>.{jpg,png,webp})이 있으면 우선, 없으면 SVG. */
export function SceneBg({ location }) {
  return (
    <>
      <SceneSVG location={location} />
      <HybridImg candidates={scenesFor(location.id, location.image)} style={{ ...COVER, pointerEvents: 'none' }} />
      {/* 필름 톤 비네트 — SVG/실사 위에 공통으로 얹어 분위기 통일 */}
      <div style={{ ...COVER, pointerEvents: 'none', background: 'radial-gradient(125% 90% at 50% 40%, transparent 52%, #000000b0 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 60px #000000aa' }} />
    </>
  );
}

// ── 인물 초상 ──
function AvatarSVG({ person, size = 64 }) {
  const p = PAL[person] || PAL._default;
  const initial = (person || '?').slice(-2, -1) || (person || '?')[0];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ borderRadius: 12, display: 'block' }}>
      <rect width="100" height="100" fill={p.wall} />
      <rect width="100" height="100" fill="url(#agrad)" />
      <defs>
        <linearGradient id="agrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff14" /><stop offset="100%" stopColor="#00000030" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="40" r="20" fill={p.accent} opacity="0.9" />
      <path d="M18,100 Q18,66 50,66 Q82,66 82,100 Z" fill={p.accent} opacity="0.85" />
      <text x="50" y="97" textAnchor="middle" fontSize="20" fontWeight="800" fill="#ffffffcc">{initial}</text>
    </svg>
  );
}

/** 인물 초상 — suspect.image가 있으면 우선, 없으면 SVG 아바타. */
export function Avatar({ person, image, size = 64 }) {
  const [imgOk, setImgOk] = useState(!!image);
  if (image && imgOk) {
    return <img src={image} alt="" onError={() => setImgOk(false)}
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: 12, display: 'block' }} />;
  }
  return <AvatarSVG person={person} size={size} />;
}

// ── 브리핑 히어로 (실제 그림 /images/briefing.{jpg,png} 있으면 우선) ──
export function BriefingArt() {
  return (
    <div style={{ position: 'relative', height: 180, borderRadius: 12, overflow: 'hidden' }}>
      <BriefingSVG />
      <HybridImg candidates={['/images/briefing.jpg', '/images/briefing.png']} style={COVER} />
    </div>
  );
}
function BriefingSVG() {
  return (
    <svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: 180, borderRadius: 12, display: 'block' }}>
      <defs>
        <linearGradient id="bnight" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a1220" /><stop offset="100%" stopColor="#0b0d12" /></linearGradient>
      </defs>
      <rect width="800" height="260" fill="url(#bnight)" />
      {/* 건물 실루엣 */}
      {[[40, 120], [130, 80], [210, 150], [300, 100], [520, 110], [610, 70], [690, 140]].map(([x, h], i) => (
        <rect key={i} x={x} y={260 - h} width="70" height={h} fill="#000000" opacity="0.5" />
      ))}
      {/* 십자가(교회) */}
      <g transform="translate(400,60)"><rect x="-4" y="0" width="8" height="60" fill="#c9a84c" /><rect x="-20" y="16" width="40" height="8" fill="#c9a84c" /></g>
      {/* 창문 불빛 */}
      {[[60, 170], [150, 200], [320, 180], [540, 190], [700, 160]].map(([x, y], i) => <rect key={i} x={x} y={y} width="10" height="12" fill="#c9a84c" opacity="0.7" />)}
      {/* 비 */}
      {Array.from({ length: 40 }).map((_, i) => <line key={i} x1={(i * 37) % 800} y1={(i * 53) % 200} x2={((i * 37) % 800) - 6} y2={((i * 53) % 200) + 18} stroke="#5f7599" strokeWidth="1" opacity="0.3" />)}
      {/* 폴리스 라인 */}
      <g transform="translate(0,200) rotate(-3)"><rect x="-20" y="0" width="860" height="22" fill="#c9a84c" opacity="0.92" /><text x="120" y="16" fontFamily="monospace" fontSize="14" fontWeight="700" fill="#1a1206" letterSpacing="5">POLICE LINE · 출입금지 · DO NOT CROSS</text></g>
    </svg>
  );
}

// ── 복도 원근 배경(문 카드 뒤에 깔림) ──
export function CorridorBg() {
  return (
    <svg viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="cend" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#e6c877" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e6c877" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 소실점 안쪽 벽 */}
      <rect x="330" y="112" width="140" height="96" fill="#1c222e" />
      <rect x="330" y="112" width="140" height="96" fill="url(#cend)" />
      {/* 천장 / 바닥 / 좌우 벽 (1점 투시) */}
      <polygon points="0,0 800,0 470,112 330,112" fill="#0e121b" />
      <polygon points="0,320 800,320 470,208 330,208" fill="#0b0e15" />
      <polygon points="0,0 330,112 330,208 0,320" fill="#161c28" />
      <polygon points="800,0 470,112 470,208 800,320" fill="#131824" />
      {/* 천장 조명(소실선 따라) */}
      {[0, 1, 2].map((i) => {
        const t = 0.18 + i * 0.22;
        const x1 = 330 * (1 - t), y1 = 112 * (1 - t);
        const x2 = 470 + (800 - 470) * (1 - t), y2 = 112 * (1 - t);
        return <line key={i} x1={x1} y1={y1 + 4} x2={x2} y2={y2 + 4} stroke="#e6c877" strokeWidth={1 + i} opacity="0.35" />;
      })}
      {/* 좌우 벽 문틀(방들이 늘어선 느낌) */}
      {[0, 1].map((i) => {
        const near = 0.34 + i * 0.34, far = near + 0.24;
        const lxN = 330 * (1 - near), lxF = 330 * (1 - far);
        const tyN = 112 * (1 - near), tyF = 112 * (1 - far);
        const byN = 320 - (320 - 208) * (1 - near), byF = 320 - (320 - 208) * (1 - far);
        return <g key={i}>
          <polygon points={`${lxN},${tyN + 18} ${lxF},${tyF + 14} ${lxF},${byF - 10} ${lxN},${byN - 14}`} fill="#0c1017" opacity="0.8" />
          <polygon points={`${800 - lxN},${tyN + 18} ${800 - lxF},${tyF + 14} ${800 - lxF},${byF - 10} ${800 - lxN},${byN - 14}`} fill="#0c1017" opacity="0.8" />
        </g>;
      })}
    </svg>
  );
}

// ── 엔딩 히어로 (실제 그림 /images/ending.{jpg,png} 있으면 우선) ──
export function EndingArt({ good }) {
  return (
    <div style={{ position: 'relative', height: 130, borderRadius: 12, overflow: 'hidden' }}>
      <EndingSVG good={good} />
      <HybridImg candidates={['/images/ending.jpg', '/images/ending.png']} style={COVER} />
    </div>
  );
}
function EndingSVG({ good }) {
  const c = good ? '#6fae4e' : '#c06868';
  return (
    <svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: 130, borderRadius: 12, display: 'block' }}>
      <rect width="800" height="200" fill="#0f0e0c" />
      <circle cx="400" cy="100" r="70" fill="none" stroke={c} strokeWidth="4" opacity="0.5" />
      <path d={good ? 'M366,100 l22,22 l46,-52' : 'M378,78 l44,44 M422,78 l-44,44'} fill="none" stroke={c} strokeWidth="8" strokeLinecap="round" />
      <text x="400" y="180" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="8" fill={c} opacity="0.85">CASE CLOSED</text>
    </svg>
  );
}
