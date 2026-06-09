// Church Round · Direction C — 보안 로그
// Canonical = SecurityLogs (+ Layout login-history modal). From code: stats
// (총 로그인·실패·의심·고유 사용자), login history table (시간·디바이스·IP·위치).
// Exports window.SecurityScreen

function SecurityScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const logs = [
    ['2026.06.03 09:12:04','이사랑 간사','desktop','Chrome · macOS','121.130.44.18','서울 마포구','정상'],
    ['2026.06.03 08:41:55','김은혜 목사','mobile','Safari · iOS','203.241.18.92','서울 강남구','정상'],
    ['2026.06.02 22:08:31','이사랑 간사','desktop','Chrome · Windows','121.130.44.18','서울 마포구','정상'],
    ['2026.06.02 14:55:10','—','desktop','Firefox · Linux','45.83.220.7','알 수 없음','실패'],
    ['2026.06.02 14:54:48','—','desktop','Firefox · Linux','45.83.220.7','알 수 없음','실패'],
    ['2026.06.01 19:30:22','김은혜 목사','mobile','Safari · iOS','203.241.18.92','서울 강남구','정상'],
  ];

  return (
    <CShell
      active="security"
      title="보안 로그"
      subtitle="최근 30일 로그인 활동"
      headerRight={<button className="cs-cta ghost">{I.download}내보내기</button>}
    >
      <style>{`
        .se-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
        .se-kpi{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);padding:16px 18px;display:flex;align-items:center;gap:13px;}
        .se-kpi .ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:0 0 38px;}
        .se-kpi .ic svg{width:18px;height:18px;}
        .se-kpi .l{font-size:12px;color:#64748B;font-weight:600;}
        .se-kpi .v{font-size:23px;font-weight:750;letter-spacing:-.02em;line-height:1.1;}
        .se-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);overflow:hidden;margin-bottom:16px;}
        .se-ch{padding:15px 18px;border-bottom:1px solid #EEF1F6;display:flex;align-items:center;justify-content:space-between;}
        .se-ct{font-size:14px;font-weight:700;}
        .se-scroll{overflow-x:auto;}
        .se-table{width:100%;min-width:820px;border-collapse:collapse;font-size:12.5px;}
        .se-table th{text-align:left;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;
          letter-spacing:.04em;padding:11px 18px;border-bottom:1px solid #EEF1F6;background:#FAFBFD;white-space:nowrap;}
        .se-table td{padding:12px 18px;border-bottom:1px solid #F1F4F9;color:#334155;white-space:nowrap;}
        .se-table tr:last-child td{border-bottom:none;}
        .se-table tbody tr:hover{background:#FAFBFD;}
        .se-time{font-family:ui-monospace,monospace;color:#475569;}
        .se-ip{font-family:ui-monospace,monospace;color:#64748B;}
        .se-dev{display:inline-flex;align-items:center;gap:6px;}
        .se-dev svg{width:13px;height:13px;color:#94A3B8;}
        .se-st{font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:999px;}
        .se-tip{background:#F0F6FF;border:1px solid #D6E6FE;border-radius:var(--cr-radius);padding:16px 18px;display:flex;gap:13px;}
        .se-tip .ic{width:34px;height:34px;border-radius:9px;background:#DBE8FF;color:#2563EB;display:flex;
          align-items:center;justify-content:center;flex:0 0 34px;}
        .se-tip .ic svg{width:17px;height:17px;}
        .se-tip .t{font-size:13px;font-weight:700;color:#1E3A8A;margin-bottom:4px;}
        .se-tip ul{margin:0;padding-left:16px;font-size:12.5px;color:#3B5BA5;line-height:1.7;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={6} /> :
       caseId === '빈 상태' ? <CEmpty icon={I.shield} title="기록된 로그인이 없습니다" desc="최근 30일 내 로그인 활동이 없습니다." /> :
      (<React.Fragment>
      <div className="se-kpis">
        {kpi(I.check,'오늘 로그인','14',C.st.success)}
        {kpi(I.x,'실패 로그인','2',C.st.danger)}
        {kpi(I.shield,'의심 활동','2',C.st.warning)}
        {kpi(I.users,'고유 사용자','5',['#EEF3FC','#1C7CFF'])}
      </div>

      <div className="se-card">
        <div className="se-ch"><div className="se-ct">로그인 기록</div><span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>최근 6건</span></div>
        <div className="se-scroll">
          <table className="se-table">
            <thead>
              <tr><th>접속 시간</th><th>사용자</th><th>디바이스</th><th>IP 주소</th><th>접속 위치</th><th>상태</th></tr>
            </thead>
            <tbody>
              {logs.map((l,i)=>{
                const [time,user,dev,devname,ip,loc,stat]=l;
                const ok = stat==='정상';
                return (
                  <tr key={i}>
                    <td className="se-time">{time}</td>
                    <td style={{fontWeight:600,color:user==='—'?'#94A3B8':'#0E1729'}}>{user}</td>
                    <td><span className="se-dev">{dev==='mobile'?I.phone:I.org}{devname}</span></td>
                    <td className="se-ip">{ip}</td>
                    <td style={{color:loc==='알 수 없음'?'#DC2626':'#64748B'}}>{loc}</td>
                    <td><span className="se-st" style={{background:ok?C.st.success[0]:C.st.danger[0],color:ok?C.st.success[1]:C.st.danger[1]}}>{stat}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="se-tip">
        <div className="ic">{I.shield}</div>
        <div>
          <div className="t">보안 팁</div>
          <ul>
            <li>익숙하지 않은 로그인 기록이 있다면 즉시 비밀번호를 변경하세요.</li>
            <li>공용 컴퓨터에서는 반드시 로그아웃해 주세요.</li>
          </ul>
        </div>
      </div>
      </React.Fragment>)}
    </CShell>
  );

  function kpi(icon,l,v,col){
    return <div className="se-kpi"><div className="ic" style={{background:col[0],color:col[1]}}>{icon}</div><div><div className="l">{l}</div><div className="v">{v}</div></div></div>;
  }
}

SecurityScreen.cases = ['기본', '빈 상태', '로딩'];
window.SecurityScreen = SecurityScreen;
