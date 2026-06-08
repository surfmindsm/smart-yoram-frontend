import { useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';

interface LayoutOutletContext {
  setPageTitle: (title: string | undefined) => void;
  setPageLeading: (leading: React.ReactNode) => void;
  setPageSubtitle: (subtitle: string | undefined) => void;
  setPageActions: (actions: React.ReactNode) => void;
}

/**
 * 상단바 페이지 타이틀 좌측에 prefix(예: 뒤로가기 버튼)를 설정합니다.
 * 진입형 서브 페이지에서 사용.
 */
export function usePageLeading(leading: React.ReactNode, deps: React.DependencyList = []): void {
  const ctx = useOutletContext<LayoutOutletContext | undefined>();
  const setFn = ctx?.setPageLeading;
  const leadingRef = useRef(leading);
  leadingRef.current = leading;
  useEffect(() => {
    if (!setFn) return;
    setFn(leadingRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFn, ...deps]);
  useEffect(() => {
    return () => {
      if (setFn) setFn(null);
    };
  }, [setFn]);
}

/**
 * Layout 탑바의 페이지명을 사이드바 활성 메뉴 대신 강제로 지정합니다.
 * 서브 페이지(예: 헌금 일괄 입력)에서 사용.
 */
export function usePageTitle(title: string | undefined): void {
  const ctx = useOutletContext<LayoutOutletContext | undefined>();
  const setFn = ctx?.setPageTitle;

  useEffect(() => {
    if (!setFn) return;
    setFn(title);
    return () => setFn(undefined);
  }, [setFn, title]);
}

/**
 * Layout 탑바의 페이지명 옆에 부제를 설정합니다.
 */
export function usePageSubtitle(subtitle: string | undefined): void {
  const ctx = useOutletContext<LayoutOutletContext | undefined>();
  const setFn = ctx?.setPageSubtitle;

  useEffect(() => {
    if (!setFn) return;
    setFn(subtitle);
    return () => setFn(undefined);
  }, [setFn, subtitle]);
}

/**
 * Layout 탑바 우측에 페이지별 액션 버튼들을 설정합니다.
 *
 * 매 렌더링마다 최신 액션을 ref에 저장하고, deps 변경 시점에만 push.
 * cleanup은 컴포넌트 언마운트 시 1회만 실행.
 */
export function usePageActions(actions: React.ReactNode, deps: React.DependencyList = []): void {
  const ctx = useOutletContext<LayoutOutletContext | undefined>();
  const setFn = ctx?.setPageActions;

  // 최신 actions를 항상 ref에 보관
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  // deps 변경 시에만 push
  useEffect(() => {
    if (!setFn) return;
    setFn(actionsRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFn, ...deps]);

  // 언마운트 시 한 번만 정리
  useEffect(() => {
    return () => {
      if (setFn) setFn(null);
    };
  }, [setFn]);
}
