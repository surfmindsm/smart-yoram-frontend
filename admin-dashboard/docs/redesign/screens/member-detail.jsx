// Church Round · Direction C — 교인 상세 (프로필)
// Canonical = MemberManagement detail view. Field groups & relation tables
// lifted from the real code: 기본/교회/사역·직업/개인·가족/주소 +
// member_contacts / sacraments / transfers / member_vehicles.
// Exports window.MemberDetailScreen

function MemberDetailScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  return (
    <CShell
      active="members"
      crumb="교인 관리 / 김성호"
      headerRight={<>
        <a className="cs-cta ghost" href="교인 관리.html" style={{marginRight:8,textDecoration:'none'}}>{I.chevL}목록</a>
        <a className="cs-cta" href="교인 등록.html?mode=edit" style={{textDecoration:'none'}}>{I.edit}정보 수정</a>
      </>}
    >
      <style>{`
        .md-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);margin-bottom:16px;}
        .md-ch{padding:14px 20px;border-bottom:1px solid #EEF1F6;display:flex;align-items:center;gap:9px;}
        .md-ch svg{width:16px;height:16px;color:var(--cr-primary);}
        .md-ct{font-size:14px;font-weight:700;letter-spacing:-.01em;}
        .md-ch .cnt{margin-left:auto;font-size:11.5px;color:#94A3B8;font-weight:600;}
        .md-cp{padding:18px 20px;}
        .md-dl{display:grid;grid-template-columns:repeat(2,1fr);gap:14px 24px;}
        .md-dl.one{grid-template-columns:1fr;}
        .md-f .k{font-size:11.5px;color:#94A3B8;font-weight:600;margin-bottom:3px;}
        .md-f .v{font-size:13.5px;color:#1F2937;font-weight:500;}
        .md-f .v.mono{font-family:ui-monospace,monospace;}
        .md-li{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #F1F4F9;}
        .md-li:last-child{border-bottom:none;}
        .md-lic{width:32px;height:32px;border-radius:8px;background:#F1F4F9;display:flex;align-items:center;
          justify-content:center;color:#64748B;flex:0 0 32px;}
        .md-lic svg{width:15px;height:15px;}
        .md-lt{font-size:13px;font-weight:600;color:#1F2937;}
        .md-lm{font-size:11.5px;color:#94A3B8;margin-top:1px;}
        .md-tag{margin-left:auto;font-size:11px;font-weight:700;padding:2px 9px;border-radius:999px;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={5} /> :
      (<React.Fragment>
      {/* profile band */}
      <div className="md-card" style={{padding:'22px 24px',marginBottom:'18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'18px'}}>
          <div style={{width:'68px',height:'68px',borderRadius:'16px',background:'#EEF3FC',color:'var(--cr-primary)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'27px',fontWeight:750,flex:'0 0 68px'}}>김</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <span style={{fontSize:'22px',fontWeight:750,letterSpacing:'-.02em'}}>김성호</span>
              <span style={{fontSize:'13px',color:'#94A3B8',fontWeight:500}}>Kim Sung-ho</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'8px'}}>
              <span style={{fontSize:'11.5px',fontWeight:700,padding:'2px 10px',borderRadius:'999px',background:'#EEF3FC',color:'var(--cr-primary)',whiteSpace:'nowrap'}}>목사 · 담임</span>
              <span style={{fontSize:'11.5px',fontWeight:700,padding:'2px 10px',borderRadius:'999px',background:C.st.success[0],color:C.st.success[1],whiteSpace:'nowrap'}}>정착</span>
              <span style={{fontSize:'12.5px',color:'#64748B',marginLeft:'4px',whiteSpace:'nowrap'}}>1구역 · 하늘목장 · 등록 2019.03.12</span>
            </div>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button className="cs-cta ghost">{I.phone}전화</button>
            <button className="cs-cta ghost">{I.msg}문자</button>
            <button className="cs-cta ghost">{I.mail}메일</button>
          </div>
        </div>
      </div>

      {/* two columns */}
      <div style={{display:'grid',gridTemplateColumns:'1.55fr 1fr',gap:'16px',alignItems:'start'}}>
        {/* LEFT */}
        <div>
          {card(I.users,'기본 정보', dl([
            ['이메일','kim.sh@grace.church',true],['전화번호','010-2841-3920',true],
            ['성별','남성'],['생년월일','1971.08.04'],
          ]))}
          {card(I.shield,'교회 정보', dl([
            ['직분','목사'],['상태','정착'],['조직','당회'],['부서','담임목회'],
            ['임명일','2009.04.12'],['안수교회','은혜로교회'],
          ]))}
          {card(I.heart,'개인 · 가족', dl([
            ['교인 분류','세례교인'],['연령대','50대'],['신앙 등급','직분자'],
            ['결혼 상태','기혼'],['배우자','이은주'],['결혼일','1998.05.16'],
          ]))}
          {card(I.org,'직업 · 주소', dl([
            ['직업','목회자'],['직장명','은혜로교회'],
            ['주소','서울 마포구 · 04035',false,true],
          ]))}
        </div>

        {/* RIGHT */}
        <div>
          <div className="md-card">
            <div className="md-ch">{I.phone}<span className="md-ct">추가 연락처</span><span className="cnt">2건</span></div>
            <div className="md-cp" style={{paddingTop:6,paddingBottom:6}}>
              {li(I.phone,'자택','02-336-7782')}
              {li(I.users,'비상 연락 · 배우자','010-5512-3380')}
            </div>
          </div>
          <div className="md-card">
            <div className="md-ch">{I.book}<span className="md-ct">성례 기록</span><span className="cnt">2건</span></div>
            <div className="md-cp" style={{paddingTop:6,paddingBottom:6}}>
              {li(I.check,'세례','2009.04.12 · 은혜로교회', C.st.success)}
              {li(I.check,'입교','2008.12.21 · 은혜로교회', C.st.info)}
            </div>
          </div>
          <div className="md-card">
            <div className="md-ch">{I.arrow}<span className="md-ct">전입 · 전출</span><span className="cnt">1건</span></div>
            <div className="md-cp" style={{paddingTop:6,paddingBottom:6}}>
              {li(I.arrow,'전입','2019.03 · 사랑교회에서', C.st.info)}
            </div>
          </div>
          <div className="md-card">
            <div className="md-ch">{I.org}<span className="md-ct">차량</span><span className="cnt">1대</span></div>
            <div className="md-cp" style={{paddingTop:6,paddingBottom:6}}>
              {li(I.org,'12가 3456','흰색 · SUV')}
            </div>
          </div>
        </div>
      </div>
      </React.Fragment>)}
    </CShell>
  );

  function card(icon,title,body){
    return <div className="md-card"><div className="md-ch">{icon}<span className="md-ct">{title}</span></div><div className="md-cp">{body}</div></div>;
  }
  function dl(rows){
    return <div className="md-dl">
      {rows.map((r,i)=>{
        const [k,v,mono,full]=r;
        return <div key={i} className="md-f" style={full?{gridColumn:'1 / -1'}:null}>
          <div className="k">{k}</div><div className={'v'+(mono?' mono':'')}>{v}</div>
        </div>;
      })}
    </div>;
  }
  function li(icon,t,m,tag){
    return <div className="md-li">
      <div className="md-lic">{icon}</div>
      <div style={{flex:1,minWidth:0}}><div className="md-lt">{t}</div><div className="md-lm">{m}</div></div>
    </div>;
  }
}

MemberDetailScreen.cases = ['기본', '로딩'];
window.MemberDetailScreen = MemberDetailScreen;
