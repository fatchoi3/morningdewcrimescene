// ─────────────────────────────────────────────────────────────────────────────
// CastEditor — 운영자용 캐스팅 편집기 (배포 없이 인물을 바꾸는 화면).
//
//   저장하면 이 브라우저에만 남는다(localStorage). 서버로 아무것도 가지 않는다.
//   다른 기기·다른 운영자에게 넘길 때는 [파일로 내보내기] 로 JSON 한 장을 주면 된다.
//
//   기본값과 다른 항목만 팩에 담는다. 손대지 않은 항목은 저장소 기본값을 계속 따라가므로,
//   나중에 원본 시나리오가 고쳐지면 그 변경이 그대로 반영된다.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useRef, useState } from 'react';
import { cast, castDefaults, castOrder } from '../data/cast.js';
import { readPack, writePack, clearPack, PACK_VERSION } from '../data/castPack.js';
import { resolveString } from '../data/tokens.js';
import { fileToPhoto, applyStyle, photoBytes, formatBytes, STYLES } from './castPhoto.js';

const IDS = ['victim', ...castOrder];

const LABEL = {
  name: '이름', short: '줄임말', role: '호칭', age: '나이', gender: '성별',
  occupation: '직책', family: '가족', notes: '소개', hint: '힌트', detail: '상세',
};

// 인물마다 어떤 서술 필드를 쓰는지 (피해자는 hint/detail, 용의자는 notes)
const proseFields = (id) => (id === 'victim' ? ['hint', 'detail'] : ['notes']);

// 피해자만 '호칭'(목사)을 따로 갖는다 — 본문의 '김호치 목사' 는 이름+호칭 합성이다.
const nameFields = (id) => (id === 'victim' ? ['name', 'role', 'short'] : ['name', 'short']);

// 조사가 바뀌는 걸 눈으로 보여 주는 예문
const PREVIEW = {
  victim: '{{victim.full}}님({{victim.age}})이 개인 방에서 발견되었다.',
  default: '{{id.short|과/와}} 함께 1층으로 나갔다. "{{id.short|아/야}}, 어디 갔었어?" — {{id|이/가}} 대답했다.',
};

function previewFor(id, people) {
  const tpl = id === 'victim' ? PREVIEW.victim : PREVIEW.default.replaceAll('{{id', `{{${id}`);
  try { return resolveString(tpl, people); } catch { return ''; }
}

// 폼 상태 → 실제로 바뀐 것만 담은 팩
function buildPack(form, style) {
  const people = {};
  for (const id of IDS) {
    const cur = form[id];
    const def = castDefaults[id];
    const patch = {};

    for (const f of [...nameFields(id), 'gender', 'occupation', 'family', ...proseFields(id)]) {
      const v = (cur[f] ?? '').trim();
      if (v !== '' && v !== (def[f] ?? '')) patch[f] = v;
    }
    if (String(cur.age) !== String(def.age) && String(cur.age).trim() !== '') patch.age = Number(cur.age);
    if (cur.image && cur.image !== def.image) {
      patch.photo = cur.image;
      // 보정 전 원본도 같이 담는다 — 나중에 스타일만 바꿔 다시 보정할 수 있도록.
      if (cur.imageRaw) patch.photoRaw = cur.imageRaw;
    }
    if (cur.color && cur.color !== def.theme.color) patch.color = cur.color;
    if (cur.bg && cur.bg !== def.theme.bg) patch.bg = cur.bg;

    if (Object.keys(patch).length) people[id] = patch;
  }
  return { version: PACK_VERSION, photoStyle: style, people };
}

// 현재 적용된 캐스팅(기본 + 저장된 팩)으로 폼 초기값을 만든다.
// 보정 전 원본(photoRaw)은 cast 에 없으므로 저장된 팩에서 직접 꺼낸다.
function initialForm() {
  const saved = readPack();
  const form = {};
  for (const id of IDS) {
    const p = cast[id];
    form[id] = {
      imageRaw: saved?.people?.[id]?.photoRaw ?? '',
      name: p.name, short: p.short ?? '', role: p.role ?? '',
      age: p.age, gender: p.gender,
      occupation: p.occupation, family: p.family ?? '',
      notes: p.notes ?? '', hint: p.hint ?? '', detail: p.detail ?? '',
      image: p.image, color: p.theme.color, bg: p.theme.bg,
    };
  }
  return form;
}

export default function CastEditor() {
  const [form, setForm] = useState(initialForm);
  const [style, setStyle] = useState(() => readPack()?.photoStyle ?? 'dossier');
  const [status, setStatus] = useState(readPack() ? '저장된 팩이 적용되어 있습니다.' : '기본 캐스팅입니다.');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const set = (id, field, value) =>
    setForm((f) => ({ ...f, [id]: { ...f[id], [field]: value } }));

  // 미리보기용 — 토큰 해석에 쓸 {id: {name, short}} 맵
  const people = useMemo(() => {
    const m = {};
    for (const id of IDS) {
      const f = form[id];
      m[id] = { name: f.name, short: f.short || f.name, role: f.role, age: f.age };
    }
    m.victim = { ...m.victim, full: `${form.victim.name} ${form.victim.role}`.trim() };
    return m;
  }, [form]);

  const pack = useMemo(() => buildPack(form, style), [form, style]);
  const changedCount = Object.keys(pack.people).length;
  const totalBytes = useMemo(
    () => IDS.reduce((n, id) => n + photoBytes(form[id].image), 0),
    [form],
  );

  async function onPhoto(id, file) {
    setError('');
    setBusy(true);
    try {
      const { raw, photo } = await fileToPhoto(file, style);
      setForm((f) => ({ ...f, [id]: { ...f[id], image: photo, imageRaw: raw } }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // 스타일을 바꾸면 올려 둔 사진을 원본에서 전부 다시 보정한다.
  // (원본을 팩에 함께 담아 두기 때문에 재업로드가 필요 없다.)
  async function onStyle(next) {
    setStyle(next);
    setError('');
    const targets = IDS.filter((id) => form[id].imageRaw);
    if (!targets.length) return;
    setBusy(true);
    try {
      const redone = await Promise.all(targets.map((id) => applyStyle(form[id].imageRaw, next)));
      setForm((f) => {
        const out = { ...f };
        targets.forEach((id, i) => { out[id] = { ...out[id], image: redone[i] }; });
        return out;
      });
      setStatus(`${STYLES[next]}(으)로 사진 ${targets.length}장을 다시 보정했습니다.`);
    } catch (e) {
      setError(`보정에 실패했습니다: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  function onSave() {
    setError('');
    const r = writePack(pack);
    if (!r.ok) { setError(r.error); return; }
    setStatus(`저장했습니다 (${changedCount}명 변경, ${formatBytes(r.bytes)}). 게임 화면을 새로 고치면 반영됩니다.`);
  }

  function onReset() {
    clearPack();
    setForm(() => {
      const f = {};
      for (const id of IDS) {
        const p = castDefaults[id];
        f[id] = {
          imageRaw: '',
          name: p.name, short: p.short ?? '', role: p.role ?? '',
          age: p.age, gender: p.gender,
          occupation: p.occupation, family: p.family ?? '',
          notes: p.notes ?? '', hint: p.hint ?? '', detail: p.detail ?? '',
          image: p.image, color: p.theme.color, bg: p.theme.bg,
        };
      }
      return f;
    });
    setStatus('기본 캐스팅으로 되돌렸습니다.');
  }

  function onExport() {
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cast-pack.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onImport(file) {
    setError('');
    try {
      const incoming = JSON.parse(await file.text());
      if (!incoming?.people) throw new Error('people 항목이 없습니다.');
      setForm((f) => {
        const next = { ...f };
        for (const id of IDS) {
          const patch = incoming.people[id];
          if (!patch) continue;
          next[id] = {
            ...next[id],
            ...Object.fromEntries(
              ['name', 'short', 'role', 'gender', 'occupation', 'family', 'notes', 'hint', 'detail']
                .filter((k) => typeof patch[k] === 'string')
                .map((k) => [k, patch[k]]),
            ),
            ...(patch.age !== undefined ? { age: patch.age } : {}),
            ...(patch.photo ? { image: patch.photo } : {}),
            ...(patch.photoRaw ? { imageRaw: patch.photoRaw } : {}),
            ...(patch.color ? { color: patch.color } : {}),
            ...(patch.bg ? { bg: patch.bg } : {}),
          };
        }
        return next;
      });
      if (incoming.photoStyle && STYLES[incoming.photoStyle]) setStyle(incoming.photoStyle);
      setStatus('불러왔습니다. 확인한 뒤 [저장]을 누르세요.');
    } catch (e) {
      setError(`팩을 읽지 못했습니다: ${e.message}`);
    }
  }

  return (
    <div className="ce">
      <header className="ce-top">
        <div>
          <h1>캐스팅 편집</h1>
          <p className="ce-sub">
            이름·나이·사진을 바꿔 우리 팀에 맞게 꾸밉니다. 사건의 내용과 트릭은 그대로입니다.
          </p>
        </div>
        <div className="ce-actions">
          <button className="ce-btn ce-primary" onClick={onSave}>저장</button>
          <button className="ce-btn" onClick={onExport}>파일로 내보내기</button>
          <button className="ce-btn" onClick={() => fileRef.current?.click()}>파일에서 불러오기</button>
          <button className="ce-btn ce-danger" onClick={onReset}>기본값으로</button>
          <input
            ref={fileRef} type="file" accept="application/json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }}
          />
        </div>
      </header>

      <div className="ce-status">
        <span>{status}</span>
        <span className="ce-meta">
          변경 {changedCount}명 · 사진 합계 {formatBytes(totalBytes)}
        </span>
      </div>
      {error && <div className="ce-error">{error}</div>}

      <div className="ce-style">
        <span className="ce-style-label">사진 보정</span>
        {Object.entries(STYLES).map(([key, label]) => (
          <label key={key} className={`ce-chip${style === key ? ' is-on' : ''}`}>
            <input
              type="radio" name="photoStyle" value={key} checked={style === key}
              onChange={() => onStyle(key)} disabled={busy}
            />
            {label}
          </label>
        ))}
        <span className="ce-hint">
          {style === 'dossier'
            ? '밝기를 고르게 맞추고 같은 색조·질감을 입혀 6명이 한 세트로 보이게 합니다.'
            : '올린 사진을 그대로 씁니다(크기만 조정).'}
        </span>
        {busy && <span className="ce-hint">처리 중…</span>}
      </div>

      <p className="ce-note">
        저장은 <b>이 브라우저에만</b> 됩니다. 사진도 밖으로 전송되지 않습니다.
        다른 기기나 다른 운영자에게 넘기려면 [파일로 내보내기] 로 받은 JSON 을 전달하세요.
      </p>

      <div className="ce-grid">
        {IDS.map((id) => {
          const cur = form[id];
          const def = castDefaults[id];
          const dirty = !!pack.people[id];
          return (
            <section key={id} className={`ce-card${dirty ? ' is-dirty' : ''}`}>
              <div className="ce-card-top">
                <span className="ce-id" style={{ background: cur.bg, color: cur.color }}>
                  {id === 'victim' ? '피해자' : id}
                </span>
                {dirty && <span className="ce-dirty">변경됨</span>}
              </div>

              <div className="ce-photo-row">
                <div className="ce-photo" style={{ borderColor: cur.color }}>
                  {cur.image
                    ? <img src={cur.image} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    : <span>{cur.name.slice(0, 1)}</span>}
                </div>
                <div className="ce-photo-side">
                  <label className="ce-btn ce-small">
                    사진 바꾸기
                    <input
                      type="file" accept="image/*" hidden
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(id, f); e.target.value = ''; }}
                    />
                  </label>
                  {cur.image !== def.image && (
                    <button
                      className="ce-btn ce-small"
                      onClick={() => setForm((f) => ({ ...f, [id]: { ...f[id], image: def.image, imageRaw: '' } }))}
                    >
                      되돌리기
                    </button>
                  )}
                  <span className="ce-hint">
                    {photoBytes(cur.image) ? formatBytes(photoBytes(cur.image)) : '기본 이미지'}
                  </span>
                </div>
              </div>

              <div className="ce-fields">
                {nameFields(id).map((f) => (
                  <label key={f} className="ce-f">
                    <span>{LABEL[f]}</span>
                    <input value={cur[f] ?? ''} onChange={(e) => set(id, f, e.target.value)} />
                  </label>
                ))}
                <label className="ce-f ce-narrow">
                  <span>{LABEL.age}</span>
                  <input type="number" value={cur.age} onChange={(e) => set(id, 'age', e.target.value)} />
                </label>
                <label className="ce-f ce-narrow">
                  <span>{LABEL.gender}</span>
                  <input value={cur.gender} onChange={(e) => set(id, 'gender', e.target.value)} />
                </label>
                <label className="ce-f ce-wide">
                  <span>{LABEL.occupation}</span>
                  <input value={cur.occupation} onChange={(e) => set(id, 'occupation', e.target.value)} />
                </label>
                <label className="ce-f ce-wide">
                  <span>{LABEL.family}</span>
                  <input value={cur.family} onChange={(e) => set(id, 'family', e.target.value)} />
                </label>
                {proseFields(id).map((f) => (
                  <label key={f} className="ce-f ce-wide">
                    <span>{LABEL[f]}</span>
                    <textarea rows={3} value={cur[f]} onChange={(e) => set(id, f, e.target.value)} />
                  </label>
                ))}
                <label className="ce-f ce-narrow">
                  <span>글자색</span>
                  <input type="color" value={cur.color} onChange={(e) => set(id, 'color', e.target.value)} />
                </label>
                <label className="ce-f ce-narrow">
                  <span>배경색</span>
                  <input type="color" value={cur.bg} onChange={(e) => set(id, 'bg', e.target.value)} />
                </label>
              </div>

              <div className="ce-preview">
                <span>본문 예시</span>
                <p>{previewFor(id, people)}</p>
              </div>
            </section>
          );
        })}
      </div>

      <p className="ce-note ce-foot">
        본문의 조사는 이름의 받침에 맞춰 자동으로 바뀝니다 — <b>종현과 → 수아와</b>, <b>종현아 → 수아야</b>.
        위 [본문 예시]에서 미리 확인할 수 있습니다.
        다만 <b>소개·힌트·상세</b>를 직접 고치면 그 문장은 입력한 글자 그대로 쓰이므로,
        다른 인물 이름을 적을 때는 바뀐 이름으로 적어 주세요.
      </p>
    </div>
  );
}
