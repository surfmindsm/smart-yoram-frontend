// Church Round · Direction C — 대시보드 (홈)
// Canonical = Dashboard.tsx. KPI strip + quick actions(linked) + 오늘 할 일 +
// 출석/교인 추이 + 최근 등록 교인 + 다가오는 일정.
// Exports window.DashboardScreen

function DashboardScreen({ caseId }) {
  const I = window.ICONS, C = window.C;
  const blue = C.blue;
  const R = window.CR_ROUTES || {};

  return (
    <CShell
      active="dashboard"
      title="대시보드"
      subtitle="2026년 6월 3일 수요일 · 은혜로교회 현황"
      segment={[{label:'오늘'},{label:'이번 주',on:true},{label:'이번 달'}]}
      headerRight={<a className="cs-cta" href={R.members} style={{textDecoration:'none'}}>{I.userplus}교인 등록</a>}
    >
      <style>{`
        .db-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
        .db-kpi{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);padding:16px 18px;}
        .db-kpi .l{font-size:12px;color:#64748B;font-weight:600;display:flex;align-items:center;gap:7px;}
        .db-kpi .l svg{width:14px;height:14px;color:var(--cr-primary);}
        .db-kpi .v{font-size:26px;font-weight:750;letter-spacing:-.02em;margin-top:9px;line-height:1;white-space:nowrap;}
        .db-kpi .v small{font-size:13px;font-weight:600;color:#94A3B8;}
        .db-kpi .d{font-size:11.5px;font-weight:600;margin-top:8px;color:#16A34A;display:flex;align-items:center;gap:4px;}
        .db-qa{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}
        .db-q{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);padding:16px;display:flex;
          align-items:center;gap:12px;text-decoration:none;color:inherit;}
        .db-q:hover{border-color:#BBD4FB;}
        .db-q .ic{width:38px;height:38px;border-radius:10px;background:#EEF3FC;color:var(--cr-primary);display:flex;
          align-items:center;justify-content:center;flex:0 0 38px;}
        .db-q .ic svg{width:18px;height:18px;}
        .db-q .t{font-size:13.5px;font-weight:700;}
        .db-q .s{font-size:11.5px;color:#94A3B8;margin-top:1px;}
        .db-grid{display:grid;grid-template-columns:1.55fr 1fr;gap:14px;margin-bottom:14px;}
        .db-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);}
        .db-ch{padding:14px 18px;border-bottom:1px solid #EEF1F6;display:flex;align-items:center;justify-content:space-between;}
        .db-ct{font-size:14px;font-weight:700;letter-spacing:-.01em;}
        .db-link{font-size:12px;color:var(--cr-primary);font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:3px;}
        .db-link svg{width:13px;height:13px;}
        .db-cp{padding:18px;}
        .db-task{display:flex;align-items:center;gap:11px;padding:11px 18px;border-bottom:1px solid #F1F4F9;}
        .db-task:last-child{border-bottom:none;}
        .db-cb{width:17px;height:17px;border-radius:5px;border:2px solid #CBD5E1;flex:0 0 17px;}
        .db-cb.done{background:var(--cr-primary);border-color:var(--cr-primary);display:flex;align-items:center;justify-content:center;}
        .db-cb.done svg{width:11px;height:11px;color:#fff;}
        .db-tt{font-size:13px;font-weight:500;}
        .db-tt.done{color:#94A3B8;text-decoration:line-through;}
        .db-tm{font-size:11px;color:#94A3B8;}
        .db-chip{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:6px;margin-left:auto;white-space:nowrap;}
        .db-table{width:100%;border-collapse:collapse;font-size:12.5px;}
        .db-table td{padding:11px 18px;border-bottom:1px solid #F1F4F9;color:#334155;}
        .db-table tr:last-child td{border-bottom:none;}
        .db-mav{width:26px;height:26px;border-radius:7px;background:#EEF3FC;color:var(--cr-primary);display:inline-flex;
          align-items:center;justify-content:center;font-weight:700;font-size:11px;margin-right:9px;vertical-align:middle;}
        .db-sched{display:flex;align-items:center;gap:13px;padding:12px 18px;border-bottom:1px solid #F1F4F9;}
        .db-sched:last-child{border-bottom:none;}
        .db-date{text-align:center;width:36px;flex:0 0 36px;}
        .db-date .dd{font-size:17px;font-weight:750;line-height:1;}
        .db-date .wd{font-size:10px;color:#94A3B8;font-weight:600;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={6} /> :
      (<React.Fragment>
      <div className="db-strip">
        {kpi(I.users,'전체 교인','842','명','+7 이번 주')}
        {kpi(I.check,'주일 출석','612','명','73% 출석률')}
        {kpi(I.userplus,'이번 주 새가족','7','명','+2')}
        {kpi(I.won,'주간 헌금','1,248','만원','+4.2%')}
      </div>

      <div className="db-qa">
        {qa(I.userplus,'교인 등록','새가족 추가',R.members)}
        {qa(I.won,'헌금 입력','이번 주 헌금',R.donations)}
        {qa(I.msg,'문자 발송','단체 메시지',R.sms)}
        {qa(I.bell,'공지 작성','교인 소식',R.bulletin)}
      </div>

      <div className="db-grid">
        <div className="db-card">
          <div className="db-ch"><div className="db-ct">출석 · 교인 추이</div><a className="db-link" href={R.analytics}>통계 분석{I.arrow}</a></div>
          <div className="db-cp">{chart(blue)}</div>
        </div>
        <div className="db-card">
          <div className="db-ch"><div className="db-ct">오늘 할 일</div><span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>6월 3일</span></div>
          {task(true,'수요예배 주보 발행','마감 17:00','완료',C.st.success)}
          {task(false,'새가족 박지훈 환영 문자','오늘','발송',C.st.info)}
          {task(false,'이순영 권사 심방 일정 확정','긴급',' 긴급',C.st.danger)}
          {task(false,'6월 첫째 주 헌금 결산','오후','검토',C.st.warning)}
        </div>
      </div>

      <div className="db-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div className="db-card">
          <div className="db-ch"><div className="db-ct">최근 등록 교인</div><a className="db-link" href={R.members}>전체 보기{I.arrow}</a></div>
          <table className="db-table">
            <tbody>
              {row('박','박지훈','1구역 · 하늘목장','6월 2일')}
              {row('윤','윤서연','3구역 · 믿음목장','5월 29일')}
              {row('강','강도현','2구역 · 사랑목장','5월 25일')}
              {row('한','한지우','5구역 · 은혜목장','5월 21일')}
            </tbody>
          </table>
        </div>
        <div className="db-card">
          <div className="db-ch"><div className="db-ct">다가오는 일정</div><a className="db-link" href={R.worship}>예배 시간표{I.arrow}</a></div>
          {sched('03','수','수요 저녁예배','19:30 · 본당',blue)}
          {sched('05','금','금요 성령집회','20:00 · 본당','#B45309')}
          {sched('07','일','주일 1·2부 예배','09:00 / 11:00','#16A34A')}
          {sched('08','월','제직회','20:00 · 교육관','#8A5A86')}
        </div>
      </div>
      </React.Fragment>)}
    </CShell>
  );

  function kpi(icon,l,v,u,d){
    return <div className="db-kpi"><div className="l">{icon}{l}</div><div className="v">{v}<small> {u}</small></div><div className="d">{I.tup}{d}</div></div>;
  }
  function qa(icon,t,s,href){
    return <a className="db-q" href={href||undefined}><div className="ic">{icon}</div><div><div className="t">{t}</div><div className="s">{s}</div></div></a>;
  }
  function task(done,t,m,chip,col){
    return <div className="db-task"><div className={'db-cb'+(done?' done':'')}>{done&&I.check2}</div>
      <div><div className={'db-tt'+(done?' done':'')}>{t}</div><div className="db-tm">{m}</div></div>
      <span className="db-chip" style={{background:col[0],color:col[1]}}>{chip}</span></div>;
  }
  function row(ini,name,zone,date){
    return <tr><td><span className="db-mav">{ini}</span><b style={{fontWeight:600,color:'#0E1729'}}>{name}</b></td><td style={{color:'#64748B'}}>{zone}</td><td style={{color:'#94A3B8',textAlign:'right'}}>{date}</td></tr>;
  }
  function sched(d,wd,t,m,c){
    return <div className="db-sched"><div className="db-date"><div className="dd" style={{color:c}}>{d}</div><div className="wd">{wd}</div></div>
      <div style={{width:'1px',height:'26px',background:'#EEF1F6'}}></div>
      <div><div style={{fontSize:'13px',fontWeight:600}}>{t}</div><div style={{fontSize:'11.5px',color:'#94A3B8'}}>{m}</div></div></div>;
  }
  function chart(c){
    const att=[58,62,55,68,64,71,67,73,70,74,72,76];
    const tot=[40,44,43,52,50,58,57,64,63,68,67,72];
    const W=600,H=210,pad=12;const bw=(W-pad*2)/att.length;const max=90;
    const lp=(arr)=>arr.map((v,i)=>`${pad+bw*i+bw/2},${H-(v/max*H)}`).join(' ');
    return <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'210px'}}>
      {[0,1,2,3,4].map(i=><line key={i} x1="0" x2={W} y1={H/4*i} y2={H/4*i} stroke="#F1F4F9" strokeWidth="1"/>)}
      {att.map((v,i)=><rect key={i} x={pad+bw*i+7} y={H-(v/max*H)} width={bw-14} height={v/max*H} rx="3" fill="#DBE8FF"/>)}
      <polyline points={lp(tot)} fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={lp(att)} fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      {att.map((v,i)=><circle key={i} cx={pad+bw*i+bw/2} cy={H-(v/max*H)} r="2.6" fill="#fff" stroke={c} strokeWidth="1.8"/>)}
    </svg>;
  }
}

DashboardScreen.cases = ['기본', '로딩'];
window.DashboardScreen = DashboardScreen;
