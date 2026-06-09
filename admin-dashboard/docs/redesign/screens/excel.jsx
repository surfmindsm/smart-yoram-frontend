// Church Round · Direction C — 엑셀 관리
// Canonical = ExcelManagement. 교인 명단 내보내기/가져오기 + 템플릿 + 가져오기 기록.
// Exports window.ExcelScreen

function ExcelScreen({ caseId }) {
  const I = window.ICONS, C = window.C;

  const imports = [
    ['교인명단_2026상반기.xlsx','842','840','2','2026.05.20 14:32','success'],
    ['새가족_5월.xlsx','7','7','0','2026.05.28 10:05','success'],
    ['구역개편_명단.xlsx','164','150','14','2026.05.12 16:40','partial'],
  ];
  const ST = { success:['완료',C.st.success], partial:['일부 오류',C.st.warning], failed:['실패',C.st.danger] };

  return (
    <CShell
      active="excel"
      title="엑셀 관리"
      subtitle="교인 명단을 일괄로 가져오거나 내보냅니다"
    >
      <style>{`
        .ex-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
        .ex-card{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);padding:22px;}
        .ex-ic{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;}
        .ex-ic svg{width:22px;height:22px;}
        .ex-t{font-size:16px;font-weight:750;letter-spacing:-.01em;}
        .ex-d{font-size:13px;color:#64748B;margin-top:5px;line-height:1.55;}
        .ex-btn{height:40px;padding:0 18px;border-radius:9px;font-size:13px;font-weight:600;border:none;cursor:pointer;
          display:inline-flex;align-items:center;gap:7px;margin-top:16px;}
        .ex-btn svg{width:15px;height:15px;}
        .ex-btn.pri{background:var(--cr-primary);color:#fff;}
        .ex-btn.ghost{background:#fff;color:#334155;border:1px solid #E3E8F0;}
        .ex-drop{border:2px dashed #CBD5E1;border-radius:12px;padding:26px;text-align:center;margin-top:16px;}
        .ex-drop .di{width:40px;height:40px;border-radius:10px;background:#EEF3FC;color:var(--cr-primary);display:flex;
          align-items:center;justify-content:center;margin:0 auto 10px;}
        .ex-drop .di svg{width:19px;height:19px;}
        .ex-drop .dt{font-size:13px;font-weight:600;color:#475569;}
        .ex-drop .dh{font-size:11.5px;color:#94A3B8;margin-top:3px;}
        .ex-tcard{background:#fff;border:1px solid #E3E8F0;border-radius:var(--cr-radius);overflow:hidden;}
        .ex-ch{padding:15px 18px;border-bottom:1px solid #EEF1F6;display:flex;align-items:center;justify-content:space-between;}
        .ex-ct{font-size:14px;font-weight:700;}
        .ex-scroll{overflow-x:auto;}
        .ex-table{width:100%;min-width:680px;border-collapse:collapse;font-size:12.5px;}
        .ex-table th{text-align:left;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;
          letter-spacing:.04em;padding:11px 18px;border-bottom:1px solid #EEF1F6;background:#FAFBFD;white-space:nowrap;}
        .ex-table th.r,.ex-table td.r{text-align:right;}
        .ex-table td{padding:12px 18px;border-bottom:1px solid #F1F4F9;color:#334155;white-space:nowrap;}
        .ex-table tr:last-child td{border-bottom:none;}
        .ex-fn{display:inline-flex;align-items:center;gap:8px;font-weight:600;color:#0E1729;}
        .ex-fn svg{width:15px;height:15px;color:#16A34A;}
        .ex-st{font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:999px;}
      `}</style>

      {caseId === '로딩' ? <CLoading rows={5} /> :
      (<React.Fragment>
      <div className="ex-grid">
        <div className="ex-card">
          <div className="ex-ic" style={{background:C.st.success[0],color:C.st.success[1]}}>{I.download}</div>
          <div className="ex-t">교인 명단 내보내기</div>
          <div className="ex-d">전체 교인 842명의 정보를 엑셀(.xlsx) 파일로 다운로드합니다. 필터·구역별 내보내기도 가능합니다.</div>
          <button className="ex-btn pri">{I.download}전체 명단 다운로드</button>
        </div>
        <div className="ex-card">
          <div className="ex-ic" style={{background:'#EEF3FC',color:C.blue}}>{I.upload}</div>
          <div className="ex-t">교인 명단 가져오기</div>
          <div className="ex-d">엑셀 양식에 맞춰 교인 정보를 일괄 등록합니다. 먼저 <b style={{color:C.blue}}>양식 템플릿</b>을 내려받아 작성해 주세요.</div>
          <div className="ex-drop">
            <div className="di">{I.upload}</div>
            <div className="dt">파일을 끌어다 놓거나 클릭해 업로드</div>
            <div className="dh">.xlsx · 최대 5MB</div>
          </div>
        </div>
      </div>

      <div className="ex-tcard">
        <div className="ex-ch"><div className="ex-ct">가져오기 기록</div><span style={{fontSize:'12px',color:C.blue,fontWeight:600,display:'inline-flex',alignItems:'center',gap:5,whiteSpace:'nowrap'}}>{I.download}양식 템플릿</span></div>
        <div className="ex-scroll">
          <table className="ex-table">
            <thead><tr><th>파일명</th><th className="r">전체</th><th className="r">성공</th><th className="r">오류</th><th>처리 일시</th><th>상태</th></tr></thead>
            <tbody>
              {imports.map((r,i)=>{
                const [fn,total,ok,err,when,stat]=r;
                const [sl,sc]=ST[stat];
                return (
                  <tr key={i}>
                    <td><span className="ex-fn">{I.excel}{fn}</span></td>
                    <td className="r" style={{fontWeight:700}}>{total}</td>
                    <td className="r" style={{color:'#16A34A',fontWeight:600}}>{ok}</td>
                    <td className="r" style={{color:err==='0'?'#94A3B8':'#DC2626',fontWeight:600}}>{err}</td>
                    <td style={{color:'#64748B'}}>{when}</td>
                    <td><span className="ex-st" style={{background:sc[0],color:sc[1]}}>{sl}</span></td>
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

ExcelScreen.cases = ['기본', '로딩'];
window.ExcelScreen = ExcelScreen;
