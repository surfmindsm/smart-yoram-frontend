import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Download, Loader, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

interface BaseAIToolProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onGenerate: (inputs: any) => Promise<string>;
  onAutoFill?: (basicInfo: any) => Promise<any>;
  basicFields?: React.ReactNode;
}

const BaseAITool: React.FC<BaseAIToolProps> = ({
  title,
  description,
  icon: IconComponent,
  children,
  onGenerate,
  onAutoFill,
  basicFields
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [result, setResult] = useState<string>('');
  const [inputs, setInputs] = useState<any>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const generatedContent = await onGenerate(inputs);
      setResult(generatedContent);
    } catch (error) {
      console.error('생성 중 오류 발생:', error);
      // TODO: 에러 처리 UI 추가
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      // TODO: 복사 완료 토스트 메시지 추가
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAutoFill = async () => {
    if (!onAutoFill) return;
    
    setIsAutoFilling(true);
    try {
      const autoFilledData = await onAutoFill(inputs);
      setInputs({ ...inputs, ...autoFilledData });
      setShowAdvanced(true);
    } catch (error) {
      console.error('자동 입력 중 오류 발생:', error);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setInputs((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/ai-tools')}
          className="mb-4 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          AI Tools로 돌아가기
        </Button>
        
        <div className="flex items-center mb-4">
          <div className="p-3 bg-sky-50 rounded-lg mr-4">
            <IconComponent className="h-8 w-8 text-sky-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <p className="text-slate-600 mt-1">{description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 입력 영역 */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">입력 정보</h2>
          
          {/* 기본 입력 필드 */}
          {basicFields && !showAdvanced && (
            <div className="space-y-4 mb-6">
              {React.isValidElement(basicFields) 
                ? React.cloneElement(basicFields, {
                    onInputChange: handleInputChange,
                    inputs
                  } as any)
                : basicFields
              }
              
              <div className="pt-4 border-t border-slate-100">
                {onAutoFill && (
                  <Button
                    onClick={handleAutoFill}
                    disabled={isAutoFilling}
                    variant="outline"
                    className="w-full mb-3"
                  >
                    {isAutoFilling ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        AI가 자동 입력 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI 자동 입력
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={() => setShowAdvanced(true)}
                  variant="ghost"
                  className="w-full text-sm"
                >
                  직접 입력하기
                </Button>
              </div>
            </div>
          )}

          {/* 전체 입력 필드 (기본 필드가 없거나 고급 모드일 때) */}
          {(!basicFields || showAdvanced) && (
            <div className="space-y-4">
              {showAdvanced && basicFields && (
                <Button
                  onClick={() => setShowAdvanced(false)}
                  variant="ghost"
                  size="sm"
                  className="mb-4"
                >
                  ← 간단 입력으로 돌아가기
                </Button>
              )}
              
              {React.isValidElement(children) 
                ? React.cloneElement(children, {
                    onInputChange: handleInputChange,
                    inputs
                  } as any)
                : children
              }
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Button
              onClick={handleGenerate}
              disabled={isLoading || isAutoFilling}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                '생성하기'
              )}
            </Button>
          </div>
        </div>

        {/* 결과 영역 */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">생성 결과</h2>
            {result && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  복사
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-1" />
                  다운로드
                </Button>
              </div>
            )}
          </div>

          <div className="min-h-[400px] bg-slate-50 rounded-lg p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin text-sky-600 mx-auto mb-4" />
                  <p className="text-slate-600">AI가 콘텐츠를 생성하고 있습니다...</p>
                </div>
              </div>
            ) : result ? (
              <div className="whitespace-pre-wrap text-slate-900 leading-relaxed">
                {result}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">
                  좌측에서 정보를 입력하고 '생성하기' 버튼을 클릭하세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseAITool;
