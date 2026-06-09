// Church Round · Direction C — 오늘의 말씀
// Canonical = DailyVerse. From code: verse, reference, is_active, today verse
// hero + add form + verse list (verse·reference·active·date).
// Exports window.VerseScreen

function VerseScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const verses = [
    ['수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라','마태복음 11:28',true,'2026.06.03'],
    ['여호와는 나의 목자시니 내게 부족함이 없으리로다','시편 23:1',false,'2026.06.02'],
    ['내가 너와 함께 있어 네가 어디로 가든지 너를 지키리라','창세기 28:15',false,'2026.06.01'],
    ['항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라','데살로니가전서 5:16-18',false,'2026.05.31'],
  ];

  return (
    <CShell
      active="verse"
      title="오늘의 말씀"
      subtitle="매일의 은혜로운 말씀을 나눕니다"
      headerRight={<button className="cs-cta">{I.plus}말씀 추가</button>}
    >
      <style>{`
        .vs-hero{background:linear-gradient(135deg,#0E1729,#1B2740);border-radius:var(--cr-radius);
          padding:36px 40px;color:#fff;margin-bottom:18px;position:relative;overflow:hidden;}
        .vs-hero .badge{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;
          color:#9DB0CC;background:rgba(255,255,255,.08);padding:5px 12px;border-radius:999px;margin-bottom:18px;}
        .vs-hero .badge svg{width:14px;height:14px;}
        .vs-hero .q{font-size:26px;line-height:1.55;font-weight:600;letter-spacing:-.01em;max-width:820px;}
        .vs-hero .quote{font-family:'Newsreader',serif;font-style:italic;font-size:60px;color:var(--cr-primary);
          line-height:0;position:absolute;top:48px;right:40px;opacity:.5;}
        .vs-hero .ref{font-size:15px;color:var(--cr-primary);font-weight:700;margin-top:18px;}
        .vs-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);overflow:hidden;}
        .vs-ch{padding:15px 18px;border-bottom:1px solid #EEF1F6;display:flex;align-items:center;justify-content:space-between;}
        .vs-ct{font-size:14px;font-weight:700;}
        .vs-ct small{color:#94A3B8;font-weight:600;font-size:12px;margin-left:6px;}
        .vs-li{display:flex;align-items:flex-start;gap:14px;padding:16px 18px;border-bottom:1px solid #F1F4F9;}
        .vs-li:last-child{border-bottom:none;}
        .vs-li:hover{background:#FAFBFD;}
        .vs-q{flex:1;min-width:0;}
        .vs-q .t{font-size:14px;color:#1F2937;line-height:1.6;}
        .vs-q .m{display:flex;align-items:center;gap:11px;margin-top:8px;}
        .vs-ref{font-size:12.5px;font-weight:700;color:var(--cr-primary);}
        .vs-st{font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:999px;}
        .vs-date{font-size:11.5px;color:#94A3B8;}
        .vs-acts{display:flex;gap:7px;flex:0 0 auto;}
        .vs-b{width:30px;height:30px;border-radius:7px;border:1px solid #E3E8F0;display:inline-flex;align-items:center;
          justify-content:center;color:#64748B;background:#fff;}
        .vs-b svg{width:15px;height:15px;}
      `}</style>

      {caseId === '빈 상태' ? <CEmpty icon={I.book} title="등록된 말씀이 없습니다" desc="첫 말씀을 등록해 교인들과 나누세요." cta="말씀 추가" /> :
      (<React.Fragment>
      <div className="vs-hero">
        <span className="quote">”</span>
        <div className="badge">{I.calendar}2026년 6월 3일 · 오늘의 말씀</div>
        <div className="q">{verses[0][0]}</div>
        <div className="ref">— {verses[0][1]}</div>
      </div>

      <div className="vs-card">
        <div className="vs-ch"><div className="vs-ct">등록된 말씀<small>총 {verses.length}개</small></div></div>
        {verses.map((v,i)=>{
          const [text,ref,active,date]=v;
          return (
            <div key={i} className="vs-li">
              <div className="vs-q">
                <div className="t">“{text}”</div>
                <div className="m">
                  <span className="vs-ref">{ref}</span>
                  <span className="vs-st" style={{background:active?C.st.success[0]:C.st.neutral[0],color:active?C.st.success[1]:C.st.neutral[1]}}>{active?'오늘 노출':'대기'}</span>
                  <span className="vs-date">{date}</span>
                </div>
              </div>
              <div className="vs-acts"><span className="vs-b">{I.edit}</span><span className="vs-b">{I.trash}</span></div>
            </div>
          );
        })}
      </div>
      </React.Fragment>)}
    </CShell>
  );
}

VerseScreen.cases = ['기본', '빈 상태'];
window.VerseScreen = VerseScreen;
