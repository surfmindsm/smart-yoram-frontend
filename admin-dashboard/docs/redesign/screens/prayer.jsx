// Church Round · Direction C — 중보 기도 요청
// Canonical = PrayerRequests. Fields from code: requesterName/phone, prayerType,
// prayerContent, isAnonymous, isUrgent, isPublic, status(active·answered·closed),
// prayerCount, answeredTestimony. Stats: 전체/진행중/응답됨/긴급.
// Exports window.PrayerScreen

function PrayerScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const TYPE = {
    general:['일반', C.st.neutral], healing:['치유', C.st.info], family:['가정', C.st.accent],
    thanks:['감사', C.st.success], restore:['회복', C.st.warning],
  };
  const STAT = { active:['진행중', C.st.info], answered:['응답됨', C.st.success], closed:['종료됨', C.st.neutral] };

  const items = [
    ['이','이순영 권사',false,'healing',true,'active',42,'수술을 앞두고 있습니다. 건강하게 회복되어 다시 예배드릴 수 있도록 기도 부탁드립니다.','2일 전', true, null],
    ['익','익명',true,'family',false,'active',18,'가정의 회복과 화목을 위해 함께 기도해 주세요. 많이 힘든 시기를 지나고 있습니다.','3일 전', false, null],
    ['박','박지훈 성도',false,'general',false,'active',7,'새로운 직장에 잘 적응하고, 믿음 안에서 든든히 서가도록 기도해 주세요.','5일 전', true, null],
    ['최','최민준 집사',false,'thanks',false,'answered',63,'기도해 주신 덕분에 아이가 건강하게 태어났습니다. 진심으로 감사드립니다.','1주 전', true, '건강한 딸을 출산했습니다. 함께 기도해 주신 모든 분께 감사드립니다. 🙏'],
    ['한','한지우 성도',false,'restore',false,'closed',25,'오랜 갈등이 있던 관계가 회복되기를 기도합니다.','2주 전', true, null],
  ];

  return (
    <CShell
      active="prayer"
      title="중보 기도 요청"
      subtitle="진행 중 54건 · 이번 주 새 요청 9건"
      segment={[{label:'전체',on:true},{label:'진행중'},{label:'응답됨'}]}
      headerRight={<button className="cs-cta">{I.plus}기도 요청</button>}
    >
      <style>{`
        .pr-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}
        .pr-kpi{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);padding:14px 16px;
          display:flex;align-items:center;gap:13px;}
        .pr-kpi .ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:0 0 38px;}
        .pr-kpi .ic svg{width:18px;height:18px;}
        .pr-kpi .l{font-size:12px;color:#64748B;font-weight:600;}
        .pr-kpi .v{font-size:23px;font-weight:750;letter-spacing:-.02em;line-height:1.1;}
        .pr-filter{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
        .pr-search{flex:1;max-width:320px;height:38px;border:1px solid #E3E8F0;border-radius:9px;background:#fff;
          display:flex;align-items:center;gap:8px;padding:0 12px;color:#94A3B8;font-size:13px;}
        .pr-search svg{width:15px;height:15px;}
        .pr-sel{height:38px;border:1px solid #E3E8F0;border-radius:9px;background:#fff;display:flex;align-items:center;
          gap:7px;padding:0 12px;font-size:12.5px;font-weight:500;color:#334155;white-space:nowrap;}
        .pr-sel svg{width:14px;height:14px;color:#94A3B8;}
        .pr-sel .v{font-weight:600;color:#0E1729;}
        .pr-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .pr-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);padding:18px 20px;display:flex;flex-direction:column;}
        .pr-card.urg{border-left:3px solid #DC2626;}
        .pr-head{display:flex;align-items:center;gap:11px;}
        .pr-av{width:40px;height:40px;border-radius:11px;background:#EEF3FC;color:var(--cr-primary);display:flex;
          align-items:center;justify-content:center;font-weight:700;font-size:15px;flex:0 0 40px;}
        .pr-nm{font-size:14px;font-weight:700;}
        .pr-sub{font-size:11.5px;color:#94A3B8;margin-top:1px;display:flex;align-items:center;gap:6px;}
        .pr-chip{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap;}
        .pr-txt{font-size:13px;color:#475569;line-height:1.6;margin:13px 0;flex:1;}
        .pr-ans{background:#F0FAF3;border:1px solid #CDEBD7;border-radius:10px;padding:11px 13px;margin-bottom:13px;}
        .pr-ans .t{font-size:11px;font-weight:700;color:#16A34A;display:flex;align-items:center;gap:5px;margin-bottom:4px;}
        .pr-ans .t svg{width:12px;height:12px;}
        .pr-ans .c{font-size:12.5px;color:#3F7A4E;line-height:1.5;}
        .pr-foot{display:flex;align-items:center;gap:10px;padding-top:13px;border-top:1px solid #F1F4F9;}
        .pr-cnt{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#DC2626;white-space:nowrap;flex:0 0 auto;}
        .pr-cnt svg{width:15px;height:15px;}
        .pr-cnt small{color:#94A3B8;font-weight:500;font-size:11.5px;white-space:nowrap;}
        .pr-b{height:32px;padding:0 13px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;
          border:1px solid #E3E8F0;background:#fff;color:#334155;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;}
        .pr-b svg{width:13px;height:13px;}
        .pr-b.pray{background:#FCEBEB;border-color:#F6D2D2;color:#DC2626;}
        .pr-b.pri{background:var(--cr-primary);color:#fff;border-color:var(--cr-primary);}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={5} /> :
       caseId === '빈 상태' ? <CEmpty icon={I.heart} title="등록된 기도 제목이 없습니다" desc="첫 기도 제목을 등록해 함께 중보해요." cta="기도 요청" /> :
      (<React.Fragment>
      <div className="pr-kpis">
        {kpi(I.heart,'전체 요청','86',['#EEF3FC','#1C7CFF'])}
        {kpi(I.clock,'진행 중','54',C.st.info)}
        {kpi(I.check,'응답됨','28',C.st.success)}
        {kpi(I.bell,'긴급','4',C.st.danger)}
      </div>

      <div className="pr-filter">
        <div className="pr-search">{I.search}<span>요청자, 기도 내용으로 검색</span></div>
        <div style={{flex:1}}></div>
        <CDropdown cls="pr-sel" label="유형" value="전체" options={['전체','일반','치유','가정','감사','회복']} />
        <CDropdown cls="pr-sel" label="긴급" value="전체" options={['전체','긴급만','일반']} align="right" />
      </div>

      <div className="pr-grid">
        {items.map((it,i)=>{
          const [ini,name,anon,type,urgent,stat,count,txt,when,pub,testimony]=it;
          const [tl,tc]=TYPE[type], [sl,sc]=STAT[stat];
          return (
            <div key={i} className={'pr-card'+(urgent?' urg':'')}>
              <div className="pr-head">
                <div className="pr-av">{anon?I.heart:ini}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                    <span className="pr-nm">{name}</span>
                    {urgent && <span className="pr-chip" style={{background:C.st.danger[0],color:C.st.danger[1]}}>긴급</span>}
                  </div>
                  <div className="pr-sub">
                    <span className="pr-chip" style={{background:tc[0],color:tc[1]}}>{tl}</span>
                    <span>{pub?'전체 공개':'비공개'} · {when}</span>
                  </div>
                </div>
                <span className="pr-chip" style={{background:sc[0],color:sc[1],fontSize:'11px',padding:'3px 11px'}}>{sl}</span>
              </div>

              <div className="pr-txt">{txt}</div>

              {testimony && (
                <div className="pr-ans">
                  <div className="t">{I.check}응답 간증</div>
                  <div className="c">{testimony}</div>
                </div>
              )}

              <div className="pr-foot">
                <span className="pr-cnt">{I.heart}{count}<small>명</small></span>
                <div style={{flex:1}}></div>
                <span className="pr-b pray">{I.heart}기도하기</span>
                {stat==='active'
                  ? <span className="pr-b pri">{I.check2}응답 처리</span>
                  : <span className="pr-b">{I.eye}상세</span>}
              </div>
            </div>
          );
        })}
      </div>
      </React.Fragment>)}
    </CShell>
  );

  function kpi(icon,l,v,col){
    return <div className="pr-kpi">
      <div className="ic" style={{background:col[0],color:col[1]}}>{icon}</div>
      <div><div className="l">{l}</div><div className="v">{v}</div></div>
    </div>;
  }
}

PrayerScreen.cases = ['기본', '빈 상태', '로딩'];
window.PrayerScreen = PrayerScreen;
