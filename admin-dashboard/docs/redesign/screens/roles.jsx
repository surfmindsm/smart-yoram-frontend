// Church Round · Direction C — 관리자 권한 관리
// Canonical = AdminRoleManagement. Roles: 슈퍼 관리자·교회 최고관리자·교회 관리자·
// 커뮤니티 관리자·일반 교인. User table: name/email, role badge, role change, 해제.
// Exports window.RolesScreen

function RolesScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const ROLE = {
    super:   ['슈퍼 관리자', ['#F0E6EF','#8A5A86']],
    csuper:  ['교회 최고관리자', C.st.info],
    cadmin:  ['교회 관리자', C.st.success],
    comm:    ['커뮤니티 관리자', C.st.warning],
    member:  ['일반 교인', C.st.neutral],
  };

  const users = [
    ['김','김은혜','office@grace.church','csuper','은혜로교회','2026.06.03 08:41'],
    ['이','이사랑','sarang@grace.church','cadmin','은혜로교회','2026.06.03 09:12'],
    ['박','박재정','finance@grace.church','cadmin','은혜로교회','2026.06.02 17:30'],
    ['최','최도서','library@grace.church','comm','은혜로교회','2026.05.30 21:05'],
    ['관','시스템 관리자','admin@churchround.io','super','—','2026.06.01 10:00'],
  ];

  return (
    <CShell
      active="settings"
      crumb="설정 / 관리자 권한"
      title="관리자 권한 관리"
      subtitle="관리자 5명 · 교회 관리자 2명"
      headerRight={<button className="cs-cta">{I.userplus}관리자 추가</button>}
    >
      <style>{`
        .rl-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);overflow:hidden;}
        .rl-filter{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #EEF1F6;}
        .rl-search{flex:1;max-width:300px;height:36px;border:1px solid #E3E8F0;border-radius:8px;display:flex;
          align-items:center;gap:8px;padding:0 12px;color:#94A3B8;font-size:13px;}
        .rl-search svg{width:15px;height:15px;}
        .rl-sel{height:36px;border:1px solid #E3E8F0;border-radius:8px;display:flex;align-items:center;gap:7px;
          padding:0 12px;font-size:12.5px;font-weight:500;color:#334155;white-space:nowrap;}
        .rl-sel svg{width:14px;height:14px;color:#94A3B8;}
        .rl-sel .v{color:#0E1729;font-weight:600;}
        .rl-scroll{overflow-x:auto;}
        .rl-table{width:100%;min-width:720px;border-collapse:collapse;font-size:13px;}
        .rl-table th{text-align:left;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;
          letter-spacing:.04em;padding:11px 18px;border-bottom:1px solid #EEF1F6;background:#FAFBFD;white-space:nowrap;}
        .rl-table td{padding:12px 18px;border-bottom:1px solid #F1F4F9;color:#334155;vertical-align:middle;}
        .rl-table tr:last-child td{border-bottom:none;}
        .rl-table tbody tr:hover{background:#FAFBFD;}
        .rl-u{display:flex;align-items:center;gap:11px;}
        .rl-av{width:34px;height:34px;border-radius:9px;background:#EEF3FC;color:var(--cr-primary);display:flex;
          align-items:center;justify-content:center;font-weight:700;font-size:13px;flex:0 0 34px;}
        .rl-nm{font-weight:600;color:#0E1729;}
        .rl-em{font-size:11.5px;color:#94A3B8;font-family:ui-monospace,monospace;}
        .rl-role{font-size:11px;font-weight:700;padding:3px 11px;border-radius:999px;white-space:nowrap;}
        .rl-time{font-size:12px;color:#64748B;white-space:nowrap;}
        .rl-act{display:flex;gap:6px;}
        .rl-b{height:30px;padding:0 11px;border-radius:7px;border:1px solid #E3E8F0;display:inline-flex;align-items:center;
          gap:5px;color:#475569;background:#fff;font-size:12px;font-weight:600;white-space:nowrap;}
        .rl-b svg{width:13px;height:13px;color:#94A3B8;}
        .rl-b.danger{color:#DC2626;border-color:#F6D2D2;}
        .rl-b.danger svg{color:#DC2626;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={5} /> :
      (<React.Fragment>
      <div className="rl-card">
        <div className="rl-filter">
          <div className="rl-search">{I.search}<span>이름, 이메일로 검색</span></div>
          <div style={{flex:1}}></div>
          <CDropdown cls="rl-sel" label="역할" value="전체" options={['전체','슈퍼 관리자','교회 최고관리자','교회 관리자','커뮤니티 관리자','일반 교인']} align="right" />
        </div>
        <div className="rl-scroll">
          <table className="rl-table">
            <thead>
              <tr><th>사용자</th><th>역할</th><th>소속</th><th>최근 접속</th><th style={{width:'180px'}}>작업</th></tr>
            </thead>
            <tbody>
              {users.map((u,i)=>{
                const [ini,name,email,role,church,last]=u;
                const [rl,rc]=ROLE[role];
                return (
                  <tr key={i}>
                    <td>
                      <div className="rl-u">
                        <div className="rl-av">{ini}</div>
                        <div><div className="rl-nm">{name}</div><div className="rl-em">{email}</div></div>
                      </div>
                    </td>
                    <td><span className="rl-role" style={{background:rc[0],color:rc[1]}}>{rl}</span></td>
                    <td style={{fontSize:'12.5px',color:'#64748B',whiteSpace:'nowrap'}}>{church}</td>
                    <td className="rl-time">{last}</td>
                    <td>
                      <div className="rl-act">
                        <span className="rl-b">{I.edit}역할 변경</span>
                        {role!=='super' && <span className="rl-b danger">{I.x}해제</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </React.Fragment>)}
    </CShell>
  );
}

RolesScreen.cases = ['기본', '로딩'];
window.RolesScreen = RolesScreen;
