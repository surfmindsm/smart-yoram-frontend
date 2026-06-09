// Church Round · Direction C — 심방 신청 관리
// Canonical = PastoralCareManagement. Fields/states from code:
// status(pending·approved·scheduled·in_progress·completed·cancelled),
// priority(urgent·high·normal·low), type(general·urgent·hospital·counseling),
// preferredDate/time, assignedPastor, contactInfo. Tabs: 신청 목록 / 완료 기록.
// Exports window.PastoralCareScreen

function PastoralCareScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const TYPE = {
    general:  ['일반', C.st.neutral],
    urgent:   ['긴급', C.st.danger],
    hospital: ['병원', C.st.info],
    counseling:['상담', C.st.accent],
  };
  const PRI = { urgent:['긴급','#DC2626'], high:['높음','#D97706'], normal:['보통','#64748B'], low:['낮음','#94A3B8'] };
  const STAT = {
    pending:  ['대기중', C.st.warning],
    approved: ['승인됨', C.st.info],
    scheduled:['예약됨', ['#EEF3FC','#1C7CFF']],
    in_progress:['진행중', C.st.accent],
    completed:['완료', C.st.success],
  };

  const reqs = [
    ['이','이순영 권사','hospital','urgent','pending','입원 중이셔서 심방 부탁드립니다. 안양성모병원 7층 712호입니다.','6월 4일 (목) 오후','010-5520-1184','담당 미정'],
    ['박','박지훈 성도','counseling','high','approved','새가족 정착 상담을 원합니다. 직장 문제로 고민이 많습니다.','6월 5일 (금) 저녁','010-9931-2207','김은혜 목사'],
    ['정','정해성 집사','general','normal','scheduled','가정 내 어려움으로 목사님과 상담하고 싶습니다.','6월 6일 (토) 19:00','010-2218-9943','김은혜 목사'],
    ['최','최민준 집사','general','normal','in_progress','부모님 건강 문제로 기도와 심방 요청드립니다.','6월 3일 (수) 14:00','010-3372-8810','이사랑 간사'],
    ['한','한지우 성도','general','low','pending','이사 후 가정 심방을 신청합니다.','희망일 미정','010-8853-2061','담당 미정'],
  ];

  return (
    <CShell
      active="care"
      title="심방 신청 관리"
      subtitle="대기 중인 신청 5건 · 이번 달 완료 12건"
      segment={[{label:'신청 목록',on:true},{label:'완료 기록'}]}
      headerRight={<button className="cs-cta">{I.plus}심방 신청</button>}
    >
      <style>{`
        .pc-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}
        .pc-kpi{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);padding:14px 16px;}
        .pc-kpi .l{font-size:12px;color:#64748B;font-weight:600;}
        .pc-kpi .v{font-size:24px;font-weight:750;margin-top:6px;letter-spacing:-.02em;}
        .pc-kpi .v small{font-size:13px;color:#94A3B8;font-weight:600;}
        .pc-filter{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
        .pc-search{flex:1;max-width:300px;height:38px;border:1px solid #E3E8F0;border-radius:9px;background:#fff;
          display:flex;align-items:center;gap:8px;padding:0 12px;color:#94A3B8;font-size:13px;}
        .pc-search svg{width:15px;height:15px;}
        .pc-sel{height:38px;border:1px solid #E3E8F0;border-radius:9px;background:#fff;display:flex;align-items:center;
          gap:7px;padding:0 12px;font-size:12.5px;font-weight:500;color:#334155;white-space:nowrap;}
        .pc-sel svg{width:14px;height:14px;color:#94A3B8;}
        .pc-sel .v{font-weight:600;color:#0E1729;}
        .pc-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);padding:18px 20px;
          margin-bottom:12px;display:flex;gap:16px;}
        .pc-card.urg{border-left:3px solid #DC2626;}
        .pc-av{width:44px;height:44px;border-radius:11px;background:#EEF3FC;color:var(--cr-primary);display:flex;
          align-items:center;justify-content:center;font-weight:700;font-size:16px;flex:0 0 44px;}
        .pc-main{flex:1;min-width:0;}
        .pc-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .pc-nm{font-size:15px;font-weight:700;}
        .pc-chip{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap;}
        .pc-pri{font-size:11.5px;font-weight:700;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;}
        .pc-pri .d{width:6px;height:6px;border-radius:50%;}
        .pc-txt{font-size:13px;color:#475569;line-height:1.55;margin-top:9px;}
        .pc-meta{display:flex;gap:18px;flex-wrap:wrap;margin-top:11px;}
        .pc-m{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#64748B;}
        .pc-m svg{width:13px;height:13px;color:#94A3B8;}
        .pc-side{display:flex;flex-direction:column;align-items:flex-end;gap:12px;flex:0 0 auto;}
        .pc-acts{display:flex;gap:7px;}
        .pc-b{height:32px;padding:0 13px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;
          border:1px solid #E3E8F0;background:#fff;color:#334155;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;}
        .pc-b svg{width:13px;height:13px;}
        .pc-b.pri{background:var(--cr-primary);color:#fff;border-color:var(--cr-primary);}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={5} /> :
       caseId === '빈 상태' ? <CEmpty icon={I.care} title="대기 중인 심방 신청이 없습니다" desc="새 신청이 들어오면 여기에 표시됩니다." cta="심방 신청" /> :
      (<React.Fragment>
      <div className="pc-kpis">
        {kpi('대기 중','5','건')}
        {kpi('승인 · 예약','3','건')}
        {kpi('진행 중','1','건')}
        {kpi('이번 달 완료','12','건')}
      </div>

      <div className="pc-filter">
        <div className="pc-search">{I.search}<span>이름, 내용으로 검색</span></div>
        <div style={{flex:1}}></div>
        <CDropdown cls="pc-sel" label="상태" value="전체" options={['전체','대기중','승인됨','예약됨','진행중','완료']} />
        <CDropdown cls="pc-sel" label="우선순위" value="전체" options={['전체','긴급','높음','보통','낮음']} />
        <CDropdown cls="pc-sel" label="유형" value="전체" options={['전체','일반','긴급','병원','상담']} align="right" />
      </div>

      {reqs.map((r,i)=>{
        const [ini,name,type,pri,stat,txt,when,contact,pastor]=r;
        const [tl,tc]=TYPE[type], [pl,pc]=PRI[pri], [sl,sc]=STAT[stat];
        return (
          <div key={i} className={'pc-card'+(pri==='urgent'?' urg':'')}>
            <div className="pc-av">{ini}</div>
            <div className="pc-main">
              <div className="pc-top">
                <span className="pc-nm">{name}</span>
                <span className="pc-chip" style={{background:tc[0],color:tc[1]}}>{tl}</span>
                <span className="pc-pri" style={{color:pc}}><span className="d" style={{background:pc}}></span>{pl}</span>
              </div>
              <div className="pc-txt">{txt}</div>
              <div className="pc-meta">
                <span className="pc-m">{I.calendar}{when}</span>
                <span className="pc-m">{I.phone}{contact}</span>
                <span className="pc-m">{I.users}{pastor}</span>
              </div>
            </div>
            <div className="pc-side">
              <span className="pc-chip" style={{background:sc[0],color:sc[1],fontSize:'11px',padding:'3px 11px'}}>{sl}</span>
              <div className="pc-acts">{actions(stat)}</div>
            </div>
          </div>
        );
      })}
      </React.Fragment>)}
    </CShell>
  );

  function kpi(l,v,u){ return <div className="pc-kpi"><div className="l">{l}</div><div className="v">{v}<small> {u}</small></div></div>; }
  function actions(stat){
    if(stat==='pending') return <><span className="pc-b">{I.x}거부</span><span className="pc-b pri">{I.check2}승인</span></>;
    if(stat==='approved') return <><span className="pc-b">상세</span><span className="pc-b pri">{I.calendar}일정 잡기</span></>;
    if(stat==='scheduled') return <><span className="pc-b">상세</span><span className="pc-b pri">{I.check2}완료 처리</span></>;
    if(stat==='in_progress') return <><span className="pc-b">상세</span><span className="pc-b pri">{I.check2}완료 처리</span></>;
    return <span className="pc-b">상세</span>;
  }
}

PastoralCareScreen.cases = ['기본', '빈 상태', '로딩'];
window.PastoralCareScreen = PastoralCareScreen;
