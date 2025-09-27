import React from 'react';
import { useGlobalSpinner, usePageSpinner, useComponentSpinner } from '../contexts/SpinnerContext';
import { Button } from './ui';

const SpinnerDemo: React.FC = () => {
  const globalSpinner = useGlobalSpinner();
  const pageSpinner = usePageSpinner();
  const componentSpinner = useComponentSpinner('demo-section');

  const handleGlobalSpinner = async () => {
    globalSpinner.show('전역 데이터를 로딩 중...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    globalSpinner.hide();
  };

  const handlePageSpinner = async () => {
    pageSpinner.show('페이지를 로딩 중...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    pageSpinner.hide();
  };

  const handleComponentSpinner = async () => {
    componentSpinner.show('default', 'default', '컴포넌트 로딩 중...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    componentSpinner.hide();
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">중앙 집중식 스피너 데모</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">전역 스피너</h3>
          <p className="text-sm text-gray-600 mb-3">
            전체 화면을 덮는 스피너 (API 호출, 초기 로딩 등)
          </p>
          <Button onClick={handleGlobalSpinner} className="w-full">
            전역 스피너 테스트
          </Button>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">페이지 스피너</h3>
          <p className="text-sm text-gray-600 mb-3">
            페이지 수준의 로딩 스피너
          </p>
          <Button onClick={handlePageSpinner} className="w-full">
            페이지 스피너 테스트
          </Button>
        </div>

        <div className="p-4 border rounded-lg relative">
          <h3 className="font-semibold mb-2">컴포넌트 스피너</h3>
          <p className="text-sm text-gray-600 mb-3">
            특정 컴포넌트/섹션의 로딩 스피너
          </p>
          <Button onClick={handleComponentSpinner} className="w-full">
            컴포넌트 스피너 테스트
          </Button>

          {componentSpinner.isVisible() && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <componentSpinner.SpinnerComponent />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">사용법</h3>
        <pre className="text-sm overflow-x-auto">
{`// 전역 스피너 (전체 화면 덮음)
const globalSpinner = useGlobalSpinner();
globalSpinner.show('로딩 중...');
globalSpinner.hide();

// 페이지 스피너
const pageSpinner = usePageSpinner();
pageSpinner.show('페이지 로딩 중...');
pageSpinner.hide();

// 컴포넌트별 스피너
const componentSpinner = useComponentSpinner('unique-id');
componentSpinner.show('default', 'default', '로딩 중...');
componentSpinner.hide();`}
        </pre>
      </div>
    </div>
  );
};

export default SpinnerDemo;