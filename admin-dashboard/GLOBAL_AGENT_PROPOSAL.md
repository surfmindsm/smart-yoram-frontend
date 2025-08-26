# 전역 기본 에이전트 제안서

## 문제점
현재 각 교회(테넌트)마다 개별적으로 에이전트를 생성해야 하며, 에이전트가 없는 경우 채팅 기능이 작동하지 않습니다.

## 해결 방안: 전역 기본 에이전트 (ID: 0)

### 1. 백엔드 구현 제안

```python
# 전역 기본 에이전트 정보
GLOBAL_DEFAULT_AGENT = {
    "id": 0,
    "name": "기본 AI 도우미",
    "category": "일반", 
    "description": "모든 교회에서 사용 가능한 공통 AI 도우미입니다.",
    "is_active": True,
    "church_id": None,  # 특별히 null로 설정하여 전역 에이전트임을 표시
    "system_prompt": """
당신은 모든 교회에서 사용할 수 있는 기본 AI 도우미입니다.
- 일반적인 질문에 답변
- 교회 업무 관련 기본 안내  
- 친절하고 정중한 톤으로 응답
- 특정 교회 데이터가 필요한 경우 관리자에게 문의하도록 안내
"""
}

# API 엔드포인트에서 agent_id가 0이거나 해당 교회에 에이전트가 없을 때
def get_agent_for_chat(agent_id, church_id):
    if agent_id == 0:
        return GLOBAL_DEFAULT_AGENT
    
    # 일반 에이전트 조회
    agent = get_agent_by_id(agent_id, church_id)
    if not agent:
        # 해당 교회에 에이전트가 없으면 전역 기본 에이전트 반환
        return GLOBAL_DEFAULT_AGENT
    
    return agent
```

### 2. 프론트엔드 구현 (현재 적용됨)

```typescript
// constants/agents.ts
export const DEFAULT_AGENT_ID = 0;  // 전역 기본 에이전트 ID

export const DEFAULT_AGENT = {
  id: 0,
  name: '기본 AI 도우미',
  category: '일반',
  description: '모든 교회에서 사용 가능한 공통 AI 도우미입니다.',
  isActive: true
};

// 사용 예시
const agentId = selectedAgentForChat?.id || agents?.[0]?.id || DEFAULT_AGENT.id;
```

### 3. 장점

1. **즉시 사용 가능**: 새 교회 등록 시 별도 설정 없이 바로 AI 채팅 가능
2. **테넌트 간 일관성**: 모든 교회에서 동일한 기본 경험 제공
3. **점진적 확장**: 기본 에이전트로 시작 → 필요시 커스텀 에이전트 추가
4. **오류 방지**: 에이전트가 없어서 채팅이 안 되는 문제 해결
5. **유지보수 효율성**: 공통 기능을 중앙에서 관리

### 4. 구현 우선순위

1. **1단계**: 백엔드에서 ID 0을 전역 기본 에이전트로 처리
2. **2단계**: 각 교회의 첫 번째 API 호출 시 기본 에이전트 자동 포함
3. **3단계**: 관리자 UI에서 기본 에이전트 커스터마이징 옵션 제공

### 5. API 변경 제안

```
GET /agents/ 응답에 항상 기본 에이전트(ID: 0) 포함
POST /chat/histories 에서 agent_id: 0 허용
POST /chat/messages 에서 agent_id: 0 허용
```

이 구조로 구현하면 모든 교회에서 안정적으로 AI 채팅을 사용할 수 있습니다.