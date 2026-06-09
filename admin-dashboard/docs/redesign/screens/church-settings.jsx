// Church Round · Direction C — 교회 설정 (탭형)
// Canonical = ChurchSettings. Tabs from code: 교회 정보(profile) / AI 연동(gpt) /
// 데이터베이스. Profile fields: 교회명·담임목사·주소·연락처·이메일·소개.
// Exports window.ChurchSettingsScreen

function ChurchSettingsScreen({ caseId }) {
  const I = window.ICONS, C = window.C;
  const cur = caseId || '교회 정보';

  return (
    <CShell
      active="settings"
      title="설정"
      subtitle="교회 정보와 연동을 관리합니다"
      headerRight={<button className="cs-cta">{I.check2}변경사항 저장</button>}
    >
      <style>{`
        .st-tabs{display:flex;gap:4px;border-bottom:1px solid #E3E8F0;margin-bottom:22px;}
        .st-tab{padding:11px 16px;font-size:13.5px;font-weight:600;color:#64748B;border-bottom:2px solid transparent;
          display:inline-flex;align-items:center;gap:7px;white-space:nowrap;cursor:pointer;margin-bottom:-1px;}
        .st-tab svg{width:15px;height:15px;}
        .st-tab.on{color:var(--cr-primary);border-bottom-color:var(--cr-primary);}
        .st-wrap{max-width:860px;}
        .st-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);margin-bottom:16px;}
        .st-ch{padding:16px 20px;border-bottom:1px solid #EEF1F6;}
        .st-ct{font-size:14px;font-weight:700;}
        .st-cs{font-size:12px;color:#94A3B8;margin-top:2px;}
        .st-cp{padding:20px;}
        .st-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .st-f.full{grid-column:1 / -1;}
        .st-f .k{font-size:12px;font-weight:600;color:#475569;margin-bottom:6px;display:block;}
        .st-in{height:40px;border:1px solid #E3E8F0;border-radius:8px;display:flex;align-items:center;
          padding:0 13px;font-size:13.5px;color:#0E1729;background:#fff;}
        .st-ta{min-height:84px;border:1px solid #E3E8F0;border-radius:8px;padding:11px 13px;font-size:13.5px;
          color:#334155;line-height:1.6;background:#fff;}
        .st-logo{display:flex;align-items:center;gap:16px;}
        .st-lo{width:64px;height:64px;border-radius:14px;background:#0E1729;color:#fff;display:flex;
          align-items:center;justify-content:center;flex:0 0 64px;}
        .st-lo .c{font-family:'Newsreader',serif;font-style:italic;color:var(--cr-primary);font-size:24px;}
        .st-up{font-size:12.5px;font-weight:600;color:var(--cr-primary);}
        .st-hint{font-size:11.5px;color:#94A3B8;margin-top:3px;}
        .st-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #F1F4F9;}
        .st-row:last-child{border-bottom:none;}
        .st-rl{font-size:13px;font-weight:600;color:#1F2937;}
        .st-rd{font-size:11.5px;color:#94A3B8;margin-top:2px;}
        .st-sw{width:38px;height:22px;border-radius:999px;background:var(--cr-primary);position:relative;flex:0 0 38px;}
        .st-sw.off{background:#CBD5E1;}
        .st-sw::after{content:'';position:absolute;top:3px;right:3px;width:16px;height:16px;border-radius:50%;background:#fff;}
        .st-sw.off::after{left:3px;right:auto;}
      `}</style>

      <div className="st-tabs">
        <span className={'st-tab'+(cur==='교회 정보'?' on':'')}>{I.church||I.home}교회 정보</span>
        <span className={'st-tab'+(cur==='AI 연동'?' on':'')}>{I.spark}AI 연동</span>
        <span className={'st-tab'+(cur==='데이터베이스'?' on':'')}>{I.settings}데이터베이스</span>
      </div>

      <div className="st-wrap">
        {cur==='AI 연동' ? aiPanel() : cur==='데이터베이스' ? dbPanel() : (<React.Fragment>
        <div className="st-card">
          <div className="st-ch"><div className="st-ct">기본 정보</div><div className="st-cs">교인 앱과 주보에 표시되는 교회 정보입니다.</div></div>
          <div className="st-cp">
            <div className="st-logo" style={{marginBottom:'20px'}}>
              <div className="st-lo"><span className="c">c</span></div>
              <div><div className="st-up">＋ 교회 로고 변경</div><div className="st-hint">PNG · 정사각형 · 최대 2MB 권장</div></div>
            </div>
            <div className="st-grid">
              {fld('교회명','은혜로교회')}
              {fld('담임목사','김은혜 목사')}
              {fld('대표 연락처','02-336-7782')}
              {fld('이메일','office@grace.church')}
              <div className="st-f full"><label className="k">교회 주소</label><div className="st-in">서울특별시 마포구 양화로 45, 3층</div></div>
              <div className="st-f full"><label className="k">교회 소개</label><div className="st-ta">1998년 설립된 은혜로교회는 "한 영혼을 천하보다 귀히 여기는" 공동체를 지향합니다. 매주 주일 1·2부 예배와 수요·금요 예배를 드립니다.</div></div>
            </div>
          </div>
        </div>

        <div className="st-card">
          <div className="st-ch"><div className="st-ct">앱 표시 설정</div><div className="st-cs">교인용 모바일 앱에 노출할 항목을 선택합니다.</div></div>
          <div className="st-cp" style={{paddingTop:6,paddingBottom:6}}>
            {row('오늘의 말씀 표시','홈 화면 상단에 매일 말씀을 노출합니다.',true)}
            {row('예배 시간 안내','예배 시간표를 앱에 공개합니다.',true)}
            {row('헌금 내역 열람','교인이 본인 헌금 내역을 조회할 수 있습니다.',false)}
            {row('푸시 알림 허용','교인 앱으로 공지·알림을 발송합니다.',true)}
          </div>
        </div>
        </React.Fragment>)}
      </div>
    </CShell>
  );

  function fld(k,v){ return <div className="st-f"><label className="k">{k}</label><div className="st-in">{v}</div></div>; }
  function row(l,d,on){
    return <div className="st-row"><div><div className="st-rl">{l}</div><div className="st-rd">{d}</div></div><CToggle cls="st-sw" on={on} /></div>;
  }
  function aiPanel(){ return (
    <div className="st-card">
      <div className="st-ch"><div className="st-ct">AI 연동 (GPT)</div><div className="st-cs">AI 교역자·도구에 사용할 API 연동 설정입니다.</div></div>
      <div className="st-cp">
        <div className="st-f full"><label className="k">API 키</label><div className="st-in" style={{fontFamily:'ui-monospace,monospace',color:'#94A3B8'}}>sk-••••••••••••••••••••••••</div></div>
        <div className="st-grid" style={{marginTop:'14px'}}>
          <div className="st-f"><label className="k">모델</label><div className="st-in">gpt-4o-mini</div></div>
          <div className="st-f"><label className="k">최대 토큰</label><div className="st-in">2,048</div></div>
        </div>
        <div className="st-row" style={{marginTop:'8px',borderTop:'1px solid #F1F4F9'}}><div><div className="st-rl">API 활성화</div><div className="st-rd">AI 기능을 켜고 딠니다.</div></div><span className="st-sw"></span></div>
      </div>
    </div>
  ); }
  function dbPanel(){ return (
    <div className="st-card">
      <div className="st-ch"><div className="st-ct">데이터베이스 연결</div><div className="st-cs">외부 데이터베이스 연동 설정입니다.</div></div>
      <div className="st-cp">
        <div className="st-grid">
          <div className="st-f"><label className="k">연결 이름</label><div className="st-in">기본 연결</div></div>
          <div className="st-f"><label className="k">유형</label><div className="st-in">PostgreSQL</div></div>
          <div className="st-f"><label className="k">호스트</label><div className="st-in">db.grace.church</div></div>
          <div className="st-f"><label className="k">포트</label><div className="st-in">5432</div></div>
        </div>
        <button className="cs-cta ghost" style={{marginTop:'16px'}}>연결 테스트</button>
      </div>
    </div>
  ); }
}

ChurchSettingsScreen.cases = ['교회 정보', 'AI 연동', '데이터베이스'];
window.ChurchSettingsScreen = ChurchSettingsScreen;
