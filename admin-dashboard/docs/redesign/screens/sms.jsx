// Church Round · Direction C — SMS 발송
// Canonical = SMSManagement. From code: recipient member select, template,
// message type, message text (/1000자), send-bulk to N, history table
// (발송일시·수신자·내용·상태 발송완료/실패/대기). Tabs: 발송 / 발송 기록.
// Exports window.SmsScreen

function SmsScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const groups = [['전체 교인','842'],['1구역','164'],['청년부','88'],['찬양팀','24'],['새가족','7']];
  const members = [
    ['김','김성호','목사','010-2841-3920',true],
    ['이','이순영','권사','010-5520-1184',true],
    ['박','박지훈','성도','010-9931-2207',false],
    ['최','최민준','집사','010-3372-8810',true],
    ['윤','윤서연','성도','010-7740-5562',false],
    ['강','강도현','성도','010-6604-1175',false],
  ];

  return (
    <CShell
      active="sms"
      title="SMS 발송"
      subtitle="잔여 발송 건수 2,480건"
      segment={[{label:'메시지 작성',on:true},{label:'발송 기록'}]}
    >
      <style>{`
        .sm-grid{display:grid;grid-template-columns:1fr 1.15fr;gap:16px;align-items:start;}
        .sm-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);overflow:hidden;}
        .sm-ch{padding:14px 18px;border-bottom:1px solid #EEF1F6;display:flex;align-items:center;justify-content:space-between;}
        .sm-ct{font-size:14px;font-weight:700;white-space:nowrap;}
        .sm-ct small{color:#94A3B8;font-weight:600;font-size:12px;margin-left:6px;}
        .sm-cp{padding:16px 18px;}
        .sm-groups{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}
        .sm-g{height:32px;padding:0 12px;border-radius:999px;border:1px solid #E3E8F0;background:#fff;display:flex;
          align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:#475569;white-space:nowrap;}
        .sm-g.on{background:#EEF3FC;border-color:#BBD4FB;color:var(--cr-primary);}
        .sm-g .n{font-size:11px;color:#94A3B8;font-weight:700;}
        .sm-g.on .n{color:var(--cr-primary);}
        .sm-mi{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid #F1F4F9;}
        .sm-mi:last-child{border-bottom:none;}
        .sm-cb{width:17px;height:17px;border-radius:5px;border:2px solid #CBD5E1;flex:0 0 17px;}
        .sm-cb.on{background:var(--cr-primary);border-color:var(--cr-primary);display:flex;align-items:center;justify-content:center;}
        .sm-cb.on svg{width:11px;height:11px;color:#fff;}
        .sm-av{width:32px;height:32px;border-radius:8px;background:#EEF3FC;color:var(--cr-primary);display:flex;
          align-items:center;justify-content:center;font-weight:700;font-size:12px;flex:0 0 32px;}
        .sm-nm{font-size:13px;font-weight:600;}
        .sm-ph{font-size:11.5px;color:#94A3B8;font-family:ui-monospace,monospace;}
        .sm-pos{font-size:11px;font-weight:700;color:#475569;background:#F1F4F9;padding:2px 8px;border-radius:6px;margin-left:auto;}
        .sm-row{display:flex;gap:8px;margin-bottom:14px;}
        .sm-sel{flex:1;height:38px;border:1px solid #E3E8F0;border-radius:8px;display:flex;align-items:center;
          justify-content:space-between;padding:0 12px;font-size:12.5px;color:#334155;font-weight:500;}
        .sm-sel svg{width:14px;height:14px;color:#94A3B8;}
        .sm-ta{border:1px solid #E3E8F0;border-radius:10px;padding:13px;min-height:150px;font-size:13.5px;color:#0E1729;line-height:1.6;}
        .sm-count{display:flex;justify-content:space-between;font-size:11.5px;color:#94A3B8;margin-top:7px;}
        .sm-summary{background:#F6F8FB;border-radius:10px;padding:13px 15px;margin-top:14px;display:flex;
          align-items:center;justify-content:space-between;}
        .sm-summary .l{font-size:12px;color:#64748B;}
        .sm-summary .v{font-size:13px;font-weight:700;color:#0E1729;}
        .sm-send{margin-top:14px;width:100%;height:44px;border-radius:10px;background:var(--cr-primary);color:#fff;
          font-size:14px;font-weight:700;border:none;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;}
        .sm-send svg{width:17px;height:17px;}
      `}</style>

      {caseId === '발송 기록' ? (
        <div className="sm-card">
          <div className="sm-ch"><div className="sm-ct">발송 기록</div></div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',minWidth:'640px',borderCollapse:'collapse',fontSize:'12.5px'}}>
              <thead><tr>{['발송일시','수신','내용','상태'].map((h,i)=><th key={i} style={{textAlign:'left',fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.04em',padding:'11px 18px',borderBottom:'1px solid #EEF1F6',background:'#FAFBFD',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
              <tbody>
                {[['2026.06.01 09:10','842명','맥추감사주일 안내드립니다…','완료',C.st.success],['2026.05.29 19:00','842명','수요예배 30분 전입니다.','완료',C.st.success],['2026.05.28 10:00','7명','새가족 환영회 안내','완료',C.st.success],['2026.05.25 14:30','164명','1구역 구역예배 안내','일부 실패',C.st.warning]].map((r,i)=>(
                  <tr key={i}><td style={{padding:'12px 18px',borderBottom:'1px solid #F1F4F9',fontFamily:'ui-monospace,monospace',color:'#475569',whiteSpace:'nowrap'}}>{r[0]}</td><td style={{padding:'12px 18px',borderBottom:'1px solid #F1F4F9',fontWeight:600,whiteSpace:'nowrap'}}>{r[1]}</td><td style={{padding:'12px 18px',borderBottom:'1px solid #F1F4F9',color:'#475569',maxWidth:'320px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r[2]}</td><td style={{padding:'12px 18px',borderBottom:'1px solid #F1F4F9'}}><span style={{fontSize:'10.5px',fontWeight:700,padding:'2px 9px',borderRadius:'999px',whiteSpace:'nowrap',background:r[4][0],color:r[4][1]}}>{r[3]}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
      <div className="sm-grid">
        {/* recipients */}
        <div className="sm-card">
          <div className="sm-ch"><div className="sm-ct">수신자<small>3명 선택됨</small></div><span style={{fontSize:'12px',color:'var(--cr-primary)',fontWeight:600}}>전체 선택</span></div>
          <div className="sm-cp">
            <div className="sm-groups">
              {groups.map((g,i)=><span key={i} className={'sm-g'+(i===0?' on':'')}>{g[0]}<span className="n">{g[1]}</span></span>)}
            </div>
            {members.map((m,i)=>{
              const [ini,name,pos,phone,on]=m;
              return (
                <div key={i} className="sm-mi">
                  <CCheck cls="sm-cb" checked={on} />
                  <span className="sm-av">{ini}</span>
                  <div><div className="sm-nm">{name}</div><div className="sm-ph">{phone}</div></div>
                  <span className="sm-pos">{pos}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* compose */}
        <div className="sm-card">
          <div className="sm-ch"><div className="sm-ct">메시지 작성</div></div>
          <div className="sm-cp">
            <div className="sm-row">
              <CDropdown cls="sm-sel" value="템플릿 선택" options={['직접 작성','맥추감사 안내','수요예배 안내','새가족 환영','심방 안내']} block />
              <CDropdown cls="sm-sel" label="유형 ·" value="일반" options={['일반','광고','정보']} block />
            </div>
            <div className="sm-ta">[은혜로교회] 사랑하는 성도님, 이번 주일 맥추감사주일 예배에 함께해 주시기 바랍니다. 감사의 마음을 담아 정성껏 준비해 주세요. 🙏</div>
            <div className="sm-count"><span>SMS · 한글 45자</span><span>78 / 1,000자</span></div>
            <div className="sm-summary">
              <div><span className="l">수신 </span><span className="v">3명</span><span className="l"> · 예상 차감 </span><span className="v">3건</span></div>
              <div><span className="l">잔여 </span><span className="v">2,480건</span></div>
            </div>
            <button className="sm-send">{I.send}3명에게 SMS 발송</button>
          </div>
        </div>
      </div>)}
    </CShell>
  );
}

SmsScreen.cases = ['메시지 작성', '발송 기록'];
window.SmsScreen = SmsScreen;
