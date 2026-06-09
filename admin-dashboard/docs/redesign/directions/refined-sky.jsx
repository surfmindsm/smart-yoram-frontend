// Direction A — "Refined Sky"
// Evolution of the current sky-blue SaaS: disciplined single accent,
// unified slate neutrals, calmer cards, cleaner KPI hierarchy.
// Exports window.RefinedSky

function RefinedSky() {
  const I = window.ICONS;
  const blue = '#1C7CFF';
  return (
    <div className="rs-root">
      <style>{`
        .rs-root{width:1440px;height:1024px;background:#F6F8FB;color:#0F172A;
          font-family:'Pretendard',system-ui,sans-serif;display:flex;overflow:hidden;
          -webkit-font-smoothing:antialiased;}
        .rs-root *{box-sizing:border-box;}
        /* sidebar */
        .rs-side{width:248px;flex:0 0 248px;background:#fff;border-right:1px solid #E7ECF3;
          display:flex;flex-direction:column;height:100%;}
        .rs-brand{height:64px;display:flex;align-items:center;gap:10px;padding:0 22px;
          border-bottom:1px solid #F0F3F8;}
        .rs-brand img{height:22px;}
        .rs-nav{flex:1;overflow:hidden;padding:14px 12px;}
        .rs-grp{font-size:11px;font-weight:700;letter-spacing:.08em;color:#94A3B8;
          text-transform:uppercase;padding:14px 12px 6px;}
        .rs-grp:first-child{padding-top:2px;}
        .rs-item{display:flex;align-items:center;gap:11px;padding:8px 12px;border-radius:9px;
          font-size:13.5px;font-weight:500;color:#475569;cursor:default;}
        .rs-item svg{width:17px;height:17px;flex:0 0 17px;color:#94A3B8;}
        .rs-item.on{background:${blue};color:#fff;font-weight:600;box-shadow:0 6px 16px -6px ${blue}99;}
        .rs-item.on svg{color:#fff;}
        .rs-badge{margin-left:auto;font-size:10.5px;font-weight:700;background:#EFF5FF;color:${blue};
          padding:1px 7px;border-radius:999px;}
        .rs-user{border-top:1px solid #F0F3F8;padding:14px 16px;display:flex;align-items:center;gap:11px;}
        .rs-av{width:34px;height:34px;border-radius:50%;background:#E7EEFB;color:${blue};
          display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;}
        /* main */
        .rs-main{flex:1;display:flex;flex-direction:column;height:100%;overflow:hidden;}
        .rs-top{height:64px;flex:0 0 64px;background:#fff;border-bottom:1px solid #E7ECF3;
          display:flex;align-items:center;padding:0 28px;gap:18px;}
        .rs-search{flex:1;max-width:380px;height:38px;background:#F2F5FA;border-radius:10px;
          display:flex;align-items:center;gap:9px;padding:0 14px;color:#94A3B8;font-size:13px;}
        .rs-search svg{width:16px;height:16px;}
        .rs-topbtn{width:38px;height:38px;border-radius:10px;background:#F2F5FA;display:flex;
          align-items:center;justify-content:center;color:#64748B;}
        .rs-topbtn svg{width:18px;height:18px;}
        .rs-cta{height:38px;padding:0 16px;border-radius:10px;background:${blue};color:#fff;
          font-weight:600;font-size:13px;display:flex;align-items:center;gap:7px;}
        .rs-cta svg{width:16px;height:16px;}
        .rs-body{flex:1;overflow:hidden;padding:26px 28px;}
        .rs-h1{font-size:23px;font-weight:700;letter-spacing:-.01em;}
        .rs-sub{font-size:13.5px;color:#64748B;margin-top:3px;}
        .rs-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:22px;}
        .rs-kpi{background:#fff;border:1px solid #E7ECF3;border-radius:14px;padding:18px 20px;}
        .rs-kpi .lab{font-size:12.5px;color:#64748B;font-weight:500;display:flex;align-items:center;gap:7px;}
        .rs-kpi .lab svg{width:15px;height:15px;color:${blue};}
        .rs-kpi .val{font-size:30px;font-weight:750;letter-spacing:-.02em;margin-top:10px;line-height:1;}
        .rs-kpi .val small{font-size:14px;font-weight:600;color:#94A3B8;margin-left:3px;}
        .rs-kpi .delta{font-size:12px;font-weight:600;margin-top:9px;display:flex;align-items:center;gap:4px;}
        .rs-up{color:#16A34A;} .rs-dn{color:#DC2626;} .rs-flat{color:#94A3B8;}
        .rs-grid{display:grid;grid-template-columns:1.6fr 1fr;gap:16px;margin-top:16px;}
        .rs-card{background:#fff;border:1px solid #E7ECF3;border-radius:14px;padding:20px;}
        .rs-ct{font-size:15px;font-weight:700;letter-spacing:-.01em;}
        .rs-ctsub{font-size:12px;color:#94A3B8;font-weight:500;}
        .rs-row{display:flex;align-items:center;justify-content:space-between;}
        .rs-legend{display:flex;gap:14px;font-size:12px;color:#64748B;}
        .rs-dot{width:9px;height:9px;border-radius:3px;display:inline-block;margin-right:6px;}
        .rs-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:4px;}
        .rs-act{display:flex;align-items:center;gap:11px;padding:12px;border:1px solid #EDF1F7;
          border-radius:11px;}
        .rs-act .ic{width:34px;height:34px;border-radius:9px;background:#EFF5FF;color:${blue};
          display:flex;align-items:center;justify-content:center;flex:0 0 34px;}
        .rs-act .ic svg{width:17px;height:17px;}
        .rs-act .t{font-size:13px;font-weight:600;}
        .rs-act .d{font-size:11px;color:#94A3B8;margin-top:1px;}
        .rs-feed{display:flex;flex-direction:column;}
        .rs-fi{display:flex;gap:11px;padding:11px 0;border-bottom:1px solid #F3F6FA;}
        .rs-fi:last-child{border-bottom:none;}
        .rs-fi .fd{width:8px;height:8px;border-radius:50%;background:${blue};margin-top:5px;flex:0 0 8px;}
        .rs-fi .ft{font-size:13px;font-weight:500;}
        .rs-fi .fm{font-size:11.5px;color:#94A3B8;margin-top:1px;}
      `}</style>

      {/* SIDEBAR */}
      <aside className="rs-side">
        <div className="rs-brand"><img src="admin-dashboard/public/logo_type4_white.png" alt="Church Round" /></div>
        <nav className="rs-nav">
          <div className="rs-grp">홈</div>
          {nav(I.home, '대시보드', true, blue)}
          <div className="rs-grp">교인</div>
          {nav(I.users, '교인 관리', false)}
          {nav(I.org, '조직 관리', false)}
          {nav(I.care, '심방 신청', false)}
          {nav(I.heart, '중보 기도', false)}
          <div className="rs-grp">재정 · 예배</div>
          {nav(I.won, '헌금 관리', false)}
          {nav(I.book, '오늘의 말씀', false)}
          {nav(I.file, '주보 · 공지', false)}
          <div className="rs-grp">운영</div>
          {nav(I.msg, 'SMS · 알림', false)}
          {nav(I.spark, 'AI 도구', false, blue, 'Premium')}
        </nav>
        <div className="rs-user">
          <div className="rs-av">김</div>
          <div>
            <div style={{fontSize:'13px',fontWeight:600}}>김은혜 목사</div>
            <div style={{fontSize:'11px',color:'#94A3B8'}}>은혜로교회</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="rs-main">
        <div className="rs-top">
          <div className="rs-search">{I.search}<span>교인, 헌금, 공지 검색…</span></div>
          <div style={{flex:1}}></div>
          <div className="rs-topbtn">{I.bell}</div>
          <div className="rs-cta">{I.plus}교인 등록</div>
        </div>

        <div className="rs-body">
          <div className="rs-row">
            <div>
              <div className="rs-h1">대시보드</div>
              <div className="rs-sub">2026년 6월 3일 수요일 · 은혜로교회 현황 요약</div>
            </div>
          </div>

          <div className="rs-kpis">
            {kpi(I.users, '전체 교인', '842', '명', '+7 이번 주', 'up', blue)}
            {kpi(I.check, '이번 주 출석', '612', '명', '73% 출석률', 'up', blue)}
            {kpi(I.userplus, '새가족', '7', '명', '+2 지난주 대비', 'up', blue)}
            {kpi(I.won, '이번 주 헌금', '1,248', '만원', '+4.2%', 'up', blue)}
          </div>

          <div className="rs-grid">
            <div className="rs-card">
              <div className="rs-row" style={{marginBottom:'18px'}}>
                <div><div className="rs-ct">교인 증가 추이</div><div className="rs-ctsub">최근 12개월</div></div>
                <div className="rs-legend">
                  <span><span className="rs-dot" style={{background:blue}}></span>총 교인</span>
                  <span><span className="rs-dot" style={{background:'#BFDBFE'}}></span>신규</span>
                </div>
              </div>
              {growthChart(blue)}
            </div>

            <div className="rs-card">
              <div className="rs-ct" style={{marginBottom:'16px'}}>빠른 작업</div>
              <div className="rs-actions">
                {act(I.userplus,'교인 등록','새가족 추가', blue)}
                {act(I.msg,'SMS 발송','단체 메시지', blue)}
                {act(I.qr,'QR 코드','출석 체크', blue)}
                {act(I.excel,'엑셀 관리','명단 업로드', blue)}
              </div>
              <div className="rs-ct" style={{margin:'20px 0 10px'}}>최근 활동</div>
              <div className="rs-feed">
                {feed('박지훈님이 새가족으로 등록되었습니다','12분 전')}
                {feed('주일 2부 예배 출석 612명 집계 완료','1시간 전')}
                {feed('6월 첫째 주 주보가 발행되었습니다','3시간 전')}
              </div>
            </div>
          </div>

          <div className="rs-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
            <div className="rs-card">
              <div className="rs-ct" style={{marginBottom:'4px'}}>성별 분포</div>
              <div className="rs-ctsub" style={{marginBottom:'8px'}}>전체 842명</div>
              {genderChart(blue)}
            </div>
            <div className="rs-card">
              <div className="rs-ct" style={{marginBottom:'16px'}}>연령 분포</div>
              {ageChart(blue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // helpers
  function nav(icon, label, on, accent, badge){
    return <div className={'rs-item'+(on?' on':'')}>{icon}<span>{label}</span>{badge&&<span className="rs-badge">{badge}</span>}</div>;
  }
  function kpi(icon, lab, val, unit, delta, dir, accent){
    return <div className="rs-kpi">
      <div className="lab">{icon}{lab}</div>
      <div className="val">{val}<small>{unit}</small></div>
      <div className={'delta '+(dir==='up'?'rs-up':dir==='dn'?'rs-dn':'rs-flat')}>{dir==='up'?I.tup:I.tflat}{delta}</div>
    </div>;
  }
  function act(icon,t,d,accent){
    return <div className="rs-act"><div className="ic">{icon}</div><div><div className="t">{t}</div><div className="d">{d}</div></div></div>;
  }
  function feed(t,m){
    return <div className="rs-fi"><div className="fd"></div><div><div className="ft">{t}</div><div className="fm">{m}</div></div></div>;
  }
  function growthChart(c){
    const bars=[28,34,30,42,38,50,46,58,55,64,60,72];
    const max=80;const W=560,H=200,pad=8;const bw=(W-pad*2)/bars.length;
    const line=[40,46,44,55,52,62,60,70,68,76,74,84];
    const pts=line.map((v,i)=>`${pad+bw*i+bw/2},${H-(v/100*H)}`).join(' ');
    return <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'200px'}}>
      {[0,1,2,3].map(i=><line key={i} x1="0" x2={W} y1={H/4*i} y2={H/4*i} stroke="#F1F5F9" strokeWidth="1"/>)}
      {bars.map((v,i)=><rect key={i} x={pad+bw*i+6} y={H-(v/max*H)} width={bw-12} height={v/max*H} rx="4" fill="#DCEAFE"/>)}
      <polyline points={pts} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {line.map((v,i)=><circle key={i} cx={pad+bw*i+bw/2} cy={H-(v/100*H)} r="3" fill="#fff" stroke={c} strokeWidth="2"/>)}
    </svg>;
  }
  function genderChart(c){
    const r=46,cx=70,cy=70,circ=2*Math.PI*r;const male=0.54;
    return <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
      <svg viewBox="0 0 140 140" style={{width:'140px',height:'140px'}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth="16"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth="16"
          strokeDasharray={`${circ*male} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="butt"/>
        <text x={cx} y={cy-2} textAnchor="middle" fontSize="22" fontWeight="750" fill="#0F172A">842</text>
        <text x={cx} y={cy+15} textAnchor="middle" fontSize="10" fill="#94A3B8">전체</text>
      </svg>
      <div style={{flex:1}}>
        {gline('남성','455명','54%',c)}
        {gline('여성','387명','46%','#CBD5E1')}
      </div>
    </div>;
  }
  function gline(l,n,p,c){
    return <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid #F3F6FA'}}>
      <span style={{fontSize:'13px',fontWeight:500,color:'#475569'}}><span className="rs-dot" style={{background:c}}></span>{l}</span>
      <span style={{fontSize:'13px'}}><b style={{fontWeight:700}}>{n}</b> <span style={{color:'#94A3B8',fontSize:'12px'}}>{p}</span></span>
    </div>;
  }
  function ageChart(c){
    const data=[['10대',8],['20대',14],['30대',19],['40대',24],['50대',18],['60+',17]];
    const max=28;
    return <div style={{display:'flex',flexDirection:'column',gap:'11px'}}>
      {data.map(([lab,v],i)=>
        <div key={i} style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{width:'34px',fontSize:'12px',color:'#64748B',fontWeight:500}}>{lab}</span>
          <div style={{flex:1,height:'10px',background:'#F1F5F9',borderRadius:'5px',overflow:'hidden'}}>
            <div style={{width:(v/max*100)+'%',height:'100%',background:c,opacity:.35+i*0.1,borderRadius:'5px'}}></div>
          </div>
          <span style={{width:'34px',fontSize:'12px',fontWeight:600,textAlign:'right'}}>{v}%</span>
        </div>
      )}
    </div>;
  }
}

window.RefinedSky = RefinedSky;
