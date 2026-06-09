// Church Round · Direction C — 주보 · 공지 (공지사항 탭)
// Canonical = AnnouncementManagement (+ Bulletins). From code: category
// (예배/모임·교우 소식·행사/공지·일반), priority(urgent·important·normal),
// is_pinned, is_active, target_audience(전체·일반교인·청소년부·리더), dates.
// Exports window.AnnouncementsScreen

function AnnouncementsScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const CAT = { worship:'예배/모임', member_news:'교우 소식', event:'행사/공지', general:'일반' };
  const PRI = { urgent:['긴급', C.st.danger], important:['중요', C.st.warning], normal:['일반', C.st.neutral] };
  const TGT = { all:'전체', member:'일반 교인', youth:'청소년부', leader:'리더' };

  const list = [
    [true,'event','important','2026 맥추감사주일 안내','7월 6일 주일은 맥추감사주일로 지킵니다. 감사의 예물을 준비해 주시고, 전 교인 한 마음으로 예배에 참여 부탁드립니다.','김은혜 목사','all','2026.06.01 ~ 07.06', true],
    [false,'worship','normal','수요 저녁예배 시간 변경','6월부터 수요 저녁예배가 19:30으로 변경됩니다. 착오 없으시길 바랍니다.','이사랑 간사','all','2026.06.01 ~', true],
    [false,'member_news','normal','새가족 환영회 안내','이번 달 새가족 7분을 위한 환영회를 6월 8일 점심에 진행합니다. 많은 관심 부탁드립니다.','이사랑 간사','member','2026.06.02 ~ 06.08', true],
    [false,'event','urgent','폭우 대비 주일 차량 운행 안내','기상 악화로 주일 차량 운행이 지연될 수 있습니다. 안전 운행을 위해 양해 부탁드립니다.','김은혜 목사','all','2026.06.02 ~ 06.03', false],
  ];

  return (
    <CShell
      active="bulletin"
      title="주보 · 공지"
      subtitle="활성 공지 6건 · 고정 1건"
      segment={[{label:'공지사항',on:true},{label:'주보'}]}
      headerRight={<button className="cs-cta">{I.plus}새 공지</button>}
    >
      <style>{`
        .an-filter{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
        .an-tab{height:34px;padding:0 14px;border-radius:999px;font-size:12.5px;font-weight:600;
          border:1px solid #E3E8F0;background:#fff;color:#64748B;white-space:nowrap;}
        .an-tab.on{background:var(--cr-primary);color:#fff;border-color:var(--cr-primary);}
        .an-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);padding:18px 20px;margin-bottom:12px;}
        .an-card.pin{border-color:#F2D98D;background:#FFFCF4;}
        .an-card.off{opacity:.6;}
        .an-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;}
        .an-chip{font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:6px;white-space:nowrap;}
        .an-cat{font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:6px;background:#EAF1FE;color:#2563EB;white-space:nowrap;}
        .an-pin{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:#B45309;}
        .an-pin svg{width:12px;height:12px;}
        .an-ttl{font-size:16px;font-weight:700;letter-spacing:-.01em;}
        .an-body{font-size:13px;color:#475569;line-height:1.6;margin-top:7px;}
        .an-meta{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:13px;padding-top:13px;border-top:1px solid #F1F4F9;}
        .an-m{font-size:12px;color:#94A3B8;display:inline-flex;align-items:center;gap:6px;}
        .an-m svg{width:13px;height:13px;}
        .an-acts{margin-left:auto;display:flex;gap:7px;}
        .an-tog{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:#16A34A;}
        .an-sw{width:30px;height:17px;border-radius:999px;background:#16A34A;position:relative;}
        .an-sw.off{background:#CBD5E1;}
        .an-sw::after{content:'';position:absolute;top:2px;right:2px;width:13px;height:13px;border-radius:50%;background:#fff;}
        .an-sw.off::after{left:2px;right:auto;}
        .an-b{width:30px;height:30px;border-radius:7px;border:1px solid #E3E8F0;display:inline-flex;align-items:center;
          justify-content:center;color:#64748B;background:#fff;}
        .an-b svg{width:15px;height:15px;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={4} /> :
       caseId === '빈 상태' ? <CEmpty icon={I.bell} title="등록된 공지가 없습니다" desc="새 공지를 작성해 교인들에게 소식을 전하세요." cta="새 공지" /> :
      (<React.Fragment>
      <div className="an-filter">
        <span className="an-tab on">전체</span>
        <span className="an-tab">고정</span>
        <span className="an-tab">예배/모임</span>
        <span className="an-tab">교우 소식</span>
        <span className="an-tab">행사/공지</span>
      </div>

      {list.map((a,i)=>{
        const [pin,cat,pri,title,body,author,tgt,period,active]=a;
        const [pl,pc]=PRI[pri];
        return (
          <div key={i} className={'an-card'+(pin?' pin':'')+(active?'':' off')}>
            <div className="an-top">
              {pin && <span className="an-pin">{I.star}고정</span>}
              <span className="an-cat">{CAT[cat]}</span>
              {pri!=='normal' && <span className="an-chip" style={{background:pc[0],color:pc[1]}}>{pl}</span>}
              {!active && <span className="an-chip" style={{background:C.st.neutral[0],color:C.st.neutral[1]}}>비활성</span>}
            </div>
            <div className="an-ttl">{title}</div>
            <div className="an-body">{body}</div>
            <div className="an-meta">
              <span className="an-m">{I.users}{author}</span>
              <span className="an-m">{I.bell}대상 {TGT[tgt]}</span>
              <span className="an-m">{I.calendar}{period}</span>
              <div className="an-acts">
                <span className="an-tog"><CToggle cls="an-sw" on={active} /></span>
                <span className="an-b">{I.edit}</span>
                <span className="an-b">{I.trash}</span>
              </div>
            </div>
          </div>
        );
      })}
      </React.Fragment>)}
    </CShell>
  );
}

AnnouncementsScreen.cases = ['기본', '빈 상태', '로딩'];
window.AnnouncementsScreen = AnnouncementsScreen;
