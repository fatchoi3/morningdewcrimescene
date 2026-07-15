// ─────────────────────────────────────────────────────────────────────────────
// vn — 역전재판식 화면 문법 컴포넌트(하단 대사창 + 커맨드바).
//   DialogueBox: 위치 라벨 + 화자 + 타자체 텍스트 + ▶(넘김). 박스 탭 = 즉시완성/다음.
//     ref.tap() 노출 — 화면 어디를 탭해도 대사를 넘길 수 있게 부모가 위임 호출.
//   CommandBar : 하단 고정 커맨드(조사한다·이야기한다·이동한다·법정기록 …).
// ─────────────────────────────────────────────────────────────────────────────
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export const DialogueBox = forwardRef(function DialogueBox({ location, speaker, text, onAdvance, hint }, ref) {
  const [shown, setShown] = useState('');
  const full = text || '';
  const doneRef = useRef(false);
  useEffect(() => {
    setShown(''); doneRef.current = false;
    let i = 0;
    const id = setInterval(() => {
      i += 1; setShown(full.slice(0, i));
      if (i >= full.length) { doneRef.current = true; clearInterval(id); }
    }, 20);
    return () => clearInterval(id);
  }, [full]);
  const done = shown.length >= full.length;
  const tap = () => {
    if (!done) { setShown(full); doneRef.current = true; }
    else if (onAdvance) onAdvance();
  };
  useImperativeHandle(ref, () => ({ tap }));
  return (
    <div className="aa-dialogue" onClick={tap}>
      {location && <div className="aa-loc">{location}</div>}
      <div className="aa-box">
        {speaker && <div className="aa-speaker">{speaker}</div>}
        <div className="aa-text">
          {shown}
          {done && onAdvance && <span className="aa-next">▶</span>}
        </div>
        {hint && <div className="aa-hint">{hint}</div>}
      </div>
    </div>
  );
});

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
