// Church Round · Direction C — 헌금 관리
// Canonical = DonationManagement. From code: tabs 헌금 내역 / 영수증,
// FUND_TYPES(십일조·주일헌금·감사헌금·건축헌금·선교헌금...), columns
// 날짜·기부자·종류·금액·비고·작업, stats 이번 달 총액/평균, bulk + receipt.
// Exports window.DonationsScreen

function DonationsScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const FUND = {
    십일조:  ['#EAF1FE','#2563EB'],
    주일헌금:['#F1F4F9','#475569'],
    감사헌금:['#E7F6EC','#16A34A'],
    선교헌금:['#F0E6EF','#8A5A86'],
    건축헌금:['#FBF1E3','#B45309'],
  };

  const breakdown = [
    ['십일조', 7200000, 58, '#2563EB'],
    ['주일헌금', 2400000, 19, '#64748B'],
    ['감사헌금', 1350000, 11, '#16A34A'],
    ['선교헌금', 880000, 7, '#8A5A86'],
    ['건축헌금', 650000, 5, '#B45309'],
  ];

  const rows = [
    ['2026.06.01','김성호','십일조',500000,''],
    ['2026.06.01','이순영','주일헌금',50000,''],
    ['2026.06.01','무명','감사헌금',100000,'자녀 결혼 감사'],
    ['2026.05.31','박지훈','십일조',200000,''],
    ['2026.05.31','최민준','선교헌금',100000,'단기선교 후원'],
    ['2026.05.30','윤서연','주일헌금',30000,''],
    ['2026.05.29','강도현','건축헌금',300000,''],
    ['2026.05.29','정해성','십일조',450000,''],
  ];
  const won = (n)=> n.toLocaleString('ko-KR');

  return (
    <CShell
      active="donations"
      title="헌금 관리"
      subtitle="2026년 6월 · 은혜로교회 재정"
      segment={[{label:'헌금 내역',on:true},{label:'기부금 영수증'}]}
      headerRight={<>
        <button className="cs-cta ghost" style={{marginRight:8}}>{I.excel}엑셀</button>
        <button className="cs-cta ghost" style={{marginRight:8}}>{I.upload}일괄 입력</button>
        <button className="cs-cta">{I.plus}헌금 입력</button>
      </>}
    >
      <style>{`
        .dn-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
        .dn-kpi{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);padding:16px 18px;}
        .dn-kpi .l{font-size:12px;color:#64748B;font-weight:600;}
        .dn-kpi .v{font-size:24px;font-weight:750;letter-spacing:-.02em;margin-top:8px;line-height:1;white-space:nowrap;}
        .dn-kpi .v small{font-size:13px;font-weight:600;color:#94A3B8;margin-left:2px;}
        .dn-kpi .d{font-size:11.5px;font-weight:600;margin-top:8px;color:#16A34A;display:flex;align-items:center;gap:4px;}
        .dn-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:16px;margin-bottom:16px;align-items:start;}
        .dn-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);overflow:hidden;}
        .dn-ch{padding:15px 18px;border-bottom:1px solid #EEF1F6;display:flex;align-items:center;justify-content:space-between;}
        .dn-ct{font-size:14px;font-weight:700;letter-spacing:-.01em;}
        .dn-cp{padding:18px;}
        .dn-bar{display:flex;height:14px;border-radius:7px;overflow:hidden;margin-bottom:18px;}
        .dn-bar span{height:100%;}
        .dn-leg{display:flex;flex-direction:column;gap:11px;}
        .dn-lr{display:flex;align-items:center;gap:10px;font-size:13px;}
        .dn-dot{width:10px;height:10px;border-radius:3px;flex:0 0 10px;}
        .dn-lr .nm{font-weight:600;color:#334155;}
        .dn-lr .pct{color:#94A3B8;font-size:12px;}
        .dn-lr .amt{margin-left:auto;font-weight:700;color:#0E1729;white-space:nowrap;}
        .dn-filter{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #EEF1F6;}
        .dn-search{flex:1;max-width:280px;height:36px;border:1px solid #E3E8F0;border-radius:8px;display:flex;
          align-items:center;gap:8px;padding:0 12px;color:#94A3B8;font-size:13px;}
        .dn-search svg{width:15px;height:15px;}
        .dn-sel{height:36px;border:1px solid #E3E8F0;border-radius:8px;display:flex;align-items:center;gap:7px;
          padding:0 12px;font-size:12.5px;font-weight:500;color:#334155;white-space:nowrap;}
        .dn-sel svg{width:14px;height:14px;color:#94A3B8;}
        .dn-sel .v{color:#0E1729;font-weight:600;}
        .dn-scroll{overflow-x:auto;}
        .dn-table{width:100%;min-width:760px;border-collapse:collapse;font-size:13px;}
        .dn-table th{text-align:left;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;
          letter-spacing:.04em;padding:11px 18px;border-bottom:1px solid #EEF1F6;background:#FAFBFD;white-space:nowrap;}
        .dn-table th.r,.dn-table td.r{text-align:right;}
        .dn-table td{padding:12px 18px;border-bottom:1px solid #F1F4F9;color:#334155;vertical-align:middle;}
        .dn-table tr:last-child td{border-bottom:none;}
        .dn-table tbody tr:hover{background:#FAFBFD;}
        .dn-fund{font-size:11.5px;font-weight:700;padding:2px 9px;border-radius:6px;white-space:nowrap;}
        .dn-amt{font-weight:750;color:#0E1729;font-variant-numeric:tabular-nums;}
        .dn-amt small{font-weight:600;color:#94A3B8;font-size:11px;margin-left:1px;}
        .dn-donor{font-weight:600;color:#0E1729;}
        .dn-act{width:30px;height:30px;border-radius:7px;border:1px solid #E3E8F0;display:inline-flex;
          align-items:center;justify-content:center;color:#64748B;background:#fff;}
        .dn-act svg{width:15px;height:15px;}
        .dn-foot{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-top:1px solid #EEF1F6;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={6} /> :
       caseId === '빈 상태' ? <CEmpty icon={I.won} title="등록된 헌금 내역이 없습니다" desc="헌금을 입력하면 통계와 내역이 여기에 표시됩니다." cta="헌금 입력" /> :
      (<React.Fragment>
      <div className="dn-kpis">
        {kpi('이번 달 총액','12,480,000','원','+4.2% 전월 대비',true)}
        {kpi('헌금 건수','248','건',null)}
        {kpi('헌금자 수','186','명',null)}
        {kpi('평균 헌금','50,300','원',null)}
      </div>

      <div className="dn-grid">
        <div className="dn-card">
          <div className="dn-ch"><div className="dn-ct">헌금 종류별 분포</div><span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>6월 누계 12,480,000원</span></div>
          <div className="dn-cp">
            <div className="dn-bar">{breakdown.map((b,i)=><span key={i} style={{width:b[2]+'%',background:b[3]}}></span>)}</div>
            <div className="dn-leg">
              {breakdown.map((b,i)=>(
                <div key={i} className="dn-lr">
                  <span className="dn-dot" style={{background:b[3]}}></span>
                  <span className="nm">{b[0]}</span><span className="pct">{b[2]}%</span>
                  <span className="amt">{won(b[1])}원</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dn-card">
          <div className="dn-ch"><div className="dn-ct">주간 추이</div><span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>최근 8주</span></div>
          <div className="dn-cp">{weekChart()}</div>
        </div>
      </div>

      <div className="dn-card">
        <div className="dn-filter">
          <div className="dn-search">{I.search}<span>기부자, 종류 검색</span></div>
          <div style={{flex:1}}></div>
          <CDropdown cls="dn-sel" label="기간" value="2026.06" options={['2026.06','2026.05','2026.04','2026 전체']} />
          <CDropdown cls="dn-sel" label="종류" value="전체" options={['전체','십일조','주일헌금','감사헌금','선교헌금','건축헌금']} align="right" />
        </div>
        <div className="dn-scroll">
          <table className="dn-table">
            <thead>
              <tr><th>날짜</th><th>기부자</th><th>종류</th><th className="r">금액</th><th>비고</th><th style={{width:'80px'}}>작업</th></tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>{
                const [date,donor,fund,amt,note]=r;
                const fc=FUND[fund];
                return (
                  <tr key={i}>
                    <td style={{color:'#64748B',whiteSpace:'nowrap'}}>{date}</td>
                    <td><span className="dn-donor">{donor}</span></td>
                    <td><span className="dn-fund" style={{background:fc[0],color:fc[1]}}>{fund}</span></td>
                    <td className="r"><span className="dn-amt">{won(amt)}<small>원</small></span></td>
                    <td style={{color:'#94A3B8',fontSize:'12.5px'}}>{note||'—'}</td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <span className="dn-act" title="영수증">{I.file}</span>
                        <span className="dn-act" title="수정">{I.edit}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="dn-foot">
          <div style={{fontSize:'12.5px',color:'#64748B',whiteSpace:'nowrap'}}>이번 달 <b style={{color:'#0E1729'}}>248</b>건 · 합계 <b style={{color:'var(--cr-primary)'}}>12,480,000원</b></div>
          <div style={{display:'flex',gap:4}}>
            <span className="dn-act" style={{width:'auto',padding:'0 10px'}}>{I.chevL}</span>
            <span className="dn-act" style={{width:'auto',padding:'0 11px',background:'var(--cr-primary)',color:'#fff',borderColor:'var(--cr-primary)',fontSize:'12.5px',fontWeight:700}}>1</span>
            <span className="dn-act" style={{width:'auto',padding:'0 11px',fontSize:'12.5px',fontWeight:700}}>2</span>
            <span className="dn-act" style={{width:'auto',padding:'0 11px',fontSize:'12.5px',fontWeight:700}}>3</span>
            <span className="dn-act" style={{width:'auto',padding:'0 10px'}}>{I.chevR}</span>
          </div>
        </div>
      </div>
      </React.Fragment>)}
    </CShell>
  );

  function kpi(l,v,u,d,up){
    return <div className="dn-kpi">
      <div className="l">{l}</div>
      <div className="v">{v}<small>{u}</small></div>
      {d && <div className="d">{I.tup}{d}</div>}
    </div>;
  }
  function weekChart(){
    const data=[6.8,7.2,6.5,8.1,7.6,9.2,8.4,12.5];
    const max=14,W=380,H=150,pad=8;const bw=(W-pad*2)/data.length;
    return <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'150px'}}>
      {[0,1,2,3].map(i=><line key={i} x1="0" x2={W} y1={H/3*i} y2={H/3*i} stroke="#F1F4F9" strokeWidth="1"/>)}
      {data.map((v,i)=><rect key={i} x={pad+bw*i+6} y={H-(v/max*H)} width={bw-12} height={v/max*H} rx="4"
        fill={i===data.length-1?'var(--cr-primary)':'#DBE8FF'}/>)}
    </svg>;
  }
}

DonationsScreen.cases = ['기본', '빈 상태', '로딩'];
window.DonationsScreen = DonationsScreen;
