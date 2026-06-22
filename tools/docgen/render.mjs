// 단서의 특수 데이터(phone/pages/wallet/schedule/cctv/tapReveal)를
// 인쇄용 HTML 블록으로 렌더링한다. 필드 형식은 src/components/*.jsx 와 일치.

export function esc(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 줄바꿈(\n) → <br>, 문단(\n\n)은 split 후 <p>
function paras(text) {
  return String(text || '').split('\n\n').map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}

/* ── 핸드폰 ─────────────────────────────────────────── */
export function renderPhone(phone) {
  if (!phone) return '';
  let h = `<div class="phone"><div class="phone-owner">📱 ${esc(phone.owner)}</div>`;
  for (const app of (phone.apps || [])) {
    if (app.type === 'contacts') {
      h += `<div class="pht">연락처</div><div class="contacts">`;
      h += (app.contacts || []).map((c) =>
        `<span class="contact">${esc(c.name)}${c.who ? ` <em>(${esc(c.who)})</em>` : ''}</span>`).join('');
      h += `</div>`;
    } else if (app.type === 'browser') {
      h += `<div class="pht">인터넷 검색 기록</div>`;
      for (const s of (app.searches || [])) {
        h += `<div class="srch"><div class="srch-q">🔍 "${esc(s.query)}"</div>` +
             (s.title ? `<div class="srch-t">${esc(s.title)}</div>` : '') +
             `<div class="srch-s">${esc(s.snippet)}</div></div>`;
      }
    } else if (app.type === 'kakao' || app.type === 'sms') {
      const label = app.type === 'kakao' ? '카카오톡' : '메시지';
      const pw = app.recoverPassword ? ` <span class="pw">톡서랍 비번 ${esc(app.recoverPassword)}</span>` : '';
      h += `<div class="pht">${label}${pw}</div>`;
      for (const chat of (app.chats || [])) {
        const del = chat.deleted ? ' <span class="del">[삭제된 대화 — 톡서랍 복구]</span>' : '';
        h += `<div class="kk"><div class="kkn">${esc(chat.name)}${del}</div>`;
        for (const m of (chat.messages || [])) {
          if (m.deleted) { h += `<div class="msg dl">(삭제된 메시지)</div>`; continue; }
          const who = m.from === 'me' ? 'me' : 'them';
          const pre = m.from === 'me' ? '나' : '상대';
          h += `<div class="msg ${who}"><b>${pre}:</b> ${esc(m.text)}` +
               (m.time ? ` <span class="t">${esc(m.time)}</span>` : '') + `</div>`;
        }
        h += `</div>`;
      }
    } else if (app.type === 'photos') {
      h += `<div class="pht">사진</div>`;
      for (const p of (app.photos || [])) {
        const dl = p.deleted ? ' <span class="del">[삭제됨]</span>' : '';
        h += `<div class="photo">🖼 ${esc(p.caption) || '(설명 없음)'}${dl}</div>`;
      }
    }
  }
  h += `</div>`;
  return h;
}

/* ── 페이지물(일기장·다이어리·설명서) ───────────────── */
export function renderPages(pages, title) {
  if (!pages) return '';
  let h = `<div class="pagedoc"><div class="phone-owner">📖 ${esc(title)}</div>`;
  for (const pg of pages) {
    h += `<div class="pht">${esc(pg.title)}</div><div class="pagebody">${paras(pg.content)}</div>`;
  }
  h += `</div>`;
  return h;
}

/* ── 지갑 ───────────────────────────────────────────── */
export function renderWallet(wallet) {
  if (!wallet) return '';
  let h = `<div class="phone"><div class="phone-owner">👛 ${esc(wallet.owner)}</div>`;
  for (const it of (wallet.items || [])) {
    h += `<div class="wal">${esc(it.icon) || '🗂️'} <b>${esc(it.label)}</b> — ${esc(it.detail)}</div>`;
  }
  h += `</div>`;
  return h;
}

/* ── 일정표 ─────────────────────────────────────────── */
export function renderSchedule(schedule) {
  if (!schedule) return '';
  let h = `<table class="sched"><tr><th>시각</th><th>대상</th><th>제목</th><th>면담 내용</th></tr>`;
  for (const e of (schedule.entries || [])) {
    h += `<tr><td class="nowrap">${esc(e.time)}</td><td class="nowrap"><b>${esc(e.person)}</b></td>` +
         `<td>${esc(e.title)}</td><td>${esc(e.content)}</td></tr>`;
  }
  h += `</table>`;
  return h;
}

/* ── CCTV 타임라인 (인물 클릭 → unlocks) ────────────── */
export function renderCctv(cctv, titleOf) {
  if (!cctv) return '';
  let h = `<table class="cctv"><tr><th>시각</th><th>위치</th><th>장면</th><th>인물 → 확보 단서</th></tr>`;
  for (const t of (cctv.timeline || [])) {
    const people = (t.people || []).map((p) =>
      `${esc(p.who)} <span class="arrow">→</span> <code>${esc(p.unlocks)}</code> ${esc(titleOf ? titleOf(p.unlocks) : '')}` +
      (p.look ? `<div class="look">${esc(p.look)}</div>` : '')).join('<hr>');
    h += `<tr><td class="nowrap">${esc(t.time)}</td><td>${esc(t.location)}</td>` +
         `<td>${esc(t.scene)}</td><td>${people}</td></tr>`;
  }
  h += `</table>`;
  return h;
}

/* ── tapReveal (N회 탭 시 숨은 이벤트) ──────────────── */
export function renderTapReveal(tr) {
  if (!tr) return '';
  return `<div class="tapreveal">👆 <b>${tr.taps}회 탭 시 발견:</b> ${esc(tr.text)}</div>`;
}
