import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Spinner } from '../components/ui/spinner';

interface SpinnerContextType {
  showSpinner: (id: string, size?: 'sm' | 'default' | 'lg' | 'xl', variant?: 'default' | 'muted' | 'white' | 'destructive', text?: string) => void;
  hideSpinner: (id: string) => void;
  isSpinnerVisible: (id: string) => boolean;
}

interface SpinnerState {
  size: 'sm' | 'default' | 'lg' | 'xl';
  variant: 'default' | 'muted' | 'white' | 'destructive';
  text?: string;
}

const SpinnerContext = createContext<SpinnerContextType | undefined>(undefined);

export const useSpinner = () => {
  const context = useContext(SpinnerContext);
  if (!context) {
    throw new Error('useSpinner must be used within a SpinnerProvider');
  }
  return context;
};

interface SpinnerProviderProps {
  children: ReactNode;
}

export const SpinnerProvider: React.FC<SpinnerProviderProps> = ({ children }) => {
  const [spinners, setSpinners] = useState<Map<string, SpinnerState>>(new Map());

  const showSpinner = (
    id: string,
    size: 'sm' | 'default' | 'lg' | 'xl' = 'default',
    variant: 'default' | 'muted' | 'white' | 'destructive' = 'default',
    text?: string
  ) => {
    setSpinners(prev => {
      const newSpinners = new Map(prev);
      newSpinners.set(id, { size, variant, text });
      return newSpinners;
    });
  };

  const hideSpinner = (id: string) => {
    setSpinners(prev => {
      const newSpinners = new Map(prev);
      newSpinners.delete(id);
      return newSpinners;
    });
  };

  const isSpinnerVisible = (id: string) => {
    return spinners.has(id);
  };

  return (
    <SpinnerContext.Provider value={{ showSpinner, hideSpinner, isSpinnerVisible }}>
      {children}

      {/* Global Spinner Overlay */}
      {Array.from(spinners.entries()).map(([id, config]) => {
        // 전역 스피너 (page-loading, global-loading 등)
        if (id.includes('global') || id.includes('page-loading')) {
          return (
            <div
              key={id}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="text-center">
                <Spinner size={config.size} variant={config.variant} />
                {config.text && (
                  <p className="mt-4 text-sm text-muted-foreground">{config.text}</p>
                )}
              </div>
            </div>
          );
        }
        return null;
      })}
    </SpinnerContext.Provider>
  );
};

// 편의 훅들
export const useGlobalSpinner = () => {
  const { showSpinner, hideSpinner, isSpinnerVisible } = useSpinner();

  return {
    show: (text?: string) => showSpinner('global-loading', 'xl', 'default', text),
    hide: () => hideSpinner('global-loading'),
    isVisible: () => isSpinnerVisible('global-loading'),
  };
};

export const usePageSpinner = () => {
  const { showSpinner, hideSpinner, isSpinnerVisible } = useSpinner();

  return {
    show: (text?: string) => showSpinner('page-loading', 'lg', 'default', text),
    hide: () => hideSpinner('page-loading'),
    isVisible: () => isSpinnerVisible('page-loading'),
  };
};

// 컴포넌트용 스피너 훅
export const useComponentSpinner = (componentId: string) => {
  const { showSpinner, hideSpinner, isSpinnerVisible } = useSpinner();

  return {
    show: (size: 'sm' | 'default' | 'lg' | 'xl' = 'default', variant: 'default' | 'muted' | 'white' | 'destructive' = 'default', text?: string) =>
      showSpinner(`component-${componentId}`, size, variant, text),
    hide: () => hideSpinner(`component-${componentId}`),
    isVisible: () => isSpinnerVisible(`component-${componentId}`),
    SpinnerComponent: ({ className }: { className?: string }) => {
      const state = isSpinnerVisible(`component-${componentId}`);
      if (!state) return null;

      // 기본 설정 사용
      return (
        <div className={className}>
          <Spinner size="default" variant="default" />
        </div>
      );
    }
  };
};