// Church Round · Direction C — 인증/공개 (로그인 · 랜딩)
// Canonical = Login + Landing/LandingPage. Light theme, no admin shell.
// Exports window.LoginScreen, window.LandingScreen
// Uses var(--cr-primary)/var(--cr-radius) so Tweaks still apply.

function Wordmark({ dark }) {
  return (
    <span style={{fontSize:'24px',letterSpacing:'-.01em',whiteSpace:'nowrap'}}>
      <span style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:'italic',fontWeight:500,color:'var(--cr-primary)'}}>church</span>
      <span style={{fontWeight:800,color: dark ? '#fff' : '#0E1729'}}> round</span>
    </span>
  );
}

function LoginScreen({ caseId }) {
  const I = window.ICONS, C = window.C;
  return (
    <div className="lg-root">
      <style>{`
        .lg-root{width:100%;min-height:100vh;display:flex;font-family:'Pretendard',system-ui,sans-serif;
          background:#F1F4F9;color:#0E1729;-webkit-font-smoothing:antialiased;}
        .lg-root *{box-sizing:border-box;}
        .lg-brandpanel{flex:1;background:linear-gradient(150deg,#0E1729,#1B2740);color:#fff;padding:48px 52px;
          display:flex;flex-direction:column;position:relative;overflow:hidden;}
        .lg-quote{position:absolute;right:40px;top:120px;font-family:'Newsreader',serif;font-style:italic;
          font-size:240px;color:var(--cr-primary);opacity:.08;line-height:0;}
        .lg-head{font-size:38px;font-weight:800;letter-spacing:-.025em;line-height:1.25;margin-top:auto;}
        .lg-sub{font-size:15px;color:#9DB0CC;margin-top:18px;line-height:1.65;max-width:420px;}
        .lg-feat{display:flex;flex-direction:column;gap:13px;margin-top:32px;margin-bottom:auto;}
        .lg-fi{display:flex;align-items:center;gap:11px;font-size:14px;color:#C3CDDE;}
        .lg-fi .ic{width:30px;height:30px;border-radius:8px;background:rgba(28,124,255,.16);color:var(--cr-primary);
          display:flex;align-items:center;justify-content:center;flex:0 0 30px;}
        .lg-fi .ic svg{width:16px;height:16px;}
        .lg-copy{font-size:12px;color:#54627E;}
        .lg-formside{flex:0 0 480px;display:flex;align-items:center;justify-content:center;padding:40px;background:#fff;}
        .lg-form{width:100%;max-width:340px;}
        .lg-welcome{font-size:23px;font-weight:750;letter-spacing:-.02em;margin-top:26px;}
        .lg-wsub{font-size:13.5px;color:#64748B;margin-top:5px;}
        .lg-k{font-size:12.5px;font-weight:600;color:#475569;margin:18px 0 7px;display:block;}
        .lg-in{height:44px;border:1px solid #E3E8F0;border-radius:var(--cr-radius);display:flex;align-items:center;
          gap:9px;padding:0 14px;color:#A8B2C2;font-size:13.5px;}
        .lg-in svg{width:16px;height:16px;}
        .lg-fp{font-size:12px;color:#94A3B8;text-align:right;margin-top:9px;}
        .lg-btn{width:100%;height:46px;border-radius:var(--cr-radius);background:var(--cr-primary);color:#fff;
          font-size:14.5px;font-weight:700;border:none;margin-top:18px;cursor:pointer;}
        .lg-div{display:flex;align-items:center;gap:12px;margin:22px 0;color:#94A3B8;font-size:12px;}
        .lg-div::before,.lg-div::after{content:'';flex:1;height:1px;background:#EEF1F6;}
        .lg-alt{display:flex;gap:10px;}
        .lg-altb{flex:1;height:42px;border:1px solid #E3E8F0;border-radius:var(--cr-radius);display:flex;align-items:center;
          justify-content:center;gap:7px;font-size:12.5px;font-weight:600;color:#334155;background:#fff;cursor:pointer;}
        .lg-altb svg{width:15px;height:15px;color:var(--cr-primary);}
        .lg-altb{white-space:nowrap;}
        @media(max-width:880px){.lg-brandpanel{display:none;}.lg-formside{flex:1;}}
      `}</style>

      <div className="lg-brandpanel">
        <span className="lg-quote">”</span>
        <Wordmark dark />
        <div className="lg-head">교회의 모든 살림을<br/>한 곳에서, 단정하게.</div>
        <div className="lg-feat">
          {feat(I.users,'교인·심방·중보기도 통합 관리')}
          {feat(I.won,'헌금 관리와 기부금 영수증')}
          {feat(I.calendar,'예배 시간표 · 주보 · 푸시 알림')}
          {feat(I.chart,'출석·재정 통계로 보는 우리 교회')}
        </div>
        <div className="lg-copy">© 2026 Church Round · 은혜로교회 관리자</div>
      </div>

      <div className="lg-formside">
        <div className="lg-form">
          <Wordmark />
          {caseId === '이메일 인증' ? (
          <React.Fragment>
            <div className="lg-welcome">이메일 인증</div>
            <div className="lg-wsub"><b style={{color:'#0E1729'}}>office@grace.church</b>로 보낸 6자리 인증 코드를 입력하세요.</div>
            <label className="lg-k">인증 코드</label>
            <div className="lg-in" style={{justifyContent:'center',letterSpacing:'10px',fontWeight:700,color:'#0E1729'}}>－－－－－－</div>
            <button className="lg-btn">인증 확인</button>
            <div className="lg-fp" style={{textAlign:'center',marginTop:'14px'}}>코드 재전송 · 02:59</div>
          </React.Fragment>
          ) : (
          <React.Fragment>
            <div className="lg-welcome">다시 오신 것을 환영합니다</div>
            <div className="lg-wsub">관리자 계정으로 로그인하세요.</div>
            <label className="lg-k">이메일</label>
            <div className="lg-in">{I.mail}<span>이메일을 입력하세요</span></div>
            <label className="lg-k">비밀번호</label>
            <div className="lg-in">{I.shield}<span>비밀번호</span></div>
            <div className="lg-fp">비밀번호를 잊으셨나요?</div>
            <button className="lg-btn">로그인</button>
            <div className="lg-div">또는</div>
            <span className="lg-altb" style={{width:'100%'}}>{I.church||I.home}교회로 가입 신청</span>
          </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
  function feat(icon,t){ return <div className="lg-fi"><span className="ic">{icon}</span>{t}</div>; }
}

function LandingScreen() {
  const I = window.ICONS, C = window.C;
  const features = [
    [I.users,'교인 관리','교적·심방·중보기도까지 한 흐름으로. 76개 항목과 가족·차량·성례 기록을 체계적으로.'],
    [I.won,'재정·헌금','십일조부터 건축헌금까지 종류별 통계와 기부금 영수증을 손쉽게 발급합니다.'],
    [I.calendar,'예배·소식','예배 시간표, 주보, 오늘의 말씀, 공지와 푸시 알림을 교인 앱과 연결합니다.'],
    [I.chart,'통계 분석','출석·연령·구역·증가 추이를 한눈에. 데이터로 목회를 돕습니다.'],
    [I.org,'조직 · 목장','부서·구역·목장 구조와 교인 배정을 트리로 관리합니다.'],
    [I.shield,'안전한 운영','권한 관리와 보안 로그로 교회 데이터를 안전하게 지킵니다.'],
  ];
  return (
    <div className="ld-root">
      <style>{`
        .ld-root{width:100%;min-height:100vh;font-family:'Pretendard',system-ui,sans-serif;background:#fff;color:#0E1729;
          -webkit-font-smoothing:antialiased;}
        .ld-root *{box-sizing:border-box;}
        .ld-nav{height:64px;display:flex;align-items:center;padding:0 40px;border-bottom:1px solid #EEF1F6;
          position:sticky;top:0;background:rgba(255,255,255,.9);backdrop-filter:blur(8px);z-index:10;}
        .ld-navb{margin-left:auto;display:flex;align-items:center;gap:10px;}
        .ld-login{font-size:13.5px;font-weight:600;color:#475569;padding:0 14px;}
        .ld-cta{height:38px;padding:0 18px;border-radius:var(--cr-radius);background:var(--cr-primary);color:#fff;
          font-weight:700;font-size:13.5px;display:flex;align-items:center;white-space:nowrap;}
        .ld-hero{padding:80px 40px 70px;text-align:center;background:linear-gradient(180deg,#F6F9FE,#fff);}
        .ld-badge{display:inline-block;font-size:12.5px;font-weight:700;color:var(--cr-primary);background:#EAF1FE;
          padding:5px 14px;border-radius:999px;margin-bottom:22px;}
        .ld-h1{font-size:46px;font-weight:800;letter-spacing:-.03em;line-height:1.2;max-width:760px;margin:0 auto;}
        .ld-h1 .em{color:var(--cr-primary);}
        .ld-hsub{font-size:16.5px;color:#64748B;margin:22px auto 30px;max-width:560px;line-height:1.6;}
        .ld-hbtns{display:flex;gap:12px;justify-content:center;}
        .ld-b1{height:50px;padding:0 26px;border-radius:var(--cr-radius);background:var(--cr-primary);color:#fff;
          font-size:15px;font-weight:700;border:none;display:flex;align-items:center;gap:8px;white-space:nowrap;}
        .ld-b1 svg{width:17px;height:17px;}
        .ld-b2{height:50px;padding:0 24px;border-radius:var(--cr-radius);background:#fff;color:#334155;border:1px solid #E3E8F0;
          font-size:15px;font-weight:600;white-space:nowrap;}
        .ld-shot{max-width:920px;margin:48px auto 0;height:380px;border-radius:16px;border:1px solid #E3E8F0;
          background:repeating-linear-gradient(135deg,#F1F5FB,#F1F5FB 12px,#E9EFF8 12px,#E9EFF8 24px);
          display:flex;align-items:center;justify-content:center;box-shadow:0 30px 60px -24px rgba(14,23,41,.25);}
        .ld-shot span{font-family:ui-monospace,monospace;font-size:12px;color:#94A3B8;background:#fff;padding:5px 12px;
          border-radius:7px;border:1px solid #E3E8F0;}
        .ld-feats{max-width:1040px;margin:0 auto;padding:80px 40px;}
        .ld-ft{text-align:center;font-size:30px;font-weight:800;letter-spacing:-.02em;}
        .ld-fsub{text-align:center;font-size:15px;color:#64748B;margin:12px 0 44px;}
        .ld-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;}
        .ld-card{padding:26px;border:1px solid #EEF1F6;border-radius:16px;background:#fff;}
        .ld-fic{width:48px;height:48px;border-radius:12px;background:#EAF1FE;color:var(--cr-primary);display:flex;
          align-items:center;justify-content:center;margin-bottom:16px;}
        .ld-fic svg{width:23px;height:23px;}
        .ld-cn{font-size:17px;font-weight:750;letter-spacing:-.01em;}
        .ld-cd{font-size:13.5px;color:#64748B;line-height:1.65;margin-top:9px;}
        .ld-band{background:linear-gradient(135deg,#0E1729,#1B2740);color:#fff;text-align:center;padding:64px 40px;}
        .ld-band h2{font-size:32px;font-weight:800;letter-spacing:-.02em;}
        .ld-band p{font-size:15px;color:#9DB0CC;margin:14px 0 28px;}
        .ld-foot{padding:28px 40px;border-top:1px solid #EEF1F6;display:flex;align-items:center;color:#94A3B8;font-size:12.5px;}
      `}</style>

      <div className="ld-nav">
        <Wordmark />
        <div className="ld-navb"><span className="ld-login">로그인</span><span className="ld-cta">무료로 시작하기</span></div>
      </div>

      <div className="ld-hero">
        <span className="ld-badge">교회 행정 올인원 플랫폼</span>
        <div className="ld-h1">교회의 모든 살림을<br/><span className="em">한 곳에서</span> 단정하게.</div>
        <div className="ld-hsub">교인 관리부터 헌금, 예배 소식, 통계 분석까지. Church Round 하나로 교회 행정을 가볍게 만드세요.</div>
        <div className="ld-hbtns">
          <button className="ld-b1">{I.arrow}무료로 시작하기</button>
          <button className="ld-b2">기능 둘러보기</button>
        </div>
        <div className="ld-shot"><span>대시보드 스크린샷</span></div>
      </div>

      <div className="ld-feats">
        <div className="ld-ft">목회에 집중하도록, 행정은 가볍게</div>
        <div className="ld-fsub">교회 운영에 필요한 모든 기능을 한 플랫폼에서.</div>
        <div className="ld-grid">
          {features.map((f,i)=>(
            <div key={i} className="ld-card">
              <div className="ld-fic">{f[0]}</div>
              <div className="ld-cn">{f[1]}</div>
              <div className="ld-cd">{f[2]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ld-band">
        <h2>지금 우리 교회도 시작해 보세요</h2>
        <p>설치 없이 웹에서 바로. 첫 30일 무료로 모든 기능을 사용할 수 있습니다.</p>
        <button className="ld-b1" style={{margin:'0 auto'}}>{I.arrow}교회 무료 등록</button>
      </div>

      <div className="ld-foot"><Wordmark /><span style={{marginLeft:'auto'}}>© 2026 Church Round. All rights reserved.</span></div>
    </div>
  );
}

LoginScreen.cases = ['로그인', '이메일 인증'];
Object.assign(window, { LoginScreen, LandingScreen });
