// Church Round · Direction C — 조직 관리
// Canonical = OrganizationManagement. Tabs 조직 관리 / 부서 관리. Org tree:
// organization_type(부서·구역·목장·팀·위원회), member_count, leader, is_active,
// children. Exports window.OrgScreen

function OrgScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const TYPE = { 부서:C.st.info, 구역:C.st.neutral, 목장:['#E7F6EC','#16A34A'], 팀:C.st.accent, 위원회:C.st.warning };

  // [level, name, type, count, leader, active]
  const tree = [
    [0,'장년부','부서','420','—',true,true],
    [1,'1구역','구역','164','김성호 장로',true],
    [1,'2구역','구역','138','이순영 권사',true],
    [1,'3구역','구역','118','정해성 집사',true],
    [0,'교육부','부서','210','—',true,true],
    [1,'유년부','부서','64','박서진 교사',true],
    [1,'청년부','부서','88','강도현 리더',true],
    [0,'찬양팀','팀','24','최민준 집사',true,false],
    [0,'선교위원회','위원회','16','김은혜 목사',false,false],
  ];

  return (
    <CShell
      active="org"
      title="조직 관리"
      subtitle="교회 조직 구조와 교인 배정을 관리합니다"
      segment={[{label:'조직',on:true},{label:'부서'}]}
      headerRight={<button className="cs-cta">{I.plus}조직 추가</button>}
    >
      <style>{`
        .og-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);overflow:hidden;}
        .og-row{display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid #F1F4F9;}
        .og-row:last-child{border-bottom:none;}
        .og-row:hover{background:#FAFBFD;}
        .og-row.child{background:#FCFDFE;}
        .og-chev{width:18px;height:18px;color:#94A3B8;flex:0 0 18px;}
        .og-chev.hidden{visibility:hidden;}
        .og-ic{width:34px;height:34px;border-radius:9px;background:#EEF3FC;color:var(--cr-primary);display:flex;
          align-items:center;justify-content:center;flex:0 0 34px;}
        .og-ic svg{width:17px;height:17px;}
        .og-ic.sub{background:#F1F4F9;color:#64748B;width:30px;height:30px;flex:0 0 30px;}
        .og-ic.sub svg{width:15px;height:15px;}
        .og-nm{font-size:14px;font-weight:700;}
        .og-nm.sub{font-size:13px;font-weight:600;}
        .og-tag{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap;}
        .og-meta{display:flex;align-items:center;gap:14px;margin-left:auto;}
        .og-cnt{font-size:12.5px;font-weight:700;color:#0E1729;white-space:nowrap;}
        .og-cnt small{color:#94A3B8;font-weight:500;font-size:11px;}
        .og-leader{font-size:12px;color:#64748B;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;min-width:120px;}
        .og-leader svg{width:13px;height:13px;color:#94A3B8;}
        .og-acts{display:flex;gap:6px;}
        .og-b{width:30px;height:30px;border-radius:7px;border:1px solid #E3E8F0;display:inline-flex;align-items:center;
          justify-content:center;color:#64748B;background:#fff;}
        .og-b svg{width:14px;height:14px;}
        .og-off{font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:#F1F4F9;color:#94A3B8;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={6} /> :
       caseId === '빈 상태' ? <CEmpty icon={I.org} title="등록된 조직이 없습니다" desc="부서·구역·목장을 추가해 교회 조직을 구성하세요." cta="조직 추가" /> :
      (<React.Fragment>
      <div className="og-card">
        {tree.map((o,i)=>{
          const [lvl,name,type,count,leader,active,hasChildren]=o;
          const tc=TYPE[type]||C.st.neutral;
          return (
            <div key={i} className={'og-row'+(lvl>0?' child':'')} style={lvl>0?{paddingLeft:'42px'}:null}>
              <span className={'og-chev'+(hasChildren?'':' hidden')}>{I.chevD}</span>
              <span className={'og-ic'+(lvl>0?' sub':'')}>{lvl>0?I.users:I.org}</span>
              <span className={'og-nm'+(lvl>0?' sub':'')}>{name}</span>
              <span className="og-tag" style={{background:tc[0],color:tc[1]}}>{type}</span>
              {!active && <span className="og-off">비활성</span>}
              <div className="og-meta">
                {leader!=='—' && <span className="og-leader">{I.userplus}{leader}</span>}
                <span className="og-cnt">{count}<small>명</small></span>
                <div className="og-acts">
                  <span className="og-b">{I.userplus}</span>
                  <span className="og-b">{I.edit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </React.Fragment>)}
    </CShell>
  );
}

OrgScreen.cases = ['기본', '빈 상태', '로딩'];
window.OrgScreen = OrgScreen;
