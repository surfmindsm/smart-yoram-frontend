// Direction C — "Focused Workspace"
// Dense daily-operations console: dark navy sidebar, compact KPI strip,
// today's tasks + upcoming schedule panel, a data table. For staff who
// live in the tool. Brand blue = action/active; tight spacing, crisp.
// Exports window.FocusedWorkspace

function FocusedWorkspace() {
  const I = window.ICONS;
  const blue = '#2E86FF';
  const ink = '#0E1729';
  return (
    <div className="fw-root">
      <style>{`
        .fw-root{width:1440px;height:1024px;background:#F1F4F9;color:#0E1729;
          font-family:'Pretendard',system-ui,sans-serif;display:flex;overflow:hidden;
          -webkit-font-smoothing:antialiased;font-feature-settings:'tnum';}
        .fw-root *{box-sizing:border-box;}
        /* sidebar (dark) */
        .fw-side{width:236px;flex:0 0 236px;background:${ink};color:#C3CDDE;display:flex;
          flex-direction:column;height:100%;}
        .fw-brand{height:58px;display:flex;align-items:center;padding:0 20px;border-bottom:1px solid #1B2740;
          font-size:21px;letter-spacing:-.01em;}
        .fw-brand .c{font-family:'Newsreader',Georgia,serif;font-style:italic;font-weight:500;color:${blue};}
        .fw-brand .r{font-weight:800;color:#fff;}
        .fw-cmd{margin:14px 16px 6px;height:34px;background:#172033;border:1px solid #233149;border-radius:8px;
          display:flex;align-items:center;gap:8px;padding:0 11px;color:#6B7A95;font-size:12.5px;}
        .fw-cmd svg{width:14px;height:14px;}
        .fw-cmd .k{margin-left:auto;font-size:10px;border:1px solid #2C3A56;border-radius:4px;padding:1px 5px;color:#5C6B86;}
        .fw-nav{flex:1;overflow:hidden;padding:8px 12px;}
        .fw-grp{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
          color:#54627E;padding:14px 10px 6px;}
        .fw-item{display:flex;align-items:center;gap:11px;padding:7px 10px;border-radius:7px;font-size:13px;
          font-weight:500;color:#AEBACE;cursor:default;}
        .fw-item svg{width:16px;height:16px;flex:0 0 16px;color:#6B7A95;}
        .fw-item.on{background:${blue};color:#fff;font-weight:600;}
        .fw-item.on svg{color:#fff;}
        .fw-item .ct{margin-left:auto;font-size:10.5px;font-weight:700;background:#233149;color:#9DB0CC;
          padding:1px 7px;border-radius:999px;}
        .fw-item.on .ct{background:rgba(255,255,255,.22);color:#fff;}
        .fw-user{border-top:1px solid #1B2740;padding:12px 16px;display:flex;align-items:center;gap:10px;}
        .fw-av{width:32px;height:32px;border-radius:8px;background:${blue};color:#fff;display:flex;
          align-items:center;justify-content:center;font-weight:700;font-size:13px;}
        /* main */
        .fw-main{flex:1;display:flex;flex-direction:column;height:100%;overflow:hidden;}
        .fw-top{height:58px;flex:0 0 58px;background:#fff;border-bottom:1px solid #E3E8F0;display:flex;
          align-items:center;padding:0 24px;gap:16px;}
        .fw-crumb{font-size:13px;color:#64748B;}
        .fw-crumb b{color:#0E1729;font-weight:700;}
        .fw-seg{display:flex;background:#F1F4F9;border-radius:8px;padding:3px;gap:2px;}
        .fw-seg span{font-size:12px;font-weight:600;color:#64748B;padding:5px 12px;border-radius:6px;}
        .fw-seg span.on{background:#fff;color:#0E1729;box-shadow:0 1px 2px rgba(0,0,0,.08);}
        .fw-icbtn{width:34px;height:34px;border-radius:8px;border:1px solid #E3E8F0;display:flex;
          align-items:center;justify-content:center;color:#64748B;}
        .fw-icbtn svg{width:17px;height:17px;}
        .fw-cta{height:34px;padding:0 14px;border-radius:8px;background:${blue};color:#fff;font-weight:600;
          font-size:12.5px;display:flex;align-items:center;gap:6px;}
        .fw-cta svg{width:15px;height:15px;}
        .fw-body{flex:1;overflow:hidden;padding:18px 24px;}
        /* kpi strip */
        .fw-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#E3E8F0;border:1px solid #E3E8F0;
          border-radius:12px;overflow:hidden;}
        .fw-kpi{background:#fff;padding:14px 16px;}
        .fw-kpi .lab{font-size:11.5px;color:#64748B;font-weight:600;display:flex;align-items:center;gap:6px;}
        .fw-kpi .lab svg{width:13px;height:13px;color:#94A3B8;}
        .fw-kpi .val{font-size:25px;font-weight:750;letter-spacing:-.02em;margin-top:7px;line-height:1;}
        .fw-kpi .val small{font-size:12px;font-weight:600;color:#94A3B8;}
        .fw-kpi .d{font-size:11px;font-weight:600;margin-top:6px;}
        .fw-up{color:#16A34A;} .fw-dn{color:#DC2626;}
        .fw-grid{display:grid;grid-template-columns:1.55fr 1fr;gap:14px;margin-top:14px;}
        .fw-card{background:#fff;border:1px solid #E3E8F0;border-radius:12px;}
        .fw-ch{padding:14px 18px;border-bottom:1px solid #EEF1F6;display:flex;align-items:center;justify-content:space-between;}
        .fw-ct{font-size:14px;font-weight:700;letter-spacing:-.01em;}
        .fw-cp{padding:18px;}
        .fw-legend{display:flex;gap:13px;font-size:11.5px;color:#64748B;}
        .fw-dot{width:8px;height:8px;border-radius:2.5px;display:inline-block;margin-right:5px;}
        .fw-link{font-size:12px;color:${blue};font-weight:600;display:flex;align-items:center;gap:3px;}
        .fw-link svg{width:13px;height:13px;}
        /* task list */
        .fw-task{display:flex;align-items:center;gap:11px;padding:11px 18px;border-bottom:1px solid #F1F4F9;}
        .fw-task:last-child{border-bottom:none;}
        .fw-cb{width:17px;height:17px;border-radius:5px;border:2px solid #CBD5E1;flex:0 0 17px;}
        .fw-cb.done{background:${blue};border-color:${blue};display:flex;align-items:center;justify-content:center;}
        .fw-cb.done svg{width:11px;height:11px;color:#fff;}
        .fw-tt{font-size:13px;font-weight:500;}
        .fw-tt.done{color:#94A3B8;text-decoration:line-through;}
        .fw-tm{font-size:11px;color:#94A3B8;}
        .fw-chip{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:6px;margin-left:auto;}
        /* table */
        .fw-table{width:100%;border-collapse:collapse;font-size:12.5px;}
        .fw-table th{text-align:left;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;
          letter-spacing:.04em;padding:10px 18px;border-bottom:1px solid #EEF1F6;background:#FAFBFD;}
        .fw-table td{padding:11px 18px;border-bottom:1px solid #F1F4F9;color:#334155;}
        .fw-table tr:last-child td{border-bottom:none;}
        .fw-mav{width:26px;height:26px;border-radius:7px;background:#EEF3FC;color:${blue};display:inline-flex;
          align-items:center;justify-content:center;font-weight:700;font-size:11px;margin-right:9px;vertical-align:middle;}
        .fw-st{font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:999px;}
      `}</style>

      {/* SIDEBAR */}
      <aside className="fw-side">
        <div className="fw-brand"><span className="c">church</span>&nbsp;<span className="r">round</span></div>
        <div className="fw-cmd">{I.search}<span>빠른 검색</span><span className="k">⌘K</span></div>
        <nav className="fw-nav">
          <div className="fw-grp">운영</div>
          {nav(I.home,'대시보드',true)}
          {nav(I.users,'교인 관리',false,'842')}
          {nav(I.care,'심방 신청',false,'5')}
          {nav(I.heart,'중보 기도',false,'12')}
          <div className="fw-grp">살림</div>
          {nav(I.won,'헌금 관리',false)}
          {nav(I.book,'오늘의 말씀',false)}
          {nav(I.file,'주보 · 공지',false)}
          {nav(I.calendar,'예배 일정',false)}
          <div className="fw-grp">도구</div>
          {nav(I.msg,'문자 발송',false)}
          {nav(I.qr,'QR 출석',false)}
          {nav(I.spark,'AI 도구',false)}
          {nav(I.settings,'설정',false)}
        </nav>
        <div className="fw-user">
          <div className="fw-av">이</div>
          <div>
            <div style={{fontSize:'12.5px',fontWeight:600,color:'#E6ECF6'}}>이사랑 간사</div>
            <div style={{fontSize:'11px',color:'#6B7A95'}}>은혜로교회</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="fw-main">
        <div className="fw-top">
          <div className="fw-crumb">은혜로교회 / <b>대시보드</b></div>
          <div style={{flex:1}}></div>
          <div className="fw-seg"><span>오늘</span><span className="on">이번 주</span><span>이번 달</span></div>
          <div className="fw-icbtn">{I.bell}</div>
          <div className="fw-cta">{I.plus}교인 등록</div>
        </div>

        <div className="fw-body">
          <div className="fw-strip">
            {kpi(I.users,'전체 교인','842','명','+7','up')}
            {kpi(I.check,'주일 출석','612','명','73%','up')}
            {kpi(I.userplus,'새가족','7','명','+2','up')}
            {kpi(I.won,'주간 헌금','1,248','만원','+4.2%','up')}
            {kpi(I.care,'대기 심방','5','건','-2','dn')}
          </div>

          <div className="fw-grid">
            <div className="fw-card">
              <div className="fw-ch">
                <div className="fw-ct">출석 · 교인 추이</div>
                <div className="fw-legend">
                  <span><span className="fw-dot" style={{background:blue}}></span>출석</span>
                  <span><span className="fw-dot" style={{background:'#16A34A'}}></span>총 교인</span>
                  <span><span className="fw-dot" style={{background:'#CBD5E1'}}></span>신규</span>
                </div>
              </div>
              <div className="fw-cp">{chart(blue)}</div>
            </div>

            <div className="fw-card">
              <div className="fw-ch">
                <div className="fw-ct">오늘 할 일</div>
                <div className="fw-link">6월 3일 (수){I.arrow}</div>
              </div>
              {task(true,'수요예배 주보 발행','마감 17:00','#16A34A','완료','#E7F6EC')}
              {task(false,'신규 교인 박지훈 환영 문자','오늘','#2563EB','발송','#EAF1FE')}
              {task(false,'이순영 권사 심방 일정 확정','오늘','#DC2626','긴급','#FCEBEB')}
              {task(false,'6월 첫째 주 헌금 결산 검토','오후','#B45309','검토','#FBF1E3')}
              {task(false,'주일 봉사자 명단 정리','내일까지','#64748B','예정','#F1F4F9')}
            </div>
          </div>

          <div className="fw-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
            <div className="fw-card">
              <div className="fw-ch"><div className="fw-ct">최근 등록 교인</div><div className="fw-link">전체 보기{I.arrow}</div></div>
              <table className="fw-table">
                <thead><tr><th>이름</th><th>구역</th><th>등록일</th><th>상태</th></tr></thead>
                <tbody>
                  {row('박','박지훈','1구역','6월 2일','새가족','#EAF1FE','#2563EB')}
                  {row('윤','윤서연','3구역','5월 29일','정착중','#FBF1E3','#B45309')}
                  {row('강','강도현','2구역','5월 25일','등록','#E7F6EC','#16A34A')}
                  {row('한','한지우','5구역','5월 21일','등록','#E7F6EC','#16A34A')}
                </tbody>
              </table>
            </div>

            <div className="fw-card">
              <div className="fw-ch"><div className="fw-ct">다가오는 일정</div><div className="fw-link">달력{I.arrow}</div></div>
              {sched('03','수','수요 저녁예배','19:30 · 본당',blue)}
              {sched('05','금','최민준 성도 생일','심방 카드 발송','#8A5A86')}
              {sched('07','일','주일 1·2부 예배','09:00 / 11:00','#16A34A')}
              {sched('08','월','제직회','20:00 · 교육관','#B45309')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function nav(icon,label,on,ct){
    return <div className={'fw-item'+(on?' on':'')}>{icon}<span>{label}</span>{ct&&<span className="ct">{ct}</span>}</div>;
  }
  function kpi(icon,lab,val,unit,d,dir){
    return <div className="fw-kpi">
      <div className="lab">{icon}{lab}</div>
      <div className="val">{val}<small> {unit}</small></div>
      <div className={'d '+(dir==='up'?'fw-up':'fw-dn')}>{d} 지난주</div>
    </div>;
  }
  function task(done,t,m,fg,chip,bg){
    return <div className="fw-task">
      <div className={'fw-cb'+(done?' done':'')}>{done&&I.check2}</div>
      <div><div className={'fw-tt'+(done?' done':'')}>{t}</div><div className="fw-tm">{m}</div></div>
      <span className="fw-chip" style={{background:bg,color:fg}}>{chip}</span>
    </div>;
  }
  function row(ini,name,zone,date,st,bg,fg){
    return <tr>
      <td><span className="fw-mav">{ini}</span>{name}</td>
      <td>{zone}</td><td>{date}</td>
      <td><span className="fw-st" style={{background:bg,color:fg}}>{st}</span></td>
    </tr>;
  }
  function sched(d,wd,t,m,c){
    return <div className="fw-task">
      <div style={{textAlign:'center',width:'34px',flex:'0 0 34px'}}>
        <div style={{fontSize:'17px',fontWeight:750,lineHeight:1,color:c}}>{d}</div>
        <div style={{fontSize:'10px',color:'#94A3B8',fontWeight:600}}>{wd}</div>
      </div>
      <div style={{width:'1px',height:'26px',background:'#EEF1F6'}}></div>
      <div><div className="fw-tt">{t}</div><div className="fw-tm">{m}</div></div>
    </div>;
  }
  function chart(c){
    const att=[58,62,55,68,64,71,67,73,70,74,72,76];
    const tot=[40,44,43,52,50,58,57,64,63,68,67,72];
    const W=600,H=230,pad=12;const bw=(W-pad*2)/att.length;
    const max=90;
    const lp=(arr)=>arr.map((v,i)=>`${pad+bw*i+bw/2},${H-(v/max*H)}`).join(' ');
    return <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'230px'}}>
      {[0,1,2,3,4].map(i=><line key={i} x1="0" x2={W} y1={H/4*i} y2={H/4*i} stroke="#F1F4F9" strokeWidth="1"/>)}
      {att.map((v,i)=><rect key={i} x={pad+bw*i+7} y={H-(v/max*H)} width={bw-14} height={v/max*H} rx="3" fill="#DBE8FF"/>)}
      <polyline points={lp(tot)} fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={lp(att)} fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      {att.map((v,i)=><circle key={i} cx={pad+bw*i+bw/2} cy={H-(v/max*H)} r="2.6" fill="#fff" stroke={c} strokeWidth="1.8"/>)}
    </svg>;
  }
}

window.FocusedWorkspace = FocusedWorkspace;
