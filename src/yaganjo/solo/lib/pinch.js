// ─────────────────────────────────────────────────────────────────────────────
// lib/pinch — 방 그림 손가락 확대·축소(두 손가락 벌리기/오므리기).
//   트랙(방 그림) 높이를 z배로 바꾼다. 핫스팟은 % 좌표라 그대로 따라온다.
//   가장 작게 = 그림 전체가 화면 너비에 들어오는 배율(방 전체 보기). 가장 크게 = 기본의 2배쯤.
//   손가락 사이 한가운데 점이 제자리에 머물도록 스크롤을 같이 옮긴다.
//   브라우저의 화면 전체 확대는 이 그림 안에서만 막는다(두 손가락일 때만) — 한 손가락 밀기는 그대로.
//   높이는 React 스타일이 아니라 직접 쓴다 — 스크롤마다 다시 그려질 때 제스처 중의 배율이 되돌아가지 않게.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
/** 가로 그림: 폰 세로(640px 이하)는 기본이 화면 높이의 122%(밀어서 보기), 그보다 넓으면 100%.
 *  세로 그림(3:4): 처음부터 그림 전체가 화면에 들어오게 — 폰 세로에 맞춰 뽑은 그림이라 밀 필요가 없다. */
const phone = () => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 640px)').matches;
const fitW = (c, ratio) => (c && c.clientHeight ? c.clientWidth / (ratio * c.clientHeight) : 1);
// 세로 그림은 아래 대화창(DLG px)을 뺀 자리에 통째로 들어가게 — 안 그러면 맨 아래 물건이 대화창에 가린다
const DLG = 170;
const fitAbove = (c) => (c && c.clientHeight ? Math.max(0.3, (c.clientHeight - DLG) / c.clientHeight) : 1);
const baseFor = (c, ratio) => (ratio < 1 ? Math.min(1, fitW(c, ratio), fitAbove(c)) : phone() ? 1.22 : 1);

export function usePinchZoom(camRef, trackRef, { ratio, resetKey, onChange }) {
  const baseZoom = () => baseFor(camRef.current, ratio);
  const [z, setZ] = useState(() => (phone() ? 1.22 : 1));
  const zRef = useRef(z);
  const cb = useRef(onChange);
  cb.current = onChange;

  const minZ = () => Math.min(baseZoom(), fitW(camRef.current, ratio));
  const maxZ = () => Math.max(baseZoom(), minZ() * 1.8) * 2.2;
  // 「크게 보기」가 가는 배율 — 기본이 이미 전체 보기(세로 그림)면 전체의 1.8배
  const bigZ = () => (baseZoom() > minZ() + 0.02 ? baseZoom() : minZ() * 1.8);

  // (cx, cy) 화면 좌표의 점을 고정한 채 배율을 바꾼다
  const zoomTo = (nz, cx, cy) => {
    const c = camRef.current, tr = trackRef.current;
    if (!c || !tr) return;
    nz = clamp(nz, minZ(), maxZ());
    const cr = c.getBoundingClientRect();
    if (cx == null) { cx = cr.left + cr.width / 2; cy = cr.top + cr.height / 2; }
    const r1 = tr.getBoundingClientRect();
    const fx = r1.width ? (cx - r1.left) / r1.width : 0.5;
    const fy = r1.height ? (cy - r1.top) / r1.height : 0.5;
    tr.style.height = `${nz * 100}%`;
    zRef.current = nz;
    const r2 = tr.getBoundingClientRect();
    c.scrollLeft += r2.left - (cx - fx * r2.width);
    c.scrollTop += r2.top - (cy - fy * r2.height);
    cb.current?.();
  };

  // 방을 옮기거나 그림 비율이 도착하면 기본 배율로
  useEffect(() => { const b = baseZoom(); zRef.current = b; setZ(b); }, [resetKey, ratio]);
  useLayoutEffect(() => {
    const tr = trackRef.current;
    if (tr) tr.style.height = `${z * 100}%`;
    zRef.current = z;
  }, [z, resetKey]);

  useEffect(() => {
    const c = camRef.current;
    if (!c) return undefined;
    let start = null;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const mid = (t) => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2];
    const onStart = (e) => {
      if (e.touches.length === 2) { start = { d: dist(e.touches) || 1, z: zRef.current }; e.preventDefault(); }
    };
    const onMove = (e) => {
      if (!start || e.touches.length !== 2) return;
      e.preventDefault();
      const [mx, my] = mid(e.touches);
      zoomTo(start.z * (dist(e.touches) / start.d), mx, my);
    };
    const onEnd = (e) => {
      if (start && e.touches.length < 2) { start = null; setZ(zRef.current); }
    };
    c.addEventListener('touchstart', onStart, { passive: false });
    c.addEventListener('touchmove', onMove, { passive: false });
    c.addEventListener('touchend', onEnd);
    c.addEventListener('touchcancel', onEnd);
    return () => {
      c.removeEventListener('touchstart', onStart);
      c.removeEventListener('touchmove', onMove);
      c.removeEventListener('touchend', onEnd);
      c.removeEventListener('touchcancel', onEnd);
    };
  }, [ratio]);

  const atMin = z <= minZ() + 0.02;
  const canZoomOut = minZ() < bigZ() - 0.02;
  /** 「방 전체 보기」 ↔ 「크게 보기」 한 번에 */
  const toggle = () => {
    const nz = atMin ? bigZ() : minZ();
    zoomTo(nz);
    setZ(zRef.current);
    // 크게 보기로 돌아올 땐 가운데부터
    if (atMin) {
      const c = camRef.current, tr = trackRef.current;
      if (c && tr) {
        c.scrollLeft = Math.max(0, (tr.offsetWidth - c.clientWidth) / 2);
        c.scrollTop = Math.max(0, (tr.offsetHeight - c.clientHeight) / 2);
      }
    }
  };
  return { z, atMin, canZoomOut, toggle };
}
