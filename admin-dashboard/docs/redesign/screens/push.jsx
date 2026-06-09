// Church Round · Direction C — 푸시 알림
// Canonical = PushNotifications. From code: target(전체/그룹/개인), type
// (공지사항·예배 알림·행사 안내·긴급), title, body, image/link, schedule(즉시/예약),
// history(제목·대상·발송/도달/읽음·상태). + live preview.
// Exports window.PushScreen

function PushScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const history = [
    ['맥추감사주일 안내','공지사항','전체','842','—','success'],
    ['수요예배 30분 전입니다','예배 알림','전체','842','798','success'],
    ['새가족 환영회 안내','행사 안내','그룹 · 새가족','7','7','success'],
    ['주차장 임시 폐쇄 안내','긴급','전체','842','120','partial'],
  ];
  const ST = { success:['발송 완료',C.st.success], partial:['일부 실패',C.st.warning], failed:['실패',C.st.danger] };

  return (
    <CShell
      active="push"
      title="푸시 알림"
      subtitle="교인 앱으로 알림을 발송합니다"
      segment={[{label:'알림 작성',on:true},{label:'발송 기록'}]}
    >
      <style>{`
        .pu-grid{display:grid;grid-template-columns:1.15fr 0.85fr;gap:16px;align-items:start;margin-bottom:16px;}
        .pu-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);overflow:hidden;}
        .pu-ch{padding:15px 18px;border-bottom:1px solid #EEF1F6;}
        .pu-ct{font-size:14px;font-weight:700;}
        .pu-cp{padding:18px;}
        .pu-k{font-size:12px;font-weight:600;color:#475569;margin-bottom:7px;display:block;}
        .pu-targets{display:flex;gap:8px;margin-bottom:16px;}
        .pu-t{flex:1;height:40px;border:1px solid #E3E8F0;border-radius:9px;display:flex;align-items:center;
          justify-content:center;gap:7px;font-size:13px;font-weight:600;color:#475569;}
        .pu-t svg{width:15px;height:15px;color:#94A3B8;}
        .pu-t.on{background:#EEF3FC;border-color:#BBD4FB;color:var(--cr-primary);}
        .pu-t.on svg{color:var(--cr-primary);}
        .pu-in{height:40px;border:1px solid #E3E8F0;border-radius:8px;display:flex;align-items:center;
          justify-content:space-between;padding:0 13px;font-size:13px;color:#0E1729;margin-bottom:16px;}
        .pu-in svg{width:14px;height:14px;color:#94A3B8;}
        .pu-ta{min-height:96px;border:1px solid #E3E8F0;border-radius:8px;padding:11px 13px;font-size:13px;
          color:#334155;line-height:1.6;margin-bottom:16px;}
        .pu-sched{display:flex;gap:8px;}
        .pu-s{flex:1;height:38px;border:1px solid #E3E8F0;border-radius:8px;display:flex;align-items:center;
          justify-content:center;gap:6px;font-size:12.5px;font-weight:600;color:#475569;}
        .pu-s.on{background:var(--cr-primary);color:#fff;border-color:var(--cr-primary);}
        .pu-s svg{width:14px;height:14px;}
        /* preview */
        .pu-prev{background:linear-gradient(160deg,#1B2740,#0E1729);padding:24px;display:flex;flex-direction:column;
          align-items:center;gap:14px;min-height:280px;justify-content:center;}
        .pu-plabel{font-size:11px;color:#9DB0CC;font-weight:600;}
        .pu-noti{width:100%;max-width:300px;background:rgba(255,255,255,.97);border-radius:16px;padding:13px 14px;
          box-shadow:0 12px 30px -8px rgba(0,0,0,.5);}
        .pu-nhead{display:flex;align-items:center;gap:8px;margin-bottom:7px;}
        .pu-nico{width:22px;height:22px;border-radius:6px;background:var(--cr-primary);color:#fff;display:flex;
          align-items:center;justify-content:center;flex:0 0 22px;}
        .pu-nico svg{width:13px;height:13px;}
        .pu-napp{font-size:11px;font-weight:700;color:#475569;}
        .pu-ntime{font-size:10.5px;color:#94A3B8;margin-left:auto;}
        .pu-ntitle{font-size:13.5px;font-weight:700;color:#0E1729;margin-bottom:3px;}
        .pu-nbody{font-size:12px;color:#475569;line-height:1.5;}
        .pu-send{width:100%;height:44px;border-radius:10px;background:var(--cr-primary);color:#fff;font-size:14px;
          font-weight:700;border:none;display:flex;align-items:center;justify-content:center;gap:8px;}
        .pu-send svg{width:17px;height:17px;}
        .pu-scroll{overflow-x:auto;}
        .pu-table{width:100%;min-width:720px;border-collapse:collapse;font-size:12.5px;}
        .pu-table th{text-align:left;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;
          letter-spacing:.04em;padding:11px 18px;border-bottom:1px solid #EEF1F6;background:#FAFBFD;white-space:nowrap;}
        .pu-table th.r,.pu-table td.r{text-align:right;}
        .pu-table td{padding:12px 18px;border-bottom:1px solid #F1F4F9;color:#334155;white-space:nowrap;}
        .pu-table tr:last-child td{border-bottom:none;}
        .pu-tt{font-weight:600;color:#0E1729;}
        .pu-ty{font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;background:#EAF1FE;color:#2563EB;}
        .pu-st{font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:999px;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={5} /> :
      (<React.Fragment>
      <div className="pu-grid">
        <div className="pu-card">
          <div className="pu-ch"><div className="pu-ct">알림 작성</div></div>
          <div className="pu-cp">
            <label className="pu-k">발송 대상</label>
            <div className="pu-targets">
              <span className="pu-t on">{I.users}전체</span>
              <span className="pu-t">{I.org}그룹</span>
              <span className="pu-t">{I.userplus}개인</span>
            </div>
            <label className="pu-k">알림 유형</label>
            <div className="pu-in">공지사항{I.chevD}</div>
            <label className="pu-k">제목</label>
            <div className="pu-in" style={{color:'#0E1729'}}>맥추감사주일 안내</div>
            <label className="pu-k">내용</label>
            <div className="pu-ta">7월 6일 주일은 맥추감사주일입니다. 감사의 예물을 준비해 주시고 함께 예배드려요. 🙏</div>
            <label className="pu-k">발송 시점</label>
            <div className="pu-sched">
              <span className="pu-s on">{I.send}즉시 발송</span>
              <span className="pu-s">{I.clock}예약 발송</span>
            </div>
          </div>
        </div>

        <div className="pu-card">
          <div className="pu-ch"><div className="pu-ct">미리보기</div></div>
          <div className="pu-prev">
            <span className="pu-plabel">교인 앱 알림 미리보기</span>
            <div className="pu-noti">
              <div className="pu-nhead">
                <span className="pu-nico"><span className="c" style={{fontFamily:"'Newsreader',serif",fontStyle:'italic'}}>c</span></span>
                <span className="pu-napp">Church Round · 은혜로교회</span>
                <span className="pu-ntime">지금</span>
              </div>
              <div className="pu-ntitle">맥추감사주일 안내</div>
              <div className="pu-nbody">7월 6일 주일은 맥추감사주일입니다. 감사의 예물을 준비해 주시고 함께 예배드려요. 🙏</div>
            </div>
            <button className="pu-send">{I.send}842명에게 발송</button>
          </div>
        </div>
      </div>

      <div className="pu-card">
        <div className="pu-ch"><div className="pu-ct">최근 발송 기록</div></div>
        <div className="pu-scroll">
          <table className="pu-table">
            <thead><tr><th>제목</th><th>유형</th><th>대상</th><th className="r">발송</th><th className="r">읽음</th><th>상태</th></tr></thead>
            <tbody>
              {history.map((h,i)=>{
                const [title,type,tgt,sent,read,stat]=h;
                const [sl,sc]=ST[stat];
                return (
                  <tr key={i}>
                    <td className="pu-tt">{title}</td>
                    <td><span className="pu-ty">{type}</span></td>
                    <td style={{color:'#64748B'}}>{tgt}</td>
                    <td className="r" style={{fontWeight:700}}>{sent}</td>
                    <td className="r" style={{color:'#64748B'}}>{read}</td>
                    <td><span className="pu-st" style={{background:sc[0],color:sc[1]}}>{sl}</span></td>
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

PushScreen.cases = ['기본', '로딩'];
window.PushScreen = PushScreen;
