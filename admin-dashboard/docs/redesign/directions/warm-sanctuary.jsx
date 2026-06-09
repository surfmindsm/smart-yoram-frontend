// Direction B — "Warm Sanctuary"
// Pastoral, editorial warmth: warm paper, serif display headings, generous
// whitespace, a scripture banner up top, brand-blue used sparingly as accent,
// a warm clay secondary. Feels like a ministry space, not a generic SaaS.
// Exports window.WarmSanctuary

function WarmSanctuary() {
  const I = window.ICONS;
  const blue = '#1C7CFF';
  const clay = '#B0734A';
  return (
    <div className="ws-root">
      <style>{`
        .ws-root{width:1440px;height:1024px;background:#F4F0E8;color:#26221C;
          font-family:'Pretendard',system-ui,sans-serif;display:flex;overflow:hidden;
          -webkit-font-smoothing:antialiased;}
        .ws-root *{box-sizing:border-box;}
        .ws-serif{font-family:'Nanum Myeongjo','Pretendard',serif;}
        /* sidebar */
        .ws-side{width:252px;flex:0 0 252px;background:#FBF9F4;border-right:1px solid #E7E0D2;
          display:flex;flex-direction:column;height:100%;}
        .ws-brand{height:78px;display:flex;align-items:center;padding:0 26px;border-bottom:1px solid #ECE5D7;}
        .ws-brand img{height:21px;}
        .ws-nav{flex:1;overflow:hidden;padding:18px 14px;}
        .ws-grp{font-family:'Nanum Myeongjo',serif;font-size:12px;font-weight:800;color:#A9805A;
          letter-spacing:.02em;padding:16px 12px 8px;}
        .ws-grp:first-child{padding-top:2px;}
        .ws-item{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:10px;
          font-size:14px;font-weight:500;color:#5C5346;cursor:default;}
        .ws-item svg{width:17px;height:17px;flex:0 0 17px;color:#A89A82;}
        .ws-item.on{background:#26221C;color:#F4F0E8;font-weight:600;}
        .ws-item.on svg{color:#E8B88A;}
        .ws-pill{margin-left:auto;font-size:10px;font-weight:700;color:${clay};border:1px solid #E2C9AF;
          padding:1px 7px;border-radius:999px;}
        .ws-user{border-top:1px solid #ECE5D7;padding:16px 18px;display:flex;align-items:center;gap:12px;}
        .ws-av{width:36px;height:36px;border-radius:50%;background:#26221C;color:#E8B88A;
          display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;
          font-family:'Nanum Myeongjo',serif;}
        /* main */
        .ws-main{flex:1;display:flex;flex-direction:column;height:100%;overflow:hidden;}
        .ws-top{height:78px;flex:0 0 78px;display:flex;align-items:center;padding:0 36px;gap:20px;
          border-bottom:1px solid #E7E0D2;}
        .ws-search{flex:1;max-width:360px;height:42px;background:#FBF9F4;border:1px solid #E7E0D2;
          border-radius:999px;display:flex;align-items:center;gap:10px;padding:0 18px;color:#A89A82;font-size:13.5px;}
        .ws-search svg{width:16px;height:16px;}
        .ws-icbtn{width:42px;height:42px;border-radius:50%;border:1px solid #E7E0D2;background:#FBF9F4;
          display:flex;align-items:center;justify-content:center;color:#6E6456;}
        .ws-icbtn svg{width:18px;height:18px;}
        .ws-cta{height:42px;padding:0 20px;border-radius:999px;background:${blue};color:#fff;font-weight:600;
          font-size:13.5px;display:flex;align-items:center;gap:8px;}
        .ws-cta svg{width:16px;height:16px;}
        .ws-body{flex:1;overflow:hidden;padding:30px 36px;}
        .ws-verse{background:#26221C;border-radius:18px;padding:26px 30px;color:#F4F0E8;display:flex;
          align-items:center;justify-content:space-between;gap:24px;position:relative;overflow:hidden;}
        .ws-verse .q{font-family:'Nanum Myeongjo',serif;font-size:23px;line-height:1.5;font-weight:400;
          letter-spacing:-.01em;max-width:760px;}
        .ws-verse .r{font-size:13px;color:#C9A37C;margin-top:12px;font-weight:500;}
        .ws-eyebrow{font-family:'Nanum Myeongjo',serif;font-size:13px;color:${clay};font-weight:700;}
        .ws-h1{font-family:'Nanum Myeongjo',serif;font-size:30px;font-weight:800;letter-spacing:-.01em;margin-top:4px;}
        .ws-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:24px;}
        .ws-kpi{background:#FBF9F4;border:1px solid #E7E0D2;border-radius:16px;padding:20px 22px;}
        .ws-kpi .lab{font-size:13px;color:#7A6F5E;font-weight:500;}
        .ws-kpi .val{font-family:'Nanum Myeongjo',serif;font-size:34px;font-weight:800;margin-top:8px;line-height:1;letter-spacing:-.02em;}
        .ws-kpi .val small{font-size:15px;font-weight:600;color:#A89A82;margin-left:3px;font-family:'Pretendard';}
        .ws-kpi .delta{font-size:12px;font-weight:600;margin-top:10px;color:#3F7A4E;display:flex;align-items:center;gap:5px;}
        .ws-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:18px;margin-top:18px;}
        .ws-card{background:#FBF9F4;border:1px solid #E7E0D2;border-radius:16px;padding:24px;}
        .ws-ct{font-family:'Nanum Myeongjo',serif;font-size:17px;font-weight:800;letter-spacing:-.01em;}
        .ws-ctsub{font-size:12px;color:#A89A82;font-weight:500;margin-top:2px;}
        .ws-row{display:flex;align-items:center;justify-content:space-between;}
        .ws-mi{display:flex;align-items:center;gap:13px;padding:13px 0;border-bottom:1px solid #EEE8DB;}
        .ws-mi:last-child{border-bottom:none;}
        .ws-mav{width:38px;height:38px;border-radius:50%;background:#EFE7D8;color:${clay};display:flex;
          align-items:center;justify-content:center;font-weight:700;font-size:14px;flex:0 0 38px;
          font-family:'Nanum Myeongjo',serif;}
        .ws-tag{font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;margin-left:auto;}
        .ws-legend{display:flex;gap:16px;font-size:12px;color:#7A6F5E;}
        .ws-dot{width:9px;height:9px;border-radius:3px;display:inline-block;margin-right:6px;}
      `}</style>

      {/* SIDEBAR */}
      <aside className="ws-side">
        <div className="ws-brand"><img src="admin-dashboard/public/logo_type4_white.png" alt="Church Round" /></div>
        <nav className="ws-nav">
          <div className="ws-grp">사역 홈</div>
          {nav(I.home,'대시보드',true)}
          <div className="ws-grp">양 떼 돌봄</div>
          {nav(I.users,'교인 관리',false)}
          {nav(I.care,'심방 신청',false)}
          {nav(I.heart,'중보 기도',false)}
          {nav(I.org,'조직 · 목장',false)}
          <div className="ws-grp">예배와 살림</div>
          {nav(I.won,'헌금 살림',false)}
          {nav(I.book,'오늘의 말씀',false)}
          {nav(I.file,'주보 · 공지',false)}
          <div className="ws-grp">돕는 손길</div>
          {nav(I.msg,'문자 · 알림',false)}
          {nav(I.spark,'AI 도구',false,'Premium')}
        </nav>
        <div className="ws-user">
          <div className="ws-av">김</div>
          <div>
            <div style={{fontSize:'13.5px',fontWeight:600}}>김은혜 목사</div>
            <div style={{fontSize:'11.5px',color:'#A89A82'}}>은혜로교회 · 담임</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="ws-main">
        <div className="ws-top">
          <div className="ws-search">{I.search}<span>교인, 헌금, 공지 찾기…</span></div>
          <div style={{flex:1}}></div>
          <div className="ws-icbtn">{I.bell}</div>
          <div className="ws-cta">{I.plus}새가족 맞이</div>
        </div>

        <div className="ws-body">
          <div className="ws-verse">
            <div>
              <div className="q ws-serif">“수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라”</div>
              <div className="r">마태복음 11:28 · 오늘의 말씀</div>
            </div>
            <div style={{textAlign:'center',flex:'0 0 auto'}}>
              <div className="ws-serif" style={{fontSize:'13px',color:'#C9A37C'}}>2026 · 6 · 3</div>
              <div className="ws-serif" style={{fontSize:'40px',fontWeight:800,color:'#F4F0E8',lineHeight:1.1}}>水</div>
              <div style={{fontSize:'11px',color:'#94886F'}}>수요예배</div>
            </div>
          </div>

          <div style={{marginTop:'26px'}}>
            <div className="ws-eyebrow ws-serif">오늘의 교회</div>
            <div className="ws-h1 ws-serif">은혜로교회 한눈에 보기</div>
          </div>

          <div className="ws-kpis">
            {kpi('함께하는 식구','842','명','한 영혼도 귀하게')}
            {kpi('이번 주 예배','612','명','출석률 73%')}
            {kpi('새로 온 가족','7','명','따뜻이 맞이해요')}
            {kpi('이번 주 감사헌금','1,248','만원','+4.2%')}
          </div>

          <div className="ws-grid">
            <div className="ws-card">
              <div className="ws-row" style={{marginBottom:'20px'}}>
                <div><div className="ws-ct">함께 자라는 공동체</div><div className="ws-ctsub">최근 12개월 교인 추이</div></div>
                <div className="ws-legend">
                  <span><span className="ws-dot" style={{background:clay}}></span>총 교인</span>
                  <span><span className="ws-dot" style={{background:'#E3CDB3'}}></span>신규</span>
                </div>
              </div>
              {growthChart(clay)}
            </div>

            <div className="ws-card">
              <div className="ws-ct" style={{marginBottom:'4px'}}>이번 주 목양 노트</div>
              <div className="ws-ctsub" style={{marginBottom:'14px'}}>마음 써야 할 분들</div>
              {member('박','박지훈','새가족 · 첫 등록','새가족','#EFE7D8',clay)}
              {member('이','이순영 권사','심방 요청 · 건강','심방','#E7EFE9','#3F7A4E')}
              {member('최','최민준','생일 · 6월 5일','생일','#F0E6EF','#8A5A86')}
              {member('정','정해성 집사','3주째 결석','관심','#F3E6E2','#B0734A')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function nav(icon,label,on,pill){
    return <div className={'ws-item'+(on?' on':'')}>{icon}<span>{label}</span>{pill&&<span className="ws-pill">{pill}</span>}</div>;
  }
  function kpi(lab,val,unit,note){
    return <div className="ws-kpi">
      <div className="lab">{lab}</div>
      <div className="val ws-serif">{val}<small>{unit}</small></div>
      <div className="delta">{I.leaf}{note}</div>
    </div>;
  }
  function member(ini,name,desc,tag,bg,fg){
    return <div className="ws-mi">
      <div className="ws-mav">{ini}</div>
      <div><div style={{fontSize:'14px',fontWeight:600}}>{name}</div><div style={{fontSize:'12px',color:'#A89A82'}}>{desc}</div></div>
      <span className="ws-tag" style={{background:bg,color:fg}}>{tag}</span>
    </div>;
  }
  function growthChart(c){
    const line=[40,46,44,55,52,62,60,70,68,76,74,84];
    const W=560,H=210,pad=10;const bw=(W-pad*2)/line.length;
    const pts=line.map((v,i)=>`${pad+bw*i+bw/2},${H-(v/100*H)}`).join(' ');
    const area=`${pad+bw/2},${H} `+pts+` ${pad+bw*(line.length-1)+bw/2},${H}`;
    return <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'210px'}}>
      {[0,1,2,3].map(i=><line key={i} x1="0" x2={W} y1={H/4*i} y2={H/4*i} stroke="#EEE8DB" strokeWidth="1"/>)}
      <polygon points={area} fill={c} opacity="0.10"/>
      <polyline points={pts} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {line.map((v,i)=><circle key={i} cx={pad+bw*i+bw/2} cy={H-(v/100*H)} r="3.5" fill="#FBF9F4" stroke={c} strokeWidth="2"/>)}
    </svg>;
  }
}

window.WarmSanctuary = WarmSanctuary;
