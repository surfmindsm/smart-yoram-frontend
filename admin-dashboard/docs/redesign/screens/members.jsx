// Church Round · Direction C — 교인 관리 (목록)
// Canonical screen = MemberManagement (/member-management).
// Real columns from code: 이름·전화번호·직분·부서·상태 — extended with
// avatar, 구역/목장, 등록일, bulk-select, filters, pagination.
// Exports window.MembersScreen

function MembersScreen({ caseId }) {
  const I = window.ICONS, C = window.C;
  const blue = C.blue;

  const members = [
    ['김','김성호','Kim Sung-ho','목사','담임','1구역 · 하늘목장','010-2841-3920','2019.03.12','정착', C.st.success],
    ['이','이순영','Lee Soon-young','권사','—','2구역 · 사랑목장','010-5520-1184','2020.07.05','정착', C.st.success],
    ['박','박지훈','Park Ji-hun','성도','—','1구역 · 하늘목장','010-9931-2207','2026.06.02','새가족', C.st.info],
    ['최','최민준','Choi Min-jun','집사','찬양팀','4구역 · 소망목장','010-3372-8810','2021.11.20','정착', C.st.success],
    ['윤','윤서연','Yoon Seo-yeon','성도','교육부','3구역 · 믿음목장','010-7740-5562','2026.05.29','정착중', C.st.warning],
    ['정','정해성','Jung Hae-sung','집사','—','5구역 · 은혜목장','010-2218-9943','2018.02.18','관심', C.st.danger],
    ['강','강도현','Kang Do-hyun','성도','청년부','2구역 · 사랑목장','010-6604-1175','2026.05.25','정착', C.st.success],
    ['한','한지우','Han Ji-woo','성도','—','5구역 · 은혜목장','010-8853-2061','2026.05.21','정착', C.st.success],
    ['오','오예린','Oh Ye-rin','청년','찬양팀','3구역 · 믿음목장','010-4419-7708','2022.09.14','정착', C.st.success],
  ];

  return (
    <CShell
      active="members"
      title="교인 관리"
      subtitle="전체 842명 · 이번 달 새가족 7명"
      headerRight={<>
        <button className="cs-cta ghost" style={{marginRight:8}}>{I.excel}엑셀</button>
        <a className="cs-cta" href="교인 등록.html" style={{textDecoration:'none'}}>{I.userplus}교인 등록</a>
      </>}
    >
      <style>{`
        .mb-wrap{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);overflow:hidden;}
        .mb-filter{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #EEF1F6;}
        .mb-search{flex:1;max-width:320px;height:36px;border:1px solid #E3E8F0;border-radius:8px;display:flex;
          align-items:center;gap:8px;padding:0 12px;color:#94A3B8;font-size:13px;}
        .mb-search svg{width:15px;height:15px;}
        .mb-sel{height:36px;border:1px solid #E3E8F0;border-radius:8px;display:flex;align-items:center;gap:7px;
          padding:0 12px;font-size:12.5px;font-weight:500;color:#334155;white-space:nowrap;flex:0 0 auto;}
        .mb-sel svg{width:14px;height:14px;color:#94A3B8;}
        .mb-sel .v{color:#0E1729;font-weight:600;}
        .mb-scroll{overflow-x:auto;}
        .mb-table{width:100%;min-width:880px;border-collapse:collapse;font-size:13px;}
        .mb-table th{text-align:left;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;
          letter-spacing:.04em;padding:11px 16px;border-bottom:1px solid #EEF1F6;background:#FAFBFD;white-space:nowrap;}
        .mb-table td{padding:var(--cr-cell-py) 16px;border-bottom:1px solid #F1F4F9;color:#334155;vertical-align:middle;}
        .mb-table tr:last-child td{border-bottom:none;}
        .mb-table tbody tr:hover{background:#FAFBFD;}
        .mb-cb{width:16px;height:16px;border-radius:4px;border:2px solid #CBD5E1;display:inline-block;vertical-align:middle;}
        .mb-cb.on{background:var(--cr-primary);border-color:var(--cr-primary);}
        .mb-name{display:flex;align-items:center;gap:11px;}
        .mb-av{width:34px;height:34px;border-radius:9px;background:#EEF3FC;color:var(--cr-primary);display:flex;
          align-items:center;justify-content:center;font-weight:700;font-size:13px;flex:0 0 34px;}
        .mb-nm{font-weight:600;color:#0E1729;}
        .mb-en{font-size:11px;color:#94A3B8;}
        .mb-pos{font-size:11.5px;font-weight:700;padding:2px 9px;border-radius:6px;background:#F1F4F9;color:#475569;white-space:nowrap;}
        .mb-st{font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;white-space:nowrap;}
        .mb-act{width:30px;height:30px;border-radius:7px;border:1px solid #E3E8F0;display:inline-flex;
          align-items:center;justify-content:center;color:#64748B;background:#fff;text-decoration:none;}
        .mb-act svg{width:15px;height:15px;}
        .mb-foot{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-top:1px solid #EEF1F6;}
        .mb-pg{display:flex;gap:4px;}
        .mb-pgb{min-width:30px;height:30px;border-radius:7px;border:1px solid #E3E8F0;display:flex;align-items:center;
          justify-content:center;font-size:12.5px;font-weight:600;color:#475569;background:#fff;padding:0 8px;}
        .mb-pgb.on{background:var(--cr-primary);color:#fff;border-color:var(--cr-primary);}
        .mb-pgb svg{width:14px;height:14px;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={7} /> :
       caseId === '빈 상태' ? <CEmpty icon={I.users} title="등록된 교인이 없습니다" desc="첫 교인을 등록해 교적 관리를 시작하세요." cta="교인 등록" /> :
       caseId === '검색 결과 없음' ? <CEmpty icon={I.search} title="검색 결과가 없습니다" desc="다른 이름이나 조건으로 다시 검색해 보세요." /> :
      (<div className="mb-wrap">
        {/* filter bar */}
        <div className="mb-filter">
          <div className="mb-search">{I.search}<span>이름, 전화번호로 검색</span></div>
          <div style={{flex:1}}></div>
          <CDropdown cls="mb-sel" label="직분" value="전체" options={['전체','목사','장로','권사','집사','성도','청년']} />
          <CDropdown cls="mb-sel" label="구역" value="전체" options={['전체','1구역','2구역','3구역','4구역','5구역']} />
          <CDropdown cls="mb-sel" label="상태" value="정착" options={['전체','새가족','정착중','정착','관심']} />
          <div className="mb-sel" style={{color:'#64748B'}}>{I.filter}필터</div>
        </div>

        {/* table */}
        <div className="mb-scroll">
        <table className="mb-table">
          <thead>
            <tr>
              <th style={{width:'38px'}}><CCheck cls="mb-cb" /></th>
              <th>이름</th><th>직분 / 부서</th><th>구역 · 목장</th><th>연락처</th><th>등록일</th><th>상태</th><th style={{width:'90px'}}>작업</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m,i)=>{
              const [ini,name,en,pos,dept,zone,phone,date,st,stc] = m;
              return (
                <tr key={i}>
                  <td><CCheck cls="mb-cb" checked={i===2} /></td>
                  <td>
                    <div className="mb-name">
                      <a className="mb-av" href="교인 상세.html" style={{textDecoration:'none'}}>{ini}</a>
                      <div><a href="교인 상세.html" style={{textDecoration:'none',color:'inherit'}}><div className="mb-nm">{name}</div></a><div className="mb-en">{en}</div></div>
                    </div>
                  </td>
                  <td><span className="mb-pos">{pos}</span>{dept!=='—' && <span style={{marginLeft:7,fontSize:'12px',color:'#94A3B8'}}>{dept}</span>}</td>
                  <td style={{fontSize:'12.5px'}}>{zone}</td>
                  <td style={{fontFamily:'ui-monospace,monospace',fontSize:'12.5px',color:'#475569'}}>{phone}</td>
                  <td style={{fontSize:'12.5px',color:'#64748B'}}>{date}</td>
                  <td><span className="mb-st" style={{background:stc[0],color:stc[1]}}>{st}</span></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <a className="mb-act" href="교인 상세.html">{I.eye}</a>
                      <span className="mb-act">{I.edit}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {/* footer / pagination */}
        <div className="mb-foot">
          <div style={{fontSize:'12.5px',color:'#64748B',whiteSpace:'nowrap'}}>전체 <b style={{color:'#0E1729'}}>842</b>명 중 1–9 표시 · <b style={{color:'var(--cr-primary)'}}>1명</b> 선택됨</div>
          <div className="mb-pg">
            <span className="mb-pgb">{I.chevL}</span>
            <span className="mb-pgb on">1</span>
            <span className="mb-pgb">2</span>
            <span className="mb-pgb">3</span>
            <span className="mb-pgb">…</span>
            <span className="mb-pgb">94</span>
            <span className="mb-pgb">{I.chevR}</span>
          </div>
        </div>
      </div>)}
    </CShell>
  );
}

MembersScreen.cases = ['기본', '로딩', '빈 상태', '검색 결과 없음'];
window.MembersScreen = MembersScreen;
