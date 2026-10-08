// ─────────────────────────────────────────────────────────────────────────────
// ui/crash — 화면이 깨져도 갇히지 않게 하는 안전장치.
//   그리기 오류 하나에 화면 전체가 까맣게 꺼지고, 저장이 그 화면을 가리키면 다시 열어도 꺼졌다
//   (2026-10-08 시험: 새벽이슬 수료증 진위조회 → 까만 화면 → 「이어서 하기」마다 멈춤, 진행 불가).
//   진행 기록은 그대로 두고 화면만 복도(허브)로 돌려 다시 연다. (두 게임이 한 벌씩 — saveKey 만 다르다)
// ─────────────────────────────────────────────────────────────────────────────
import { Component } from 'react';

export class CrashGuard extends Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { console.error('[솔로] 화면 오류', err); }
  backToHub = () => {
    try {
      const raw = localStorage.getItem(this.props.saveKey);
      if (raw) {
        const s = JSON.parse(raw);
        s.screen = s.started ? 'hub' : 'start';
        localStorage.setItem(this.props.saveKey, JSON.stringify(s));
      }
    } catch { /* 저장을 못 읽어도 다시 열기는 한다 */ }
    location.reload();
  };
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="solo-wrap" style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: '2rem' }}>🛠</div>
          <h2 style={{ margin: '8px 0' }}>화면에 문제가 생겼어요</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>모은 단서와 진행은 그대로 남아 있어요. 복도로 돌아가 이어서 하세요.</p>
          <button className="s-btn" style={{ width: '100%', marginTop: 12 }} onClick={this.backToHub}>복도로 돌아가기</button>
          <button className="s-btn ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => location.reload()}>다시 열기</button>
        </div>
      </div>
    );
  }
}
