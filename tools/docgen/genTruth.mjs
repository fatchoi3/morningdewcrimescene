// 진상 해설서 — 게임 종료 후 공개용. 피해자+6인 시점 서사.
// 정본 기준 피해자명 '김호치'. 단서 코드는 본문에 없음(순수 서사).
// 피해자명은 주입받는다 — loadData 를 직접 import 하면 node:fs 가 딸려 와 브라우저에서 못 쓴다.
let V = '김호치 목사';

const TRUTH_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Malgun Gothic','Apple SD Gothic Neo',serif;font-size:10.5pt;line-height:1.85;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
/* @page 에 여백을 주면 브라우저가 그 자리에 날짜·제목·주소·쪽번호를 찍는다. 여백은 본문이 든다. */
@page{margin:0}
body{padding:8mm 18mm}
.ch{padding-top:18mm}
.cover{background:#0f0e0c;color:#e8e4dc;padding:90px 56px;page-break-after:always;min-height:100vh}
.ct{font-size:8pt;letter-spacing:.25em;color:#5f5e5a;text-transform:uppercase;margin-bottom:22px}
.ctitle{font-size:34pt;font-weight:800;line-height:1.2;margin-bottom:16px}
.csub{font-size:13pt;color:#9c9a92;margin-bottom:40px}
.cbar{width:56px;height:2px;background:#c9a84c;margin-bottom:30px}
.cinfo{font-size:9.5pt;color:#5f5e5a;line-height:2.4}.cinfo span{color:#7a7976;margin-left:10px}
.warn-cover{margin-top:40px;padding:16px 20px;border:1px solid #5f3a2a;border-radius:8px;background:#1a120c;font-size:9.5pt;color:#c99a6a;line-height:1.7}
.ch{padding:34px 0 20px;page-break-before:always}.ch:first-of-type{page-break-before:avoid}
.eye{font-size:7.5pt;font-weight:800;letter-spacing:.2em;text-transform:uppercase;margin-bottom:6px}
.cht{font-size:23pt;font-weight:800;border-bottom:2px solid #1a1a1a;padding-bottom:12px;margin-bottom:8px}
.role{font-size:10pt;color:#888;margin-bottom:22px;font-weight:700}
.sec{font-size:8pt;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#9c9a92;margin:22px 0 8px}
p{margin-bottom:14px}p strong{font-weight:700}
.box{border-radius:8px;padding:16px 20px;margin:14px 0;border-left:3px solid}
.box .bl{font-size:7.5pt;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px}
.box p{font-size:10pt;line-height:1.8;margin-bottom:0}
.knew{background:#f0f8f0;border-color:#3B6D11}.knew .bl{color:#27500A}
.unknew{background:#fdf0ef;border-color:#A32D2D}.unknew .bl{color:#791F1F}
.key{background:#fdf8ed;border-color:#BA7517}.key .bl{color:#633806}
.final{background:#0f0e0c;color:#e8e4dc;padding:40px;border-radius:12px;margin-top:24px}
.final .fl{font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:#c9a84c;margin-bottom:14px}
.final p{font-size:11.5pt;line-height:1.9;color:#d8d4cc;margin-bottom:0}.final p strong{color:#fff}
.tag{display:inline-block;font-size:7.5pt;font-weight:800;padding:2px 9px;border-radius:10px;margin-left:8px;vertical-align:middle}
.tl{margin:14px 0}
.tl-row{display:flex;gap:14px;padding:9px 0;border-bottom:1px solid #efece6}.tl-row:last-child{border-bottom:none}
.tl-t{font-size:9.5pt;font-weight:700;color:#9c9a92;width:72px;flex-shrink:0}
.tl-x{font-size:10pt;line-height:1.65}.tl-x strong{font-weight:700}
`;

export function genTruth(data) {
  V = data?.victim?.name || V;
  const body = `
<div class="cover">
  <div class="ct">Crime Scene · Truth Reveal · 진상 해설서</div>
  <div class="ctitle">크라임씬<br>사건의 전말</div>
  <div class="csub">인물별 시점으로 풀어낸 진실 — 게임 종료 후 공개용</div>
  <div class="cbar"></div>
  <div class="cinfo">
    피해자<span>${V} (58세) — 베개 질식사</span><br>
    직접 범인<span>서지안 (전도사) — 베개 질식</span><br>
    별개 범행<span>한다영 · 한소미 · 문세린 — 서로 몰랐고 진범과도 공모하지 않았다</span><br>
    무고<span>최종현 · 강지후</span><br>
    구성<span>피해자 + 용의자 6인, 각 인물의 시점과 진실</span>
  </div>
  <div class="warn-cover">⚠ 이 문서는 사건의 답입니다. <b>봉투에 넣어 봉하고, 지목이 끝날 때까지 아무도 열지 않습니다.</b><br>여는 순간은 진행 순서의 <b>9번</b> — 최종 토론과 동시 지목이 끝난 뒤입니다. 한 사람이 처음부터 소리 내어 읽으면 됩니다.</div>
</div>

<div class="ch">
  <div class="eye" style="color:#6b6760">피해자</div>
  <div class="cht">${V}</div>
  <div class="role" style="color:#6b6760">58세 · 청년부 담임 목사 · 협심증 병력</div>
  <p><strong>자신도 모르게 여러 사람의 원한을 산 사람.</strong> ${V}은 청년부를 오래 이끌어온 담임이다. 그는 자신이 청년들에게 좋은 일을 한다고 믿었지만, 실제로는 여러 사람의 삶을 건드리고 있었다.</p>
  <p>그는 서지안 전도사의 <strong>신학교 수료증이 위조</strong>되었다는 의심을 품기 시작했다. 지인 목사가 "그 전도사 수료증 자격이 의심스럽다"는 카톡을 보내왔기 때문이다. 목사는 서지안에게 <strong>"수련회 끝나면 교단에 알아보겠다"</strong>고 통보했다 — 자신을 죽이려는 동기를 심어준 줄도 모르고.</p>
  <p>재정에서도 이상한 낌새를 느꼈다. 수련회 당일 아침, 목사는 우연히 청년부 통장 내역을 확인했는데 <strong>찬조금이 입금된 기록이 전혀 없었다.</strong> 그는 한다영 총무와 면담했고, 어물쩍 넘어가려는 그녀의 태도에 <strong>"수련회가 끝나면 재정을 점검해 모든 것을 밝히겠다"</strong>고 했다 — 빚에 쫓기던 그녀를 절망으로 몰아넣는 줄도 모르고.</p>
  <p>가장 결정적으로, 그는 청년 '멋짐교회 김민석'과 대화하다 <strong>상대가 문세린의 약혼자인 줄 모르고</strong> "세린이는 애도 있고 곧 결혼한다더라"는 이야기를 흘렸다. 이 한마디가 문세린의 파혼을 불렀다.</p>
  <div class="sec">당일 — 자신도 모르게 마신 독, 그리고 바뀐 약</div>
  <p>수련회 당일 오후, 목사는 평소처럼 최종현이 타준 보충제 음료를 마셨다. 그 음료에 심장에 위험한 요힘빈이 들어 있는 줄은 몰랐다. 얼마 후 협심증 발작이 시작됐다.</p>
  <div class="box key"><div class="bl">핵심 — 목사는 가짜 약을 알아챘다</div>
    <p>목사는 책상 위 설하정 통에서 약을 하나 꺼내 먹었다. 그런데 <strong>설하정 특유의 딸기 맛이 나지 않았다.</strong> 서지안이 비타민으로 바꿔놓은 것이었다. 이상함을 느낀 목사는 <strong>품에 항상 지니고 다니던 작은 약통에서 진짜 설하정을 꺼내 먹고</strong> 침대에서 안정을 취했다. (그 약통은 조금 전 강지후와의 실랑이에 셔츠 안쪽에서 떨어졌던 것이다 — 목사가 되찾아 책상에 올려 두었다.) <strong>"누가 약통을 바꿔놨지?"</strong> 의심하면서. — 그 무력한 순간, 서지안이 들어와 베개로 그를 눌렀다. 목사는 자신이 왜 죽는지도 모른 채 숨을 거뒀다.</p></div>
  <div class="box unknew"><div class="bl">목사가 끝내 몰랐던 것</div>
    <p>그는 자신이 무심코 던진 말과 결정들이 여섯 사람에게 어떤 칼이 되어 돌아왔는지 전혀 알지 못했다. 그의 죽음은 한 사람의 범행이 아니라, 그가 건드린 여러 삶이 한날한시에 폭발한 결과였다.</p></div>
</div>

<div class="ch">
  <div class="eye" style="color:#854F0B">직접 범인</div>
  <div class="cht">서지안<span class="tag" style="background:#FEF6E4;color:#854F0B">주범 · 베개 질식</span></div>
  <div class="role" style="color:#854F0B">28세 · 청년부 전도사</div>
  <p><strong>발단 — 위조가 들통날 위기.</strong> 서지안은 <strong>위조한 신학교 수료증으로 전도사가 되었다.</strong> 그런데 목사의 지인 목사가 "그 전도사 수료증 자격이 의심스럽다, 확인해 봤냐"는 카톡을 보냈고, 목사가 이를 확인하려 들면서 서지안은 위기에 몰렸다. 수련회 전날 면담에서 목사는 <strong>"수련회 끝나면 교단에 직접 알아보겠다"</strong>고 통보했다. 위조가 들통나면 모든 것이 끝이었다.</p>
  <div class="sec">계획 — 자연사로 위장</div>
  <p>서지안은 목사가 협심증을 앓는 걸 알고 있었다. 그는 자연사처럼 보이는 죽음을 계획했다. 수련회 당일 아침, 목사 방에 들어가 <strong>협심증 응급약 설하정 통의 6알을, 자신이 가져온 비타민C 6알과 바꿔치기</strong>했다. 발작이 와도 응급약이 듣지 않게 만든 것이다. (목사가 등산을 떠나 방이 빈 낮 12시 무렵의 일이다.) 빼낸 진짜 설하정은 버리지 않고 자신의 <strong>요일별 약통(월~토)</strong>에 비타민C·루테인·오메가3 같은 영양제와 섞어 숨겼다. (목사 책상의 설하정 통에는 노란 알약이 5알만 남게 되었다.)</p>
  <div class="sec">관찰 — 계획이 실패했다고 판단하다</div>
  <p>점심 직후, 서지안은 계획이 작동하는지 확인하려 목사 방 근처 복도를 여러 번 오갔다. 13시 15분경, 방 문의 <strong>작은 유리창</strong>으로 안을 들여다봤다. 그런데 목사는 죽기는커녕 <strong>침대에 누워 안정을 취하고 있었다.</strong> 서지안은 <strong>"가짜 약을 먹고도 버티는구나, 계획이 실패했다"</strong>고 판단했다. (사실 목사는 가짜 약을 알아채고 품속 진짜 설하정을 먹은 뒤였다.)</p>
  <div class="sec">실행 — 직접 살해</div>
  <p>서지안은 방 안에 CCTV가 없다는 걸 알고 있었다. 문을 열고 들어가 <strong>베개로 목사의 얼굴을 눌러 질식시켰다.</strong> 목사는 이미 발작으로 몸이 약해진 상태라 거의 저항하지 못했다. 서지안은 베개를 대충 내려놓고 급히 방을 빠져나와 자기 방으로 돌아갔다. 오후 일정에는 태연히, 심지어 애도하는 표정으로 참여했다.</p>
  <div class="box key"><div class="bl">직접 사인의 흔적 — 정황 추리형 (시스템이 확정해 주지 않음)</div>
    <p>베개로 얼굴을 누르자 목사는 발작으로 힘이 빠진 손을 본능적으로 들어 올렸고, 그 손이 서지안의 손목을 스치며 <strong>인조가죽 시곗줄에 옅은 자국을 하나</strong> 남겼다. 동시에 <strong>목사의 손톱 밑에는 정체를 알기 어려운 미세한 이물질</strong>이 꼈다. 서지안은 자국을 알아채지 못한 채 시계를 계속 착용한다.<br><br><strong>손톱 밑 이물(목사)·시곗줄의 새 자국(서지안)·문세린의 모기 긁힌 자국</strong>은 서로 직접 연결되거나 확정되지 않는다. 검식도 "이물질이 있다 + 현장과 이질적"까지만 말한다. 참가자가 정황을 스스로 엮어 추론해야 하며, <strong>서지안은 약을 바꾼 것까지는 인정하되 베개는 끝까지 부인한다</strong> — "약을 바꾼 것과 사람을 죽인 것은 다른 일입니다." 부검이 질식으로 나온 이상 그 편이 그에게도 유리하기 때문이다. 마무리는 운영자의 이 해설로 한다.</p></div>
  <div class="box unknew"><div class="bl">서지안이 몰랐던 진실 — 가장 큰 아이러니</div>
    <p>그는 "내 가짜 약 때문에 발작이 안 멎은 것"이라 생각했지만, 목사가 발작한 진짜 이유는 <strong>한다영이 바꿔치기한 요힘빈 음료</strong> 때문이었다. 그리고 목사는 가짜 약을 알아채고 진짜 설하정을 따로 먹었기에, 서지안의 약 바꿔치기는 사실상 빗나갔다. <strong>그가 "계획 실패"라 판단해 직접 죽이지 않았다면, 사인은 전혀 다르게 흘러갔을 것이다.</strong> 그가 베개를 누른 것이 직접 사인이 됐다.</p></div>
</div>

<div class="ch">
  <div class="eye" style="color:#0F6E56">독립 범행</div>
  <div class="cht">한다영<span class="tag" style="background:#FDEAEA;color:#A32D2D">라벨 교체</span></div>
  <div class="role" style="color:#A32D2D">25세 · 청년부 총무 · 한소미의 동생</div>
  <p><strong>빚을 갚으려다 살인의 도화선이 되다.</strong> 부모가 빚을 남기고 세상을 떠났을 때, 언니 한소미가 <strong>상속을 포기</strong>하면서 빚은 동생 한다영에게 집중됐다. 한다영은 그 사정을 모른 채, 언니가 <strong>"빚 무서워 혼자 발 뺐다"</strong>고 오해하고 등을 돌렸다. 홀로 빚더미를 진 그녀는 대출마저 막히자, 결국 <strong>청년부 찬조금에 손을 댔다.</strong> 청년부 통장에는 그 돈이 들어온 적이 없었다.</p>
  <p>그런데 수련회 당일 아침, <strong>목사가 우연히 청년부 통장 내역을 확인하고 찬조금이 입금되지 않은 것을 발견했다.</strong> 목사는 한다영과 면담했고, 어물쩍 넘어가려는 그녀에게 수련회 후 재정을 점검하겠다고 했다. 빚을 갚으려던 계획이 무너지자 한다영은 절망에 빠졌다.</p>
  <div class="box key"><div class="bl">전날 밤 — 오해가 풀리던 순간</div>
    <p>수련회 전날, 한다영은 통장을 정리하다 <strong>언니가 수년째 자기 빚을 몰래 갚아온 송금 내역</strong>을 발견했다. "발 뺀 줄 알았던" 언니가 한 번도 손을 놓지 않았던 것이다. 그날 밤 한다영은 언니에게 카톡으로 오해를 사과했고, 언니는 상속포기의 진짜 이유를 길게 털어놓았다. <strong>화해가 막 시작된 그 자리에서</strong>, 한다영은 "목사님이 장부를 보자고 한다"는 위기까지 고백했다.</p></div>
  <div class="sec">범행 — 라벨 교체</div>
  <p>한다영은 목사를 완전히 죽일 생각까진 없었다. 다만 <strong>"목사가 한 번 쓰러져서 재정 점검이 미뤄지기만 하면"</strong> 하는 마음이었다. 막내 최종현이 위험한 다이어트 보충제 요힘빈을 먹는다는 걸 알고 있던 그녀는, 최종현이 등산 간 사이 그의 방에 들어가 <strong>요힘빈 통과 단백질 통의 라벨지를 바꿔놨다.</strong> 라벨을 오릴 때 흰 가루가 화장품 파우치에 묻었다.</p>
  <div class="box unknew"><div class="bl">한다영이 몰랐던 진실</div>
    <p>그녀는 요힘빈 발작이 죽음까진 안 갈 거라 생각했다. 목사에게 응급약이 있으니까. 하지만 <strong>서지안이 이미 그 응급약을 가짜로 바꿔놨다는 것</strong>도, <strong>목사를 실제로 죽인 건 베개 질식(서지안)</strong>이라는 것도 몰랐다. 심지어 <strong>친언니 한소미가 같은 날 목사 텀블러에 수면제를 넣었다는 것</strong>조차 몰랐다. 그녀는 "혹시 내 요힘빈 때문인가" 떨지만, 직접 사인은 그녀의 것이 아니다.</p></div>
</div>

<div class="ch">
  <div class="eye" style="color:#0F6E56">독립 범행</div>
  <div class="cht">한소미<span class="tag" style="background:#E8F8F2;color:#0F6E56">수면제 · 사인 무관</span></div>
  <div class="role" style="color:#0F6E56">26세 · 청년부 회계 · 한다영의 친언니</div>
  <p><strong>동생을 지키려 한 또 하나의 범행.</strong> 한소미는 한다영의 친언니이자 청년부 회계다. 부모가 떠났을 때 한소미는 <strong>남은 것이 빚인 줄 몰랐다.</strong> 재산이 조금이라도 있다면 동생에게 다 주고 싶어 상속을 포기했는데, 뚜껑을 열어 보니 재산이 아니라 빚이었고 그것이 고스란히 동생에게 몰렸다. 되돌리려 해도 <strong>한소미 앞으로도 개인 채무가 있어서</strong>, 그녀가 상속에 이름을 올리면 자기 채권자들이 동생 몫까지 들고 갈 판이었다. 동생에게 더 큰 피해를 줄까 봐 연락을 끊고 잠수했고 — 동생은 그것을 "언니가 빚 무서워 발 뺐다"고 받아들였다. 해명하려면 자기 빚부터 꺼내야 해서, 그녀는 끝내 말하지 못했다. 하지만 한소미는 <strong>그 뒤로 자기 월급에서 조금씩, 동생 모르게 빚을 갚아왔다.</strong> 한 번도 손을 놓은 적이 없었다.</p>
  <p>이 상처 입은 관계를 둘 다 인정하고 싶지 않아, 같은 교회에 다니면서도 남남처럼 굴었다. 사람들은 그저 '사이 안 좋은 두 임원'으로만 알았다 — 데면데면함 자체가 위장이 됐다. 그런데 전날 밤 동생이 송금 내역을 발견해 오해가 풀렸고, 곧이어 <strong>"목사님이 장부를 보자고 한다, 나 찬조금에 손댔다"는 동생의 위기</strong>를 알게 됐다. 끝내 놓지 못한 동생이 범죄로 무너지려 하자, 한소미는 움직였다.</p>
  <div class="sec">범행 — 텀블러에 수면제</div>
  <p>한소미는 동생과 구체적 방법을 상의하지 않고 독자적으로 움직였다. <strong>목사 책상 위에는 항상 개인 텀블러가 놓여 있었다.</strong> 그녀는 강한 수면제(졸피뎀)를 그 텀블러에 타 넣었다. 목사가 깊이 잠들어 정신을 못 차리면 재정 점검도 흐지부지될 거라 생각했다. 캡슐 포일은 방 휴지통에 버렸다.</p>
  <div class="box unknew"><div class="bl">한소미가 몰랐던 진실 — 허무한 결말</div>
    <p>그녀의 계획은 실행됐지만, <strong>목사는 그 텀블러를 마시기도 전에 죽었다.</strong> 요힘빈 발작과 서지안의 베개 질식이 먼저였기 때문이다. 그녀의 수면제는 사인과 전혀 무관하다. 그녀는 <strong>동생이 같은 날 라벨을 바꿨다는 것</strong>도, <strong>서지안이 목사를 직접 죽였다는 것</strong>도 몰랐다. 자매는 각자 따로, 서로 모르게, 같은 사람을 노렸던 것이다.</p></div>
  <div class="box key"><div class="bl">사건 후 — 서로를 감싼 교차 삭제</div>
    <p>목사 사망이 알려지자, 두 사람은 각자 자기 폰에서 전날의 자매·범행 정황 카톡을 급히 지웠다 — <strong>서로의 구체적 범행은 모른 채, 본능적으로 상대가 의심받을 정황을 지운 것이다.</strong> 하지만 카톡은 상대 폰에 남아 교차로 복원된다. 동생 폰 톡서랍은 언니 생일(0302), 언니 폰 톡서랍은 동생 생일(0815)로 잠겨 있어, 한쪽 폰을 열려면 상대의 다이어리를 읽어야 한다 — 그 과정에서 자매 관계가 드러난다.</p></div>

  <div class="note"><div class="note-t">지운 사람이 하나 더 있다 — 서지안</div>
    <p>서지안도 자기 폰에서 대화방 하나를 지웠다. <strong>수료증을 만들어 준 브로커</strong>와 나눈 것으로,
      "조회하면 바로 드러나냐"고 묻고는 <strong>"만약 조회 전에 일이 정리되면, 굳이 들출 사람은 없겠죠?"</strong>라고
      적은 대화다. 살의를 가장 직접적으로 드러낸 문장이며, 톡서랍은 <strong>0847</strong> —
      위조 수료증 발급번호(2016-0847)의 뒷자리로 잠겨 있다. 인생을 건 번호라 그가 쓴 것이고,
      그래서 <strong>수료증 진위조회를 푼 사람은 이 대화방도 열 수 있다.</strong></p></div>
</div>

<div class="ch">
  <div class="eye" style="color:#185FA5">무고</div>
  <div class="cht">최종현<span class="tag" style="background:#EAF3FC;color:#185FA5">무고 · 도구로 이용됨</span></div>
  <div class="role" style="color:#185FA5">23세 · 청년부 서기</div>
  <p><strong>자기가 죽인 줄 알고 떠는 무고한 사람.</strong> 최종현은 청년부 막내 서기다. 다이어트를 위해 요힘빈 보충제를 먹었고, 목사와 자주 등산하며 보충제 음료를 타드리는 게 일상이었다. 그는 요힘빈과 단백질을 각각 통에 담아 일반 라벨지에 손으로 이름을 써 붙여 구분했다.</p>
  <p>수련회 당일, 그는 가방을 방에 두고 목사와 등산을 갔다. 돌아온 뒤 방에서 가방을 챙겨 <strong>"단백질"이라 적힌 통</strong>으로 음료를 타 목사에게 드렸다. 그게 진짜 단백질인 줄 알았다. 하지만 그 사이 한다영이 라벨지를 바꿔놔서, 실제로는 요힘빈이 든 음료였다.</p>
  <p>목사가 방에 들어간 뒤 나오지 않자 최종현은 극도의 불안에 빠졌다. <strong>"내가 드린 음료 때문에 잘못된 건가."</strong> 그는 화장실을 들락거리며 자책했다.</p>
  <div class="box knew"><div class="bl">진실 — 그는 무고하다</div>
    <p>그는 자기가 목사를 죽였을지 모른다는 공포에 시달리지만, <strong>아무 잘못이 없다.</strong> 라벨을 바꾼 건 한다영이고, 목사를 실제로 죽인 건 서지안의 베개다. 최종현은 도구로 이용당했을 뿐이다. 성분 분석으로 "라벨이 바뀌었다"는 사실이 밝혀져야 그의 누명이 풀린다. 그는 거짓말을 하지 않는다 — 진실만이 그를 지킨다.</p></div>
</div>

<div class="ch">
  <div class="eye" style="color:#444440">무고</div>
  <div class="cht">강지후<span class="tag" style="background:#F0EFEC;color:#444440">무고 · 발작 촉진 의혹</span></div>
  <div class="role" style="color:#444440">24세 · 찬양팀장</div>
  <p><strong>하필 최악의 순간에 화를 낸 사람.</strong> 강지후는 찬양팀장이다. 십 년 된 마이크가 예배 때마다 소리가 끊겨, 음향 장비를 바꾸자는 제안서를 견적서까지 붙여 올렸다. <strong>목사는 거부 도장을 찍었다</strong> — 두 번, 세 번째는 "은혜롭지 않다"는 말 한마디로 반려했다. 찬양곡 선정을 두고도 오래 부딪혀 온 터라 감정이 쌓여 있었다.</p>
  <p>그는 어제 못 끝낸 갈등을 마저 따지려고, 목사·종현이 등산을 떠난 직후 <strong>10시 5분경 산으로 따라 올라갔다.</strong> 그러나 산 중턱에서 종현과 함께 있는 목사를 먼발치에 보고는 말 붙이길 포기하고 10시 35분경 되돌아 내려왔다. (종현은 지후를 보지 못했다.)</p>
  <p>점심 직후 12시 41분경, 그는 복도에서 목사가 방으로 들어가는 걸 보고 따라 들어가 따졌다. 언쟁이 격해지자 <strong>목사의 멱살을 잡았고</strong>, 목사가 "이거 놓으라"며 <strong>지후의 손목을 잡고 가볍게 뿌리치는</strong> 과정에서 지후 손목에 멍이 들고 목사의 셔츠 단추 하나가 떨어졌다. 이때 <strong>셔츠 안쪽에 넣어 두었던 작은 약통도 함께 바닥에 떨어졌다.</strong> 큰 몸싸움은 아니었다. 목사가 그 약통을 바닥에서 찾고 있는 사이 12시 45분경 지후는 문을 쾅 닫고 나왔고, 그가 나올 때까지 <strong>목사는 멀쩡했고 아직 요힘빈 음료를 마시기 전이었다.</strong></p>
  <div class="box knew"><div class="bl">진실 — 그는 무고하다</div>
    <p>그는 멱살·옷깃·손목 멍 때문에 의심받지만, 이는 쌍방의 <strong>가벼운 실랑이</strong>일 뿐 질식(목 압박)과는 무관하다 — 의학적으로 사인이 될 수 없다. 산행도 접촉 없이 먼발치에 보고 돌아선 것뿐이다. 오히려 그가 <strong>"내가 나올 때 목사님은 멀쩡했다"</strong>고 증언하는 것이 요힘빈 복용 시각을 특정하는 단서가 된다.</p></div>
</div>

<div class="ch">
  <div class="eye" style="color:#534AB7">증거 인멸</div>
  <div class="cht">문세린<span class="tag" style="background:#EEEDFE;color:#534AB7">증거 인멸 · 신고 지연</span></div>
  <div class="role" style="color:#534AB7">28세 · 청년부 회장</div>
  <p><strong>죽은 사람을 발견하고, 신고 대신 비밀을 지운 사람.</strong> 문세린에겐 숨겨온 비밀이 있었다 — 이혼 경력과 다섯 살 딸. 그녀는 딸을 "조카"라 속이며 살아왔다. 그녀의 약혼자는 같은 교회 청년 '김민석'이었다.</p>
  <p>그런데 목사가 김민석에게 (상대가 세린의 약혼자인 줄 모르고) "세린이는 애도 있고 곧 결혼한다더라"고 흘렸다. 충격받은 김민석은 세린에게 파혼을 통보했다. 분노한 세린은 목사에게 <strong>"당신 때문에 이렇게 됐잖아요!"</strong>라는 카톡을 보냈다.</p>
  <div class="sec">당일 — 이미 죽어 있던 목사</div>
  <p>수련회 당일 13시 23분경, 세린은 목사를 따지러 방에 들어갔다. 그런데 <strong>목사는 이미 죽어 있었다.</strong> (서지안이 떠난 지 3분 뒤였다.) 충격 속에서 그녀는 냉정하게 판단했다 — 이대로면 자신의 비밀과 항의 카톡이 다 드러난다. <strong>목사 폰은 지문으로 열린다.</strong> 사망 직후라 손가락을 대자 그대로 열렸고, 그녀는 카카오톡에서 <strong>김민석과의 험담 대화와 자신의 항의 카톡을 삭제</strong>한 뒤 13시 34분에야 112에 신고했다. 지우는 데는 비밀번호가 필요 없다 — 열려 있으면 그만이다. (되살리려면 톡서랍 비번 <strong>0419</strong>가 필요하고, 그 숫자는 목사 일기장 <code>PRBO-03</code>의 "결혼기념일 4월 19일"에서 나온다. 세린은 그 번호를 몰라도 됐다.) 진입 시각과 신고 시각의 큰 공백이 그녀를 의심받게 만들었다.</p>
  <div class="box key"><div class="bl">역설 — 그녀만 아는 결정적 진실</div>
    <p>그녀는 <strong>누가 목사를 죽였는지 모른다.</strong> 들어갔을 때 이미 죽어 있었으니까. 하지만 역설적으로 그녀는 결정적 단서를 쥐고 있다 — <strong>"내가 들어갔을 때 방엔 아무도 없었고, 목사는 이미 죽어 있었다."</strong> 그녀의 진입 시각을 역산하면, 그 직전에 누군가(서지안)가 다녀갔다는 게 드러난다. 그녀의 증거 인멸은 자기 비밀을 지키기 위한 것이었지, 살인과는 무관하다. (그녀가 지운 대화를 되살리는 열쇠는 목사 일기장의 "결혼기념일 4월 19일"이다 — 톡서랍 비번 0419.)</p></div>
</div>

<div class="ch">
  <div class="eye" style="color:#9c9a92">전체 진상</div>
  <div class="cht">하나로 꿰는 진실</div>
  <div class="sec">당일 시간 순 — 무슨 일이 있었나</div>
  <div class="tl">
    <div class="tl-row"><div class="tl-t">전날 밤</div><div class="tl-x"><strong>한다영</strong> 통장 정리 중 언니 송금 내역 발견 → 카톡으로 화해 → 언니에게 횡령 위기 고백. <strong>한소미</strong> "내가 알아서 할게."</div></div>
    <div class="tl-row"><div class="tl-t">당일 아침</div><div class="tl-x"><strong>목사</strong> 우연히 청년부 통장 확인 → 찬조금 미입금 발견 → 한다영 면담, 재정 점검 예고. <strong>한소미</strong> 동생을 끝까지 지키기로 결심.</div></div>
    <div class="tl-row"><div class="tl-t">10:00</div><div class="tl-x"><strong>최종현·목사</strong> 등산 출발. (목사 방·복도가 ~12:30까지 비워짐)</div></div>
    <div class="tl-row"><div class="tl-t">10:05</div><div class="tl-x"><strong>강지후</strong> 뒤따라 산으로 출발 — 어제 못 끝낸 찬양곡 갈등을 마저 따지려.</div></div>
    <div class="tl-row"><div class="tl-t">10:10~12</div><div class="tl-x"><strong>서지안</strong> 빈 방에 들어가 설하정 6알 ↔ 비타민C 6알 바꿔치기. 진짜 설하정은 요일별 약통에 숨김.</div></div>
    <div class="tl-row"><div class="tl-t">10:20</div><div class="tl-x"><strong>한소미</strong> 빈 방에 들어가 목사 책상 위 텀블러에 졸피뎀 투입 → 퇴장.</div></div>
    <div class="tl-row"><div class="tl-t">10:25~27</div><div class="tl-x"><strong>한다영</strong> 최종현 방에서 요힘빈↔단백질 라벨지 교체.</div></div>
    <div class="tl-row"><div class="tl-t">10:35</div><div class="tl-x"><strong>강지후</strong> 복귀 — 산 중턱에서 종현을 먼발치에 보고 말 못 붙이고 되돌아옴(종현은 지후를 못 봄).</div></div>
    <div class="tl-row"><div class="tl-t">10:50~52</div><div class="tl-x"><strong>문세린</strong> 1차 확인 방문 — 목사가 등산 중이라 방이 비어 있어 그냥 돌아 나감.</div></div>
    <div class="tl-row"><div class="tl-t">12:00~12:25</div><div class="tl-x"><strong>한다영·한소미</strong> 등산 복귀 전 빈 시간, 식당·숙소·1층 로비를 따로따로 배회.</div></div>
    <div class="tl-row"><div class="tl-t">12:30</div><div class="tl-x"><strong>최종현·목사</strong> 등산 복귀. 종현은 자기 방으로, 목사는 목사 방으로.</div></div>
    <div class="tl-row"><div class="tl-t">12:40</div><div class="tl-x"><strong>최종현</strong> "단백질"(실제 요힘빈) 음료를 모르고 목사에게 전달.</div></div>
    <div class="tl-row"><div class="tl-t">12:41~45</div><div class="tl-x"><strong>강지후</strong> 목사 방 언쟁 — 멱살 잡음 → 목사가 "놓으라"며 지후 손목 잡고 뿌리침(손목 멍·셔츠 단추). <strong>셔츠 안쪽의 작은 약통도 함께 떨어짐</strong> → 목사가 찾는 사이 지후 퇴장. 이때 목사는 아직 음료 미복용 · 멀쩡함. (가벼운 실랑이, 질식과 무관)</div></div>
    <div class="tl-row"><div class="tl-t">12:42</div><div class="tl-x"><strong>문세린</strong> 목사 방 쪽에 갔다가 문 창문으로 지후·목사의 언쟁을 목격하고 되돌아 나감.</div></div>
    <div class="tl-row"><div class="tl-t">~12:50</div><div class="tl-x"><strong>목사</strong> 요힘빈 음료 복용 → 컨디션 악화 시작.</div></div>
    <div class="tl-row"><div class="tl-t">13:10</div><div class="tl-x"><strong>목사</strong> 협심증 발작. 책상 설하정(가짜 비타민) 복용 → 딸기맛 안 남 → 이상 감지 → <strong>품속 진짜 설하정</strong> 복용 후 침대에서 잠시 안정.</div></div>
    <div class="tl-row"><div class="tl-t">13:15</div><div class="tl-x"><strong>서지안</strong> 유리창으로 안을 봄 → "안정 취함 = 실패" 판단 → 진입 → 베개 질식 살해 (직접 사인).</div></div>
    <div class="tl-row"><div class="tl-t">13:20</div><div class="tl-x"><strong>서지안</strong> 숙소 방향으로 퇴장.</div></div>
    <div class="tl-row"><div class="tl-t">13:23</div><div class="tl-x"><strong>문세린</strong> 발견 진입 → 이미 사망 → 목사 손가락으로 폰을 열어 카톡 기록 삭제.</div></div>
    <div class="tl-row"><div class="tl-t">13:34</div><div class="tl-x"><strong>문세린</strong> 112 신고. (진입~신고 공백이 의심을 부름)</div></div>
    <div class="tl-row"><div class="tl-t">사건 후</div><div class="tl-x"><strong>한다영·한소미</strong> 각자 자기 폰에서 전날 자매·범행 정황 카톡 삭제 (서로 모른 채 상대를 감쌈) — 상대 폰엔 남아 교차 복원됨.</div></div>
  </div>
  <div class="box key" style="margin-top:18px"><div class="bl">동선 분리 — 서지안 퇴장과 세린 진입은 마주치지 않는다</div>
    <p>서지안 퇴장(13:20, 숙소 방향)과 세린 진입(13:23, 자기 방 쪽)은 출발 위치가 다르고 3분 시차라 복도에서 마주치지 않는다. 질식(≈13:18)~세린 진입(13:23)이 약 5분이라 시신은 "막 사망" 상태. 둘 다 CCTV는 방향만 포착이라, 세린이 "지안이 나오는 걸 봤다"고 증언할 근거는 없다.</p></div>
  <div class="final"><div class="fl">사건의 본질</div>
    <p>여섯 사람이 각자 다른 이유로, 서로 모르게, 같은 날 같은 사람을 노렸다. 한다영은 <strong>빚</strong> 때문에, 한소미는 <strong>동생</strong> 때문에, 서지안은 <strong>자격</strong> 때문에, 문세린은 <strong>파혼</strong> 때문에. 최종현과 강지후는 무고하지만 하필 최악의 타이밍에 얽혔다.<br><br>목사를 실제로 죽인 건 <strong>서지안의 베개</strong>다. 하지만 그 죽음을 만든 건 목사 자신이 무심코 건드린 <strong>여섯 사람의 얽힌 원한 전부</strong>였다.</p></div>
</div>
`;
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>진상 해설서</title><style>${TRUTH_CSS}</style></head><body>${body}</body></html>`;
  return { filename: '진상해설서.html', html };
}
