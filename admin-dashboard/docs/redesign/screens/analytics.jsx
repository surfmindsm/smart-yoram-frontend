// Church Round · Direction C — 통계 분석
// Canonical = AnalyticsDashboard. Deep analytics: KPI row, attendance trend,
// gender donut, age bars, zone distribution, member-growth composed chart.
// Exports window.AnalyticsScreen

function AnalyticsScreen({ caseId }) {
  const I = window.ICONS, C = window.C;
  const blue = C.blue;

  return (
    <CShell
      active="analytics"
      title="통계 분석"
      subtitle="2026년 6월 · 은혜로교회 데이터 인사이트"
      segment={[{label:'주간'},{label:'월간',on:true},{label:'연간'}]}
      headerRight={<button className="cs-cta ghost">{I.download}리포트</button>}
    >
      <style>{`
        .ay-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
        .ay-kpi{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);padding:16px 18px;}
        .ay-kpi .l{font-size:12px;color:#64748B;font-weight:600;}
        .ay-kpi .v{font-size:26px;font-weight:750;letter-spacing:-.02em;margin-top:8px;line-height:1;white-space:nowrap;}
        .ay-kpi .v small{font-size:13px;font-weight:600;color:#94A3B8;}
        .ay-kpi .d{font-size:11.5px;font-weight:600;margin-top:8px;display:flex;align-items:center;gap:4px;}
        .ay-up{color:#16A34A;} .ay-dn{color:#DC2626;}
        .ay-grid{display:grid;gap:14px;margin-bottom:14px;}
        .ay-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);}
        .ay-ch{padding:15px 18px;border-bottom:1px solid #EEF1F6;display:flex;align-items:center;justify-content:space-between;}
        .ay-ct{font-size:14px;font-weight:700;letter-spacing:-.01em;}
        .ay-cs{font-size:12px;color:#94A3B8;font-weight:600;}
        .ay-cp{padding:18px;}
        .ay-legend{display:flex;gap:13px;font-size:11.5px;color:#64748B;}
        .ay-dot{width:8px;height:8px;border-radius:2.5px;display:inline-block;margin-right:5px;}
        .ay-bars{display:flex;flex-direction:column;gap:10px;}
        .ay-br{display:flex;align-items:center;gap:12px;}
        .ay-br .lab{width:48px;font-size:12px;color:#64748B;font-weight:500;}
        .ay-br .track{flex:1;height:11px;background:#F1F4F9;border-radius:6px;overflow:hidden;}
        .ay-br .fill{height:100%;border-radius:6px;}
        .ay-br .val{width:42px;text-align:right;font-size:12px;font-weight:700;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={6} /> :
       caseId === '데이터 없음' ? <CEmpty icon={I.chart} title="표시할 통계가 없습니다" desc="교인·출석 데이터가 쌓이면 분석 결과가 표시됩니다." /> :
      (<React.Fragment>
      <div className="ay-kpis">
        {kpi('총 교인','842','명','+7 이번 달','up')}
        {kpi('평균 출석률','73','%','+2.4%p','up')}
        {kpi('이번 달 새가족','7','명','+2','up')}
        {kpi('정착률','88','%','-1.2%p','dn')}
      </div>

      <div className="ay-grid" style={{gridTemplateColumns:'1.6fr 1fr'}}>
        <div className="ay-card">
          <div className="ay-ch">
            <div><div className="ay-ct">출석 추이</div><div className="ay-cs">최근 12주 · 주일 1·2부 합산</div></div>
            <div className="ay-legend"><span><span className="ay-dot" style={{background:blue}}></span>출석</span><span><span className="ay-dot" style={{background:'#CBD5E1'}}></span>등록 교인</span></div>
          </div>
          <div className="ay-cp">{lineChart(blue)}</div>
        </div>
        <div className="ay-card">
          <div className="ay-ch"><div className="ay-ct">성별 분포</div></div>
          <div className="ay-cp">{donut(blue)}</div>
        </div>
      </div>

      <div className="ay-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div className="ay-card">
          <div className="ay-ch"><div className="ay-ct">연령 분포</div><div className="ay-cs">전체 842명</div></div>
          <div className="ay-cp">
            <div className="ay-bars">
              {[['10대',8,'#BFDBFE'],['20대',14,'#93C5FD'],['30대',19,'#60A5FA'],['40대',24,blue],['50대',18,'#1D6FE0'],['60대+',17,'#1A56B0']].map((b,i)=>(
                <div key={i} className="ay-br"><span className="lab">{b[0]}</span><div className="track"><div className="fill" style={{width:(b[1]/24*100)+'%',background:b[2]}}></div></div><span className="val">{b[1]}%</span></div>
              ))}
            </div>
          </div>
        </div>
        <div className="ay-card">
          <div className="ay-ch"><div className="ay-ct">구역별 인원</div><div className="ay-cs">상위 6개 구역</div></div>
          <div className="ay-cp">
            <div className="ay-bars">
              {[['1구역',164],['2구역',138],['3구역',118],['4구역',96],['5구역',88],['6구역',72]].map((b,i)=>(
                <div key={i} className="ay-br"><span className="lab">{b[0]}</span><div className="track"><div className="fill" style={{width:(b[1]/164*100)+'%',background:blue,opacity:.4+i*0.1}}></div></div><span className="val">{b[1]}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ay-card">
        <div className="ay-ch"><div className="ay-ct">교인 증가 추이</div><div className="ay-cs">최근 12개월 · 신규 + 누적</div></div>
        <div className="ay-cp">{growthChart(blue)}</div>
      </div>
      </React.Fragment>)}
    </CShell>
  );

  function kpi(l,v,u,d,dir){
    return <div className="ay-kpi"><div className="l">{l}</div><div className="v">{v}<small>{u}</small></div>
      <div className={'d '+(dir==='up'?'ay-up':'ay-dn')}>{I.tup}{d}</div></div>;
  }
  function lineChart(c){
    const att=[58,62,55,68,64,71,67,73,70,74,72,76];
    const W=560,H=200,pad=10;const step=(W-pad*2)/(att.length-1);
    const pts=att.map((v,i)=>`${pad+step*i},${H-(v/90*H)}`).join(' ');
    const area=`${pad},${H} `+pts+` ${pad+step*(att.length-1)},${H}`;
    return <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'200px'}}>
      {[0,1,2,3].map(i=><line key={i} x1="0" x2={W} y1={H/3*i} y2={H/3*i} stroke="#F1F4F9" strokeWidth="1"/>)}
      <polygon points={area} fill={c} opacity="0.08"/>
      <polyline points={pts} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {att.map((v,i)=><circle key={i} cx={pad+step*i} cy={H-(v/90*H)} r="3" fill="#fff" stroke={c} strokeWidth="2"/>)}
    </svg>;
  }
  function donut(c){
    const r=52,cx=80,cy=80,circ=2*Math.PI*r;const male=0.54;
    return <div style={{display:'flex',alignItems:'center',gap:'18px'}}>
      <svg viewBox="0 0 160 160" style={{width:'150px',height:'150px'}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth="18"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth="18" strokeDasharray={`${circ*male} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`}/>
        <text x={cx} y={cy-3} textAnchor="middle" fontSize="26" fontWeight="750" fill="#0E1729">842</text>
        <text x={cx} y={cy+16} textAnchor="middle" fontSize="11" fill="#94A3B8">전체</text>
      </svg>
      <div style={{flex:1}}>
        <div style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid #F1F4F9',fontSize:'13px',whiteSpace:'nowrap',gap:'8px'}}><span style={{fontWeight:500,color:'#475569'}}><span className="ay-dot" style={{background:c}}></span>남성</span><span><b>455</b> <span style={{color:'#94A3B8',fontSize:'12px'}}>54%</span></span></div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'9px 0',fontSize:'13px',whiteSpace:'nowrap',gap:'8px'}}><span style={{fontWeight:500,color:'#475569'}}><span className="ay-dot" style={{background:'#CBD5E1'}}></span>여성</span><span><b>387</b> <span style={{color:'#94A3B8',fontSize:'12px'}}>46%</span></span></div>
      </div>
    </div>;
  }
  function growthChart(c){
    const bars=[5,7,4,8,6,9,7,11,8,12,9,14];
    const line=[42,46,49,54,58,64,69,77,83,92,98,108];
    const W=600,H=210,pad=12;const bw=(W-pad*2)/bars.length;
    const lmax=120,bmax=16;
    const pts=line.map((v,i)=>`${pad+bw*i+bw/2},${H-(v/lmax*H)}`).join(' ');
    return <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'210px'}}>
      {[0,1,2,3].map(i=><line key={i} x1="0" x2={W} y1={H/3*i} y2={H/3*i} stroke="#F1F4F9" strokeWidth="1"/>)}
      {bars.map((v,i)=><rect key={i} x={pad+bw*i+7} y={H-(v/bmax*H)} width={bw-14} height={v/bmax*H} rx="3" fill="#DBE8FF"/>)}
      <polyline points={pts} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {line.map((v,i)=><circle key={i} cx={pad+bw*i+bw/2} cy={H-(v/lmax*H)} r="2.6" fill="#fff" stroke={c} strokeWidth="1.8"/>)}
    </svg>;
  }
}

AnalyticsScreen.cases = ['기본', '데이터 없음', '로딩'];
window.AnalyticsScreen = AnalyticsScreen;
