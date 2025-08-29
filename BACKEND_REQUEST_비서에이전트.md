# AI 비서 에이전트 교회 데이터 연동 백엔드 요청사항

## 개요
비서 에이전트가 교회 데이터베이스를 **우선적으로 활용**하되, 필요시 일반 GPT 지식도 함께 사용할 수 있도록 하는 **균형잡힌 접근방식** 구현 요청.

## 🎯 핵심 요구사항
> **"교회 데이터를 우선하되, 너무 강제적이지 않게"**

### 1. 요청 파라미터 (수정됨)
```typescript
{
  // 기존 파라미터들...
  chat_history_id?: number | null;
  content: string;
  role: string;
  agent_id: string | number;
  messages: Array<{ role: string; content: string }>;
  
  // 🆕 비서 에이전트 균형 파라미터들
  church_data_context?: string;          // 조회된 교회 데이터 (JSON 문자열)
  secretary_mode?: boolean;              // 비서 모드 활성화
  prioritize_church_data?: boolean;      // 교회 데이터 우선 처리 (완전 제한 아님)
  fallback_to_general?: boolean;         // 교회 데이터 부족 시 일반 GPT 응답 허용
}
```

### 2. 구현 로직
- 교회 데이터가 있으면 우선 활용
- 교회 데이터가 부족하면 일반 GPT 지식으로 보완
- 완전 일반 질문에도 적절히 응답

### 3. 응답 메타데이터
```json
{
  "success": true,
  "data": {
    "ai_response": "실제 GPT 답변",
    "is_secretary_agent": true,
    "data_sources": ["교회 데이터베이스", "AI 일반 지식"],
    "query_type": "hybrid_response"
  }
}
```