// Church Round · Direction C — shared application shell (fluid, tweak-driven)
// Fills the viewport. All themeable values read CSS custom properties
// (--cr-*) so the Tweaks panel can change them live. Dark defaults baked in
// as fallbacks, so the shell also works standalone.
// Mirrors src/components/Layout.tsx. Excludes AI / QR / attendance (not live).
// Exports window.CShell and window.C (token helpers)

window.C = {
  blue: '#1C7CFF', ink: '#0E1729', bg: '#F1F4F9',
  border: '#E3E8F0', text: '#0E1729', sub: '#64748B', muted: '#94A3B8',
  st: {
    info:   ['#EAF1FE', '#2563EB'],
    success:['#E7F6EC', '#16A34A'],
    warning:['#FBF1E3', '#B45309'],
    danger: ['#FCEBEB', '#DC2626'],
    neutral:['#F1F4F9', '#64748B'],
    accent: ['#F0E6EF', '#8A5A86'],
  },
  // Tweak → CSS-variable presets for the sidebar theme
  sidebarThemes: {
    dark: {
      '--cr-side-bg':'#0E1729','--cr-side-fg':'#AEBACE','--cr-side-strong':'#E6ECF6',
      '--cr-side-muted':'#54627E','--cr-side-icon':'#6B7A95','--cr-side-border':'#1B2740',
      '--cr-side-chip':'#233149','--cr-side-chipfg':'#9DB0CC','--cr-cmd-bg':'#172033',
      '--cr-cmd-border':'#233149','--cr-brand-round':'#FFFFFF','--cr-side-hover':'#172033',
    },
    light: {
      '--cr-side-bg':'#FFFFFF','--cr-side-fg':'#475569','--cr-side-strong':'#0E1729',
      '--cr-side-muted':'#94A3B8','--cr-side-icon':'#94A3B8','--cr-side-border':'#EEF1F6',
      '--cr-side-chip':'#EFF3FA','--cr-side-chipfg':'#5B6B86','--cr-cmd-bg':'#F4F6FA',
      '--cr-cmd-border':'#E7ECF3','--cr-brand-round':'#0E1729','--cr-side-hover':'#F6F8FB',
    },
  },
};

window.CR_ROUTES = {
  dashboard:'대시보드.html', members:'교인 관리.html', org:'조직 관리.html',
  care:'심방 신청 관리.html', prayer:'중보 기도 요청.html',
  donations:'헌금 관리.html', verse:'오늘의 말씀.html', worship:'예배 시간표.html',
  bulletin:'주보 공지.html', push:'푸시 알림.html',
  analytics:'통계 분석.html', sms:'SMS 발송.html', excel:'엑셀 관리.html',
  security:'보안 로그.html', settings:'교회 설정.html',
};

function CShell({ active, crumb, title, subtitle, headerRight, segment, children, navGroups }) {
  const I = window.ICONS;
  const [segIdx, setSegIdx] = React.useState(() => { const i = (segment || []).findIndex(s => s.on); return i < 0 ? 0 : i; });

  const groups = navGroups || [
    { title: '운영', items: [
      ['dashboard', I.home, '대시보드', null],
      ['members', I.users, '교인 관리', '842'],
      ['org', I.org, '조직 · 목장', null],
      ['care', I.care, '심방 신청', '5'],
      ['prayer', I.heart, '중보 기도', '12'],
    ]},
    { title: '살림', items: [
      ['donations', I.won, '헌금 관리', null],
      ['verse', I.book, '오늘의 말씀', null],
      ['worship', I.calendar, '예배 시간표', null],
      ['bulletin', I.file, '주보 · 공지', null],
      ['push', I.bell, '푸시 알림', null],
    ]},
    { title: '도구', items: [
      ['analytics', I.chart, '통계 분석', null],
      ['sms', I.msg, 'SMS 발송', null],
      ['excel', I.excel, '엑셀 관리', null],
      ['security', I.shield, '보안 로그', null],
      ['settings', I.settings, '설정', null],
    ]},
  ];

  return (
    <div className="cs-root">
      <style>{`
        :root{
          --cr-primary:#1C7CFF;
          --cr-side-bg:#0E1729; --cr-side-fg:#AEBACE; --cr-side-strong:#E6ECF6;
          --cr-side-muted:#54627E; --cr-side-icon:#6B7A95; --cr-side-border:#1B2740;
          --cr-side-chip:#233149; --cr-side-chipfg:#9DB0CC; --cr-cmd-bg:#172033;
          --cr-cmd-border:#233149; --cr-brand-round:#FFFFFF; --cr-side-hover:#172033;
          --cr-radius:12px; --cr-cell-py:12px; --cr-nav-py:7px;}
        .cs-root{
          width:100%;height:100vh;background:#F1F4F9;color:#0E1729;
          font-family:'Pretendard',system-ui,sans-serif;display:flex;overflow:hidden;
          -webkit-font-smoothing:antialiased;font-feature-settings:'tnum';}
        .cs-root *{box-sizing:border-box;}
        .cs-side{width:236px;flex:0 0 236px;background:var(--cr-side-bg);color:var(--cr-side-fg);
          display:flex;flex-direction:column;height:100vh;border-right:1px solid var(--cr-side-border);}
        .cs-brand{height:58px;display:flex;align-items:center;padding:0 20px;
          border-bottom:1px solid var(--cr-side-border);font-size:21px;letter-spacing:-.01em;flex:0 0 58px;}
        .cs-brand .c{font-family:'Newsreader',Georgia,serif;font-style:italic;font-weight:500;color:var(--cr-primary);}
        .cs-brand .r{font-weight:800;color:var(--cr-brand-round);}
        .cs-brand a{text-decoration:none;display:flex;align-items:center;}
        .cs-crumb a{color:#64748B;text-decoration:none;}
        .cs-cmd{margin:14px 16px 6px;height:34px;background:var(--cr-cmd-bg);border:1px solid var(--cr-cmd-border);
          border-radius:8px;display:flex;align-items:center;gap:8px;padding:0 11px;color:var(--cr-side-icon);
          font-size:12.5px;white-space:nowrap;}
        .cs-cmd svg{width:14px;height:14px;}
        .cs-cmd .k{margin-left:auto;font-size:10px;border:1px solid var(--cr-cmd-border);border-radius:4px;
          padding:1px 5px;color:var(--cr-side-icon);}
        .cs-nav{flex:1;padding:8px 12px 16px;overflow-y:auto;}
        .cs-grp{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
          color:var(--cr-side-muted);padding:14px 10px 6px;}
        .cs-item{display:flex;align-items:center;gap:11px;padding:var(--cr-nav-py) 10px;border-radius:7px;
          font-size:13px;font-weight:500;color:var(--cr-side-fg);cursor:pointer;text-decoration:none;}
        .cs-item:hover{background:var(--cr-side-hover);}
        .cs-item svg{width:16px;height:16px;flex:0 0 16px;color:var(--cr-side-icon);}
        .cs-item.on{background:var(--cr-primary);color:#fff;font-weight:600;}
        .cs-item.on:hover{background:var(--cr-primary);}
        .cs-item.on svg{color:#fff;}
        .cs-item .ct{margin-left:auto;font-size:10.5px;font-weight:700;background:var(--cr-side-chip);
          color:var(--cr-side-chipfg);padding:1px 7px;border-radius:999px;}
        .cs-item.on .ct{background:rgba(255,255,255,.22);color:#fff;}
        .cs-user{border-top:1px solid var(--cr-side-border);padding:12px 16px;display:flex;
          align-items:center;gap:10px;flex:0 0 auto;}
        .cs-av{width:32px;height:32px;border-radius:8px;background:var(--cr-primary);color:#fff;display:flex;
          align-items:center;justify-content:center;font-weight:700;font-size:13px;}
        .cs-main{flex:1;display:flex;flex-direction:column;min-width:0;height:100vh;}
        .cs-top{height:58px;flex:0 0 58px;background:#fff;border-bottom:1px solid #E3E8F0;display:flex;
          align-items:center;padding:0 24px;gap:16px;}
        .cs-crumb{font-size:13px;color:#64748B;}
        .cs-crumb b{color:#0E1729;font-weight:700;}
        .cs-seg{display:flex;background:#F1F4F9;border-radius:8px;padding:3px;gap:2px;}
        .cs-seg span{font-size:12px;font-weight:600;color:#64748B;padding:5px 12px;border-radius:6px;cursor:pointer;white-space:nowrap;}
        .cs-seg span.on{background:#fff;color:#0E1729;box-shadow:0 1px 2px rgba(0,0,0,.08);}
        .cs-icbtn{width:34px;height:34px;border-radius:8px;border:1px solid #E3E8F0;display:flex;
          align-items:center;justify-content:center;color:#64748B;background:#fff;cursor:pointer;flex:0 0 auto;}
        .cs-icbtn svg{width:17px;height:17px;}
        .cs-cta{height:34px;padding:0 14px;border-radius:8px;background:var(--cr-primary);color:#fff;
          font-weight:600;font-size:12.5px;display:flex;align-items:center;gap:6px;border:none;cursor:pointer;
          white-space:nowrap;flex:0 0 auto;}
        .cs-cta svg{width:15px;height:15px;}
        .cs-cta.ghost{background:#fff;color:#334155;border:1px solid #E3E8F0;}
        .cs-cta.ghost svg{color:#64748B;}
        .cs-body{flex:1;padding:22px 24px 40px;overflow-y:auto;}
        .cs-h1{font-size:23px;font-weight:750;letter-spacing:-.02em;}
        .cs-sub{font-size:13px;color:#64748B;margin-top:3px;}
      `}</style>

      <aside className="cs-side">
        <div className="cs-brand"><a href="대시보드.html"><span className="c">church</span>&nbsp;<span className="r">round</span></a></div>
        <div className="cs-cmd">{I.search}<span>빠른 검색</span><span className="k">⌘K</span></div>
        <nav className="cs-nav">
          {groups.map((g,gi)=>(
            <div key={gi}>
              <div className="cs-grp">{g.title}</div>
              {g.items.map(([key,icon,label,ct])=>{
                const href = (window.CR_ROUTES||{})[key];
                return <a key={key} href={href||undefined} className={'cs-item'+(key===active?' on':'')}>{icon}<span>{label}</span>{ct&&<span className="ct">{ct}</span>}</a>;
              })}
            </div>
          ))}
        </nav>
        <div className="cs-user">
          <div className="cs-av">이</div>
          <div>
            <div style={{fontSize:'12.5px',fontWeight:600,color:'var(--cr-side-strong)'}}>이사랑 간사</div>
            <div style={{fontSize:'11px',color:'var(--cr-side-icon)'}}>은혜로교회</div>
          </div>
        </div>
      </aside>

      <div className="cs-main">
        <div className="cs-top">
          <div className="cs-crumb"><a href="대시보드.html">은혜로교회</a> / <b>{crumb || title}</b></div>
          <div style={{flex:1}}></div>
          {segment && (
            <div className="cs-seg">{segment.map((s,i)=><span key={i} className={i===segIdx?'on':''} onClick={()=>setSegIdx(i)}>{s.label}</span>)}</div>
          )}
          <div className="cs-icbtn">{I.bell}</div>
          {headerRight}
        </div>
        <div className="cs-body">
          {(title || subtitle) && (
            <div style={{marginBottom:'20px',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
              <div>
                <div className="cs-h1">{title}</div>
                {subtitle && <div className="cs-sub">{subtitle}</div>}
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

window.CShell = CShell;

// ---- shared state helpers (empty / loading / error) ----
function CEmpty({ icon, title, desc, cta }) {
  const I = window.ICONS;
  return (
    <div style={{background:'#fff',border:'1px solid #E3E8F0',borderRadius:'var(--cr-radius)',
      padding:'64px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'#F1F4F9',color:'#94A3B8',
        display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
        <span style={{width:'26px',height:'26px',display:'inline-flex'}}>{icon || I.search}</span>
      </div>
      <div style={{fontSize:'16px',fontWeight:750,letterSpacing:'-.01em'}}>{title}</div>
      <div style={{fontSize:'13px',color:'#94A3B8',marginTop:'7px',lineHeight:1.6,maxWidth:'320px'}}>{desc}</div>
      {cta && <button className="cs-cta" style={{marginTop:'18px'}}>{I.plus}{cta}</button>}
    </div>
  );
}

function CLoading({ rows }) {
  const n = rows || 6;
  return (
    <div style={{background:'#fff',border:'1px solid #E3E8F0',borderRadius:'var(--cr-radius)',overflow:'hidden'}}>
      <style>{`@keyframes crsh{0%{background-position:-360px 0}100%{background-position:360px 0}}
        .cr-sk{background:linear-gradient(90deg,#EEF1F6 25%,#F6F8FB 37%,#EEF1F6 63%);background-size:720px 100%;
          animation:crsh 1.3s infinite linear;border-radius:6px;}`}</style>
      {Array.from({length:n}).map((_,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:'14px',padding:'15px 18px',
          borderBottom:i<n-1?'1px solid #F1F4F9':'none'}}>
          <div className="cr-sk" style={{width:'36px',height:'36px',borderRadius:'9px',flex:'0 0 36px'}}></div>
          <div style={{flex:1}}>
            <div className="cr-sk" style={{height:'12px',width:(45+(i*7)%40)+'%',marginBottom:'8px'}}></div>
            <div className="cr-sk" style={{height:'10px',width:(25+(i*5)%25)+'%'}}></div>
          </div>
          <div className="cr-sk" style={{width:'64px',height:'22px',borderRadius:'999px',flex:'0 0 64px'}}></div>
        </div>
      ))}
    </div>
  );
}

function CError({ onRetry }) {
  const I = window.ICONS;
  return (
    <div style={{background:'#fff',border:'1px solid #FAD9D9',borderRadius:'var(--cr-radius)',
      padding:'56px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'#FCEBEB',color:'#DC2626',
        display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
        <span style={{width:'26px',height:'26px',display:'inline-flex'}}>{I.x}</span>
      </div>
      <div style={{fontSize:'16px',fontWeight:750}}>데이터를 불러오지 못했습니다</div>
      <div style={{fontSize:'13px',color:'#94A3B8',marginTop:'7px'}}>잠시 후 다시 시도해 주세요.</div>
      <button className="cs-cta" style={{marginTop:'18px'}}>다시 시도</button>
    </div>
  );
}

Object.assign(window, { CEmpty, CLoading, CError });

// ---- interactive dropdown (replaces static filter/select pills) ----
function CDropdown({ label, value, options, cls, align, block }) {
  const I = window.ICONS;
  const [open, setOpen] = React.useState(false);
  const [val, setVal] = React.useState(value);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', flex: block ? '1 1 auto' : '0 0 auto', width: block ? '100%' : undefined }}>
      <div className={cls} onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
        {label ? label + ' ' : ''}<span className="v">{val}</span>{I.chevD}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', [align === 'right' ? 'right' : 'left']: 0,
          minWidth: '150px', width: block ? '100%' : undefined, background: '#fff', border: '1px solid #E3E8F0', borderRadius: '10px',
          boxShadow: '0 14px 34px -12px rgba(14,23,41,.3)', padding: '6px', zIndex: 70, maxHeight: '240px', overflowY: 'auto' }}>
          {options.map((o, i) => (
            <div key={i} onClick={() => { setVal(o); setOpen(false); }}
              style={{ padding: '8px 11px', fontSize: '13px', borderRadius: '7px', cursor: 'pointer',
                whiteSpace: 'nowrap', fontWeight: o === val ? 700 : 500,
                color: o === val ? 'var(--cr-primary)' : '#334155',
                background: o === val ? '#EEF3FC' : 'transparent' }}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}

window.CDropdown = CDropdown;

// ---- interactive checkbox + toggle switch ----
function CCheck({ checked, cls }) {
  const [on, setOn] = React.useState(!!checked);
  return (
    <span className={(cls || '') + (on ? ' on' : '')} onClick={(e) => { e.stopPropagation(); setOn(o => !o); }}
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {on && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '11px', height: '11px' }}><path d="M20 6 9 17l-5-5" /></svg>}
    </span>
  );
}

function CToggle({ on, cls }) {
  const [v, setV] = React.useState(!!on);
  return <span className={(cls || '') + (v ? '' : ' off')} onClick={(e) => { e.stopPropagation(); setV(o => !o); }} style={{ cursor: 'pointer' }}></span>;
}

Object.assign(window, { CCheck, CToggle });
