// Church Round · shared mount helper — wraps any C screen with a Tweaks panel.
// Adds a "케이스 / 상태" control (driven by Screen.cases) so each screen can
// toggle between scenarios (기본 / 빈 상태 / 로딩 / 탭 변형 / 에러 …).
// The selected case string is passed to the screen as the `caseId` prop.
//   window.mountCR(MyScreenComponent)   // MyScreenComponent.cases = ['기본', …]
// Exports window.mountCR, window.CR_TWEAK_DEFAULTS

window.CR_TWEAK_DEFAULTS = {
  primary: '#1C7CFF',
  sidebar: '다크',
  density: '편안',
  radius: 12,
};

window.mountCR = function (Screen) {
  const Panel = window.TweaksPanel, TSection = window.TweakSection,
        TColor = window.TweakColor, TRadio = window.TweakRadio,
        TSlider = window.TweakSlider, TSelect = window.TweakSelect;

  const cases = Array.isArray(Screen.cases) && Screen.cases.length ? Screen.cases : null;
  const defaults = { ...window.CR_TWEAK_DEFAULTS };
  if (cases) defaults._case = cases[0];

  function App() {
    const [t, setTweak] = window.useTweaks(defaults);
    const themeKey = t.sidebar === '라이트' ? 'light' : 'dark';
    const vars = {
      ...window.C.sidebarThemes[themeKey],
      '--cr-primary': t.primary,
      '--cr-cell-py': t.density === '조밀' ? '8px' : '12px',
      '--cr-nav-py': t.density === '조밀' ? '5px' : '7px',
      '--cr-radius': t.radius + 'px',
    };
    const caseId = cases ? (t._case || cases[0]) : undefined;
    return (
      <div style={vars}>
        <Screen caseId={caseId} />
        <Panel>
          {cases && (
            <React.Fragment>
              <TSection label="케이스 · 화면 상태" />
              {cases.length <= 3
                ? <TRadio label="상태" value={caseId} options={cases} onChange={(v) => setTweak('_case', v)} />
                : <TSelect label="상태" value={caseId} options={cases} onChange={(v) => setTweak('_case', v)} />}
            </React.Fragment>
          )}
          <TSection label="브랜드" />
          <TColor label="포인트 색" value={t.primary}
            options={['#1C7CFF', '#2563EB', '#0E7C66', '#7A5AE0']}
            onChange={(v) => setTweak('primary', v)} />
          <TSection label="레이아웃" />
          <TRadio label="사이드바" value={t.sidebar} options={['다크', '라이트']}
            onChange={(v) => setTweak('sidebar', v)} />
          <TRadio label="밀도" value={t.density} options={['편안', '조밀']}
            onChange={(v) => setTweak('density', v)} />
          <TSlider label="모서리 둥글기" value={t.radius} min={4} max={18} unit="px"
            onChange={(v) => setTweak('radius', v)} />
        </Panel>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
};
