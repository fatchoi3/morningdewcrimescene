// ─────────────────────────────────────────────────────────────────────────────
// vn — 역전재판식 화면 문법 컴포넌트(하단 대사창 + 커맨드바 + 상단 HUD).
//   DialogueBox: 위치 라벨 + 화자 + 타자체 텍스트 + ▶(넘김). 박스 탭 = 즉시완성/다음.
//     ref.tap() 노출 — 화면 어디를 탭해도 대사를 넘길 수 있게 부모가 위임 호출.
//     actions: 대사창 우측 하단의 이동 버튼(다른 질문·나가기). 본문 탭과 분리된다.
//   CommandBar : 하단 고정 커맨드 — '이 화면에서 할 행동'만(조사한다·이 말에 증거 …).
//   TopHud     : 우측 상단 고정 — 사건기록(수첩)처럼 어느 화면에서나 같은 자리.
// ─────────────────────────────────────────────────────────────────────────────
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export const DialogueBox = forwardRef(function DialogueBox({ location, speaker, text, onAdvance, hint, onTyping, actions, low }, ref) {
  const [shown, setShown] = useState('');
  const full = text || '';
  const doneRef = useRef(false);
  const idRef = useRef(null);
  useEffect(() => {
    setShown(''); doneRef.current = false;
    onTyping?.(true);                       // 타이핑 시작 → 화자 '말하는 중'
    let i = 0;
    idRef.current = setInterval(() => {
      i += 1; setShown(full.slice(0, i));
      if (i >= full.length) { doneRef.current = true; onTyping?.(false); clearInterval(idRef.current); idRef.current = null; }
    }, 20);
    return () => { clearInterval(idRef.current); idRef.current = null; onTyping?.(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);
  const done = shown.length >= full.length;
  const tap = () => {
    if (!doneRef.current) {
      // 타이핑 중 탭 → 진행 중 인터벌을 멈추고 즉시 전체 표시(안 멈추면 인터벌이 다시 덮어써 줄었다 늘었다 함)
      if (idRef.current) { clearInterval(idRef.current); idRef.current = null; }
      setShown(full); doneRef.current = true; onTyping?.(false);
    } else if (onAdvance) onAdvance();
  };
  useImperativeHandle(ref, () => ({ tap }));
  const acts = (actions || []).filter(Boolean);
  return (
    <div className={`aa-dialogue${low ? ' low' : ''}`} onClick={tap}>
      {location && <div className="aa-loc">{location}</div>}
      <div className="aa-box">
        {speaker && <div className="aa-speaker">{speaker}</div>}
        <div className="aa-text">
          {shown}
          {done && onAdvance && <span className="aa-next">▶</span>}
        </div>
        {hint && <div className="aa-hint">{hint}</div>}
        {/* 이동 버튼 — 여기를 눌러도 대사가 넘어가면 안 되므로 전파를 끊는다 */}
        {acts.length > 0 && (
          <div className="aa-dlg-actions" onClick={(e) => e.stopPropagation()}>
            {acts.map((a, i) => (
              <button key={i} className={`aa-dlg-act${a.tone ? ' ' + a.tone : ''}`} onClick={a.onClick}>{a.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// 우측 상단 고정 HUD — 수첩(사건 기록)처럼 화면이 바뀌어도 자리가 안 바뀌는 것들
export function TopHud({ children }) {
  return <div className="aa-hud">{children}</div>;
}

export function CommandBar({ items }) {
  return (
    <div className="aa-cmd">
      {items.filter(Boolean).map((it, i) => (
        <button key={i} className={`aa-cmd-btn${it.active ? ' on' : ''}`} onClick={it.onClick}>
          <span className="aa-cmd-ic">{it.icon}</span>{it.label}
        </button>
      ))}
    </div>
  );
}
