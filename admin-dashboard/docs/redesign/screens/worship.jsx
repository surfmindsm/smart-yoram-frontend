// Church Round · Direction C — 예배 시간표
// Canonical = WorshipScheduleManagement. From code: service name, day_of_week,
// start/end time, location, service_type(주일/수요/새벽/금요...), target_group,
// is_online. Grouped by service type. Tabs 전체/주일/주중/온라인.
// Exports window.WorshipScreen

function WorshipScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const groups = [
    ['주일예배', [
      ['1부 예배','일','09:00','10:20','본당','전 교인',false],
      ['2부 예배','일','11:00','12:20','본당','전 교인',true],
      ['주일학교','일','09:00','10:20','교육관','유·초등부',false],
      ['청년예배','일','14:00','15:30','비전홀','청년부',false],
    ]],
    ['수요예배', [
      ['수요 저녁예배','수','19:30','20:40','본당','전 교인',true],
    ]],
    ['새벽기도', [
      ['새벽기도회','화–토','05:30','06:10','본당','전 교인',false],
    ]],
    ['금요기도', [
      ['금요 성령집회','금','20:00','21:30','본당','전 교인',true],
    ]],
  ];

  return (
    <CShell
      active="worship"
      title="예배 시간표"
      subtitle="등록된 예배 7개 · 온라인 중계 3개"
      segment={[{label:'전체',on:true},{label:'주일'},{label:'주중'},{label:'온라인'}]}
      headerRight={<button className="cs-cta">{I.plus}예배 추가</button>}
    >
      <style>{`
        .wo-sec{margin-bottom:20px;}
        .wo-sh{display:flex;align-items:center;gap:9px;margin-bottom:11px;}
        .wo-st{font-size:14px;font-weight:700;letter-spacing:-.01em;}
        .wo-sn{font-size:11.5px;font-weight:700;color:#94A3B8;background:#fff;border:1px solid #E3E8F0;
          padding:1px 8px;border-radius:999px;}
        .wo-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);overflow:hidden;}
        .wo-row{display:flex;align-items:center;gap:18px;padding:15px 20px;border-bottom:1px solid #F1F4F9;}
        .wo-row:last-child{border-bottom:none;}
        .wo-row:hover{background:#FAFBFD;}
        .wo-time{display:flex;flex-direction:column;align-items:center;width:64px;flex:0 0 64px;
          padding-right:18px;border-right:1px solid #EEF1F6;}
        .wo-day{font-size:11px;font-weight:700;color:var(--cr-primary);}
        .wo-hh{font-size:17px;font-weight:750;letter-spacing:-.02em;line-height:1.2;}
        .wo-end{font-size:11px;color:#94A3B8;}
        .wo-nm{font-size:14px;font-weight:700;}
        .wo-meta{display:flex;gap:14px;margin-top:5px;}
        .wo-m{font-size:12px;color:#64748B;display:inline-flex;align-items:center;gap:5px;}
        .wo-m svg{width:13px;height:13px;color:#94A3B8;}
        .wo-on{font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:999px;background:#EAF1FE;color:#2563EB;
          display:inline-flex;align-items:center;gap:4px;white-space:nowrap;}
        .wo-on svg{width:11px;height:11px;}
        .wo-acts{margin-left:auto;display:flex;gap:7px;flex:0 0 auto;}
        .wo-b{width:30px;height:30px;border-radius:7px;border:1px solid #E3E8F0;display:inline-flex;align-items:center;
          justify-content:center;color:#64748B;background:#fff;}
        .wo-b svg{width:15px;height:15px;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={5} /> :
       caseId === '빈 상태' ? <CEmpty icon={I.calendar} title="등록된 예배가 없습니다" desc="예배 일정을 추가해 교인 앱과 주보에 표시하세요." cta="예배 추가" /> :
      (<React.Fragment>
      {groups.map((g,gi)=>{
        const [type,services]=g;
        return (
          <div key={gi} className="wo-sec">
            <div className="wo-sh"><span className="wo-st">{type}</span><span className="wo-sn">{services.length}</span></div>
            <div className="wo-card">
              {services.map((s,i)=>{
                const [name,day,start,end,loc,target,online]=s;
                return (
                  <div key={i} className="wo-row">
                    <div className="wo-time">
                      <span className="wo-day">{day}</span>
                      <span className="wo-hh">{start}</span>
                      <span className="wo-end">~{end}</span>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
                        <span className="wo-nm">{name}</span>
                        {online && <span className="wo-on">{I.eye}온라인 중계</span>}
                      </div>
                      <div className="wo-meta">
                        <span className="wo-m">{I.pin}{loc}</span>
                        <span className="wo-m">{I.users}{target}</span>
                      </div>
                    </div>
                    <div className="wo-acts"><span className="wo-b">{I.edit}</span><span className="wo-b">{I.trash}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      </React.Fragment>)}
    </CShell>
  );
}

WorshipScreen.cases = ['기본', '빈 상태', '로딩'];
window.WorshipScreen = WorshipScreen;
