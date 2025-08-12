import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Settings, Key, Brain, DollarSign } from 'lucide-react';
import { churchConfigService } from '../services/api';

interface GPTConfig {
  api_key: string;
  model: string;
  max_tokens: number;
  temperature: number;
}

interface SystemStatus {
  gpt_api: {
    configured: boolean;
    model: string;
    last_test: string;
    status: string;
  };
}

interface ChurchProfile {
  gpt_api_configured: boolean;
  monthly_usage: {
    total_tokens: number;
    total_requests: number;
    total_cost: number;
    remaining_quota: number;
  };
}

const GPTSettings: React.FC = () => {
  const [config, setConfig] = useState<GPTConfig>({
    api_key: '',
    model: 'gpt-4o-mini',
    max_tokens: 2000,
    temperature: 0.7,
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [churchProfile, setChurchProfile] = useState<ChurchProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load current configuration
  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    setLoading(true);
    try {
      // Load system status
      const gptConfig = await churchConfigService.getGptConfig();
      
      // Convert response to expected format
      const statusResponse = {
        success: true,
        data: {
          gpt_api: {
            configured: !!gptConfig.api_key,
            model: gptConfig.model || 'gpt-4o-mini',
            last_test: null, // Not available in current API
            status: gptConfig.is_active ? 'active' : 'inactive'
          }
        }
      };
      
      setSystemStatus(statusResponse.data);
      
      // Set current model if configured
      if (statusResponse.data.gpt_api.configured) {
        setConfig(prev => ({
          ...prev,
          model: statusResponse.data.gpt_api.model || 'gpt-4o-mini',
          api_key: '********' // Don't show actual key
        }));
      }

      // Load church profile for usage stats
      const churchProfile = await churchConfigService.getChurchProfile();
      
      // Convert to expected format (add default values if needed)
      const profileData = {
        gpt_api_configured: !!gptConfig.api_key,
        monthly_usage: {
          total_tokens: churchProfile.current_month_tokens || 0,
          total_requests: 0, // Not available in current API
          total_cost: 0, // Not available in current API
          remaining_quota: (churchProfile.monthly_token_limit || 100000) - (churchProfile.current_month_tokens || 0)
        }
      };
      
      setChurchProfile(profileData);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setMessage({ type: 'error', text: '설정을 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't send the masked API key
    if (config.api_key === '********') {
      setMessage({ type: 'info', text: 'API 키를 변경하려면 새로운 키를 입력하세요.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await churchConfigService.updateGptConfig(config);
      
      // If we reach here without error, the save was successful
      setMessage({ type: 'success', text: 'GPT API 설정이 성공적으로 저장되었습니다!' });
      setConfig(prev => ({ ...prev, api_key: '********' })); // Mask the key after saving
      await loadCurrentConfig(); // Reload to get updated status
    } catch (error: any) {
      console.error('Failed to save configuration:', error);
      const errorMessage = error.response?.data?.detail || '설정 저장에 실패했습니다.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const modelPricing = {
    'gpt-4o-mini': { input: 0.00015, output: 0.0006, description: '가장 경제적 (GPT-4 대비 120배 저렴)' },
    'gpt-4o': { input: 0.005, output: 0.015, description: '빠르고 강력함' },
    'gpt-4': { input: 0.03, output: 0.06, description: '최고 성능' },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015, description: '매우 경제적' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          GPT API 설정
        </h1>
        <p className="text-gray-600 mt-2">
          교회 AI 에이전트가 사용할 OpenAI GPT API를 설정합니다.
        </p>
      </div>

      {/* Current Status */}
      {systemStatus && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              현재 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">API 상태</p>
                <p className="font-semibold flex items-center gap-1">
                  {systemStatus.gpt_api.configured ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      활성화
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      미설정
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">현재 모델</p>
                <p className="font-semibold">{systemStatus.gpt_api.model || '-'}</p>
              </div>
              {churchProfile && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">이번 달 사용량</p>
                    <p className="font-semibold">
                      {churchProfile.monthly_usage.total_tokens.toLocaleString()} 토큰
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">이번 달 비용</p>
                    <p className="font-semibold">
                      ${churchProfile.monthly_usage.total_cost.toFixed(2)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API 설정
          </CardTitle>
          <CardDescription>
            OpenAI 플랫폼에서 발급받은 API 키와 모델 설정을 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key">OpenAI API 키</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  placeholder="sk-proj-..."
                  required={config.api_key !== '********'}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? '숨기기' : '보기'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  OpenAI 플랫폼
                </a>
                에서 API 키를 발급받을 수 있습니다.
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">AI 모델</Label>
              <Select value={config.model} onValueChange={(value) => setConfig({ ...config, model: value })}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(modelPricing).map(([model, pricing]) => (
                    <SelectItem key={model} value={model}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model}</span>
                        <span className="text-xs text-gray-500 ml-2">{pricing.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {config.model && modelPricing[config.model as keyof typeof modelPricing] && (
                <p className="text-xs text-gray-500">
                  비용: 입력 ${modelPricing[config.model as keyof typeof modelPricing].input}/1K 토큰, 
                  출력 ${modelPricing[config.model as keyof typeof modelPricing].output}/1K 토큰
                </p>
              )}
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <Label htmlFor="max-tokens">
                최대 토큰 수: {config.max_tokens}
              </Label>
              <Slider
                id="max-tokens"
                min={100}
                max={8000}
                step={100}
                value={[config.max_tokens]}
                onValueChange={(value) => setConfig({ ...config, max_tokens: value[0] })}
              />
              <p className="text-xs text-gray-500">
                AI 응답의 최대 길이를 제한합니다. (100-8000)
              </p>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperature: {config.temperature}
              </Label>
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[config.temperature]}
                onValueChange={(value) => setConfig({ ...config, temperature: value[0] })}
              />
              <p className="text-xs text-gray-500">
                0에 가까울수록 일관적, 1에 가까울수록 창의적인 응답
              </p>
            </div>

            {/* Messages */}
            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{message.type === 'success' ? '성공' : message.type === 'error' ? '오류' : '알림'}</AlertTitle>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? '저장 중...' : '설정 저장'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cost Management Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            비용 관리 팁
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>
                <strong>GPT-4o-mini</strong>를 사용하면 GPT-4 대비 <strong>120배</strong> 저렴합니다.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Temperature를 낮추면 더 일관적인 응답을 얻고 토큰 사용량을 줄일 수 있습니다.</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>최대 토큰 수를 적절히 제한하여 불필요한 긴 응답을 방지하세요.</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">⚠</span>
              <span>월간 사용량을 정기적으로 모니터링하여 예상치 못한 비용을 방지하세요.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">ℹ</span>
              <span>테스트 중이라면 API 키를 비워두면 자동으로 테스트 모드가 활성화됩니다.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default GPTSettings;