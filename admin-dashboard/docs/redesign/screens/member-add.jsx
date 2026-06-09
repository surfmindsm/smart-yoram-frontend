// Church Round · Direction C — 교인 등록 (모달)
// Canonical = AddMemberModal. Collapsible <details> sections lifted from code:
// 기본 정보*·교회 정보 (open) / 개인·가족·주소·직업·사역 (collapsed).
// Renders over the member list for real context.
// Exports window.AddMemberScreen

function AddMemberScreen() {
  const I = window.ICONS;
  const isEdit = typeof location !== 'undefined' && /mode=edit/.test(location.search);
  const back = isEdit ? '교인 상세.html' : '교인 관리.html';

  return (
    <React.Fragment>
      <MembersScreen />
      <div className="am-scrim">
        <style>{`
          .am-scrim{position:fixed;inset:0;background:rgba(14,23,41,.45);backdrop-filter:blur(2px);
            display:flex;align-items:flex-start;justify-content:center;padding:48px 16px;z-index:60;
            font-family:'Pretendard',system-ui,sans-serif;}
          .am-modal{width:660px;max-width:100%;max-height:calc(100vh - 96px);background:#fff;
            border-radius:16px;box-shadow:0 24px 60px -12px rgba(14,23,41,.5);display:flex;flex-direction:column;
            overflow:hidden;color:#0E1729;}
          .am-head{padding:18px 22px;border-bottom:1px solid #EEF1F6;display:flex;align-items:center;gap:10px;flex:0 0 auto;}
          .am-head .ic{width:34px;height:34px;border-radius:9px;background:#EEF3FC;color:var(--cr-primary);
            display:flex;align-items:center;justify-content:center;}
          .am-head .ic svg{width:18px;height:18px;}
          .am-head h2{font-size:16px;font-weight:750;letter-spacing:-.01em;white-space:nowrap;}
          .am-head .x{margin-left:auto;width:32px;height:32px;border-radius:8px;border:1px solid #E3E8F0;
            display:flex;align-items:center;justify-content:center;color:#64748B;cursor:pointer;text-decoration:none;}
          .am-head .x svg{width:16px;height:16px;}
          .am-body{padding:20px 22px;overflow-y:auto;flex:1;}
          .am-photo{display:flex;flex-direction:column;align-items:center;gap:10px;padding-bottom:18px;
            border-bottom:1px solid #F1F4F9;margin-bottom:16px;}
          .am-ph{width:84px;height:84px;border-radius:20px;background:#F1F4F9;border:2px dashed #CBD5E1;
            display:flex;align-items:center;justify-content:center;color:#94A3B8;}
          .am-ph svg{width:26px;height:26px;}
          .am-up{font-size:12px;font-weight:600;color:var(--cr-primary);}
          details.am-sec{border:1px solid #E7ECF3;border-radius:11px;margin-bottom:10px;overflow:hidden;}
          details.am-sec[open]{border-color:#DCE4F0;}
          .am-sum{list-style:none;cursor:pointer;padding:13px 16px;display:flex;align-items:center;gap:10px;
            background:#FAFBFD;}
          .am-sum::-webkit-details-marker{display:none;}
          .am-sum svg{width:16px;height:16px;flex:0 0 16px;color:#64748B;}
          .am-sum svg.lead{width:16px;height:16px;color:#64748B;}
          .am-sum .t{font-size:13.5px;font-weight:700;white-space:nowrap;}
          .am-sum .req{color:#DC2626;font-weight:700;}
          .am-sum .chev{margin-left:auto;width:16px;height:16px;color:#94A3B8;transition:transform .15s;flex:0 0 16px;}
          details[open] .am-sum .chev{transform:rotate(180deg);}
          .am-grid{padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px;}
          .am-f.full{grid-column:1 / -1;}
          .am-f .k{font-size:12px;font-weight:600;color:#475569;margin-bottom:5px;display:block;}
          .am-f .k .req{color:#DC2626;}
          .am-in{height:38px;border:1px solid #E3E8F0;border-radius:8px;display:flex;align-items:center;
            padding:0 12px;font-size:13px;color:#0E1729;background:#fff;}
          .am-in.ph{color:#A8B2C2;}
          .am-in.sel{justify-content:space-between;}
          .am-in.sel svg{width:15px;height:15px;color:#94A3B8;}
          .am-foot{padding:14px 22px;border-top:1px solid #EEF1F6;display:flex;justify-content:flex-end;gap:10px;flex:0 0 auto;}
          .am-btn{height:38px;padding:0 18px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;white-space:nowrap;}
          .am-btn.ghost{background:#fff;border:1px solid #E3E8F0;color:#334155;}
          .am-btn.primary{background:var(--cr-primary);color:#fff;}
        `}</style>

        <div className="am-modal">
          <div className="am-head">
            <div className="ic">{isEdit ? I.edit : I.userplus}</div>
            <h2>{isEdit ? '교인 정보 수정' : '새 교인 등록'}</h2>
            <a className="x" href={back}>{I.x}</a>
          </div>

          <div className="am-body">
            <div className="am-photo">
              <div className="am-ph">{I.users}</div>
              <div className="am-up">＋ 프로필 사진 업로드</div>
            </div>

            <details className="am-sec" open>
              <summary className="am-sum">{I.users}<span className="t">기본 정보 <span className="req">*</span></span>{I.chevD && <span className="chev">{I.chevD}</span>}</summary>
              <div className="am-grid">
                {isEdit ? fldVal('이름', '박지훈', true) : fld('이름', '홍길동', true)}
                {isEdit ? fldVal('영문명', 'Park Ji-hun') : fld('영문명', 'Hong Gil Dong')}
                {fldVal('이메일', 'park.jh@grace.church', true)}
                {fldVal('전화번호', '010-9931-2207', true)}
                {sel('성별', '남성')}
                {sel('생년월일', '1992.07.18')}
              </div>
            </details>

            <details className="am-sec" open>
              <summary className="am-sum">{I.shield}<span className="t">교회 정보</span><span className="chev">{I.chevD}</span></summary>
              <div className="am-grid">
                {sel('직분', '성도')}
                {sel('조직', '1구역')}
                {sel('부서', '청년부')}
                {sel('상태', '새가족')}
                {sel('임명일', '선택', true)}
                {fld('안수교회', '안수받은 교회')}
              </div>
            </details>

            {collapsed(I.heart, '개인 및 가족 정보')}
            {collapsed(I.pin, '주소 정보')}
            {collapsed(I.org, '직업 정보')}
            {collapsed(I.book, '사역 정보 확장')}
            {collapsed(I.plus, '자유 필드 · 특별 사항')}
          </div>

          <div className="am-foot">
            <a className="am-btn ghost" href={back} style={{textDecoration:'none',display:'inline-flex',alignItems:'center'}}>취소</a>
            <button className="am-btn primary">{isEdit ? '수정 저장' : '교인 등록'}</button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );

  function fld(k, ph, req){
    return <div className="am-f"><label className="k">{k}{req&&<span className="req"> *</span>}</label><div className="am-in ph">{ph}</div></div>;
  }
  function fldVal(k, v, req){
    return <div className="am-f"><label className="k">{k}{req&&<span className="req"> *</span>}</label><div className="am-in">{v}</div></div>;
  }
  function sel(k, v, ph){
    const opts = ({'성별':['남성','여성'],'직분':['목사','장로','권사','집사','성도','청년'],'조직':['1구역','2구역','3구역','4구역','5구역'],'부서':['담임목회','청년부','교육부','찬양팀','없음'],'상태':['새가족','정착중','정착','관심'],'생년월일':['1992.07.18','직접 입력'],'임명일':['선택','직접 입력']})[k] || [v];
    return <div className="am-f"><label className="k">{k}</label><CDropdown cls={'am-in sel'+(ph?' ph':'')} value={v} options={opts} block /></div>;
  }
  function collapsed(icon, title){
    return <details className="am-sec"><summary className="am-sum">{icon}<span className="t">{title}</span><span className="chev">{I.chevD}</span></summary>
      <div className="am-grid"><div className="am-f full" style={{fontSize:'12.5px',color:'#94A3B8',padding:'2px 0'}}>펼치면 세부 입력 항목이 표시됩니다.</div></div></details>;
  }
}

window.AddMemberScreen = AddMemberScreen;
