import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { churchConfigService, churchDbService } from '../services/api';
import {
  Settings, Key, Database, TestTube, CheckCircle, AlertCircle,
  Eye, EyeOff, Plus, Trash2, Edit3
} from 'lucide-react';

interface DbConnection {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'sqlserver';
  host: string;
  port: number;
  database: string;
  username: string;
  isActive: boolean;
  lastTested?: Date;
  status?: 'connected' | 'disconnected' | 'testing';
}

interface GptConfig {
  api_key: string;
  model: string;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
}

interface ChurchProfile {
  name: string;
  address: string;
  pastor_name: string;
  contact_phone: string;
  contact_email: string;
  description?: string;
}

const ChurchSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gpt' | 'database' | 'profile'>('gpt');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // GPT 설정 상태
  const [gptConfig, setGptConfig] = useState<GptConfig>({
    api_key: '',
    model: 'gpt-4',
    max_tokens: 2000,
    temperature: 0.7,
    is_active: false
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // 데이터베이스 연결 상태
  const [dbConnections, setDbConnections] = useState<DbConnection[]>([]);
  const [showDbModal, setShowDbModal] = useState(false);
  const [editingDb, setEditingDb] = useState<DbConnection | null>(null);
  const [newDbConnection, setNewDbConnection] = useState<{
    name: string;
    type: 'mysql' | 'postgresql' | 'sqlserver';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  }>({
    name: '',
    type: 'mysql',
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: ''
  });
  
  // 교회 프로필 상태
  const [churchProfile, setChurchProfile] = useState<ChurchProfile>({
    name: '',
    address: '',
    pastor_name: '',
    contact_phone: '',
    contact_email: '',
    description: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadGptConfig(),
        loadDbConnections(),
        loadChurchProfile()
      ]);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError('설정을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadGptConfig = async () => {
    try {
      const config = await churchConfigService.getGptConfig();
      setGptConfig(config);
    } catch (error) {
      console.error('Failed to load GPT config:', error);
    }
  };

  const loadDbConnections = async () => {
    try {
      const connections = await churchDbService.getDbConnections();
      setDbConnections(connections);
    } catch (error) {
      console.error('Failed to load DB connections:', error);
    }
  };

  const loadChurchProfile = async () => {
    try {
      const profile = await churchConfigService.getChurchProfile();
      setChurchProfile(profile);
    } catch (error) {
      console.error('Failed to load church profile:', error);
    }
  };

  const saveGptConfig = async () => {
    try {
      setSaving(true);
      await churchConfigService.updateGptConfig(gptConfig);
      setError(null);
    } catch (error) {
      console.error('Failed to save GPT config:', error);
      setError('GPT 설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const testGptConnection = async () => {
    try {
      setTestingConnection(true);
      await churchConfigService.testGptConnection();
      setError(null);
      alert('GPT API 연결 테스트가 성공했습니다!');
    } catch (error) {
      console.error('GPT connection test failed:', error);
      setError('GPT API 연결 테스트에 실패했습니다.');
    } finally {
      setTestingConnection(false);
    }
  };

  const testDbConnection = async (connectionId: string) => {
    try {
      setDbConnections(prev => prev.map(conn => 
        conn.id === connectionId ? { ...conn, status: 'testing' } : conn
      ));
      
      await churchDbService.testDbConnection(connectionId);
      
      setDbConnections(prev => prev.map(conn => 
        conn.id === connectionId ? { 
          ...conn, 
          status: 'connected', 
          lastTested: new Date() 
        } : conn
      ));
    } catch (error) {
      console.error('DB connection test failed:', error);
      setDbConnections(prev => prev.map(conn => 
        conn.id === connectionId ? { ...conn, status: 'disconnected' } : conn
      ));
      setError('데이터베이스 연결 테스트에 실패했습니다.');
    }
  };

  const saveChurchProfile = async () => {
    try {
      setSaving(true);
      await churchConfigService.updateChurchProfile(churchProfile);
      setError(null);
    } catch (error) {
      console.error('Failed to save church profile:', error);
      setError('교회 정보 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDbConnection = async () => {
    try {
      const connection = await churchDbService.createDbConnection(newDbConnection);
      setDbConnections(prev => [...prev, connection]);
      setShowDbModal(false);
      setNewDbConnection({
        name: '',
        type: 'mysql',
        host: '',
        port: 3306,
        database: '',
        username: '',
        password: ''
      });
    } catch (error) {
      console.error('Failed to create DB connection:', error);
      setError('데이터베이스 연결 생성에 실패했습니다.');
    }
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">시스템 설정</h1>
        <p className="text-slate-600">GPT API, 데이터베이스 연결 및 교회 정보를 관리합니다</p>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex space-x-8">
          <button
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'gpt'
                ? "border-sky-500 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
            onClick={() => setActiveTab('gpt')}
          >
            <Key className="h-4 w-4 mr-2 inline" />
            GPT API 설정
          </button>
          <button
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'database'
                ? "border-sky-500 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
            onClick={() => setActiveTab('database')}
          >
            <Database className="h-4 w-4 mr-2 inline" />
            데이터베이스 연결
          </button>
          <button
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'profile'
                ? "border-sky-500 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
            onClick={() => setActiveTab('profile')}
          >
            <Settings className="h-4 w-4 mr-2 inline" />
            교회 정보
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">설정을 불러오는 중...</div>
        </div>
      ) : (
        <>
          {/* GPT API 설정 */}
          {activeTab === 'gpt' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">OpenAI GPT API 설정</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      API 키
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        placeholder="sk-..."
                        className="w-full p-3 pr-20 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        value={gptConfig.api_key}
                        onChange={(e) => setGptConfig({ ...gptConfig, api_key: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        모델
                      </label>
                      <select
                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        value={gptConfig.model}
                        onChange={(e) => setGptConfig({ ...gptConfig, model: e.target.value })}
                      >
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        최대 토큰
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="8000"
                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        value={gptConfig.max_tokens}
                        onChange={(e) => setGptConfig({ ...gptConfig, max_tokens: parseInt(e.target.value) })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Temperature (0-1)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        value={gptConfig.temperature}
                        onChange={(e) => setGptConfig({ ...gptConfig, temperature: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <label className="text-sm font-medium text-slate-900">API 활성화</label>
                    <button
                      onClick={() => setGptConfig({ ...gptConfig, is_active: !gptConfig.is_active })}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        gptConfig.is_active ? "bg-sky-600" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          gptConfig.is_active ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <Button
                    onClick={testGptConnection}
                    disabled={testingConnection || !gptConfig.api_key}
                    variant="outline"
                    className="flex items-center"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingConnection ? '테스트 중...' : '연결 테스트'}
                  </Button>
                  <Button
                    onClick={saveGptConfig}
                    disabled={saving || !gptConfig.api_key}
                    className="bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 데이터베이스 연결 설정 */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900">데이터베이스 연결</h3>
                <Button
                  onClick={() => setShowDbModal(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  새 연결 추가
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {dbConnections.map((connection) => (
                  <div key={connection.id} className="bg-white p-6 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Database className="h-5 w-5 text-slate-400" />
                        <div>
                          <h4 className="font-semibold text-slate-900">{connection.name}</h4>
                          <p className="text-sm text-slate-500">
                            {connection.type.toUpperCase()} - {connection.host}:{connection.port}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {connection.status === 'connected' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {connection.status === 'disconnected' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        {connection.status === 'testing' && (
                          <div className="h-5 w-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={() => testDbConnection(connection.id)}
                        disabled={connection.status === 'testing'}
                        variant="outline"
                        size="sm"
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        테스트
                      </Button>
                      <Button
                        onClick={() => setEditingDb(connection)}
                        variant="outline" 
                        size="sm"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        수정
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 교회 정보 설정 */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">교회 기본 정보</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        교회명
                      </label>
                      <input
                        type="text"
                        placeholder="○○교회"
                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        value={churchProfile.name}
                        onChange={(e) => setChurchProfile({ ...churchProfile, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        담임목사님
                      </label>
                      <input
                        type="text"
                        placeholder="홍길동 목사"
                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        value={churchProfile.pastor_name}
                        onChange={(e) => setChurchProfile({ ...churchProfile, pastor_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      교회 주소
                    </label>
                    <input
                      type="text"
                      placeholder="서울시 강남구..."
                      className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      value={churchProfile.address}
                      onChange={(e) => setChurchProfile({ ...churchProfile, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        연락처
                      </label>
                      <input
                        type="tel"
                        placeholder="02-1234-5678"
                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        value={churchProfile.contact_phone}
                        onChange={(e) => setChurchProfile({ ...churchProfile, contact_phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        이메일
                      </label>
                      <input
                        type="email"
                        placeholder="contact@church.com"
                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        value={churchProfile.contact_email}
                        onChange={(e) => setChurchProfile({ ...churchProfile, contact_email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      교회 소개
                    </label>
                    <textarea
                      placeholder="교회에 대한 간단한 소개를 입력해주세요..."
                      rows={4}
                      className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                      value={churchProfile.description || ''}
                      onChange={(e) => setChurchProfile({ ...churchProfile, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={saveChurchProfile}
                    disabled={saving}
                    className="bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 데이터베이스 연결 추가 모달 */}
      {showDbModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">새 데이터베이스 연결</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  연결 이름
                </label>
                <input
                  type="text"
                  placeholder="메인 데이터베이스"
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={newDbConnection.name}
                  onChange={(e) => setNewDbConnection({ ...newDbConnection, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  데이터베이스 유형
                </label>
                <select
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={newDbConnection.type}
                  onChange={(e) => {
                    const dbType = e.target.value as 'mysql' | 'postgresql' | 'sqlserver';
                    setNewDbConnection({ 
                      ...newDbConnection, 
                      type: dbType,
                      port: dbType === 'mysql' ? 3306 : 
                            dbType === 'postgresql' ? 5432 : 1433
                    });
                  }}
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="sqlserver">SQL Server</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    호스트
                  </label>
                  <input
                    type="text"
                    placeholder="localhost"
                    className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    value={newDbConnection.host}
                    onChange={(e) => setNewDbConnection({ ...newDbConnection, host: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    포트
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    value={newDbConnection.port}
                    onChange={(e) => setNewDbConnection({ ...newDbConnection, port: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  데이터베이스명
                </label>
                <input
                  type="text"
                  placeholder="church_db"
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={newDbConnection.database}
                  onChange={(e) => setNewDbConnection({ ...newDbConnection, database: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    사용자명
                  </label>
                  <input
                    type="text"
                    placeholder="username"
                    className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    value={newDbConnection.username}
                    onChange={(e) => setNewDbConnection({ ...newDbConnection, username: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    placeholder="password"
                    className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    value={newDbConnection.password}
                    onChange={(e) => setNewDbConnection({ ...newDbConnection, password: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDbModal(false)}
              >
                취소
              </Button>
              <Button
                onClick={handleCreateDbConnection}
                disabled={!newDbConnection.name || !newDbConnection.host}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                추가
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChurchSettings;
