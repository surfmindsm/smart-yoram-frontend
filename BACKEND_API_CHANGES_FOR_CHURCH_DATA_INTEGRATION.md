# AI Agent 교회 데이터 연동 기능을 위한 백엔드 API 변경사항

## 개요
AI 에이전트가 교회의 실제 데이터(공지사항, 출석현황, 교인현황, 예배정보)를 참조하여 더 정확한 답변을 제공할 수 있도록 하는 기능을 구현하기 위한 백엔드 API 변경사항입니다.

## 1. AI Agent 테이블 스키마 변경

### `ai_agents` 테이블에 새 컬럼 추가
```sql
ALTER TABLE ai_agents ADD COLUMN church_data_sources JSONB DEFAULT '{}';
```

### 컬럼 구조
```json
{
  "announcements": boolean,      // 공지사항 데이터 사용 여부
  "attendances": boolean,        // 출석현황 데이터 사용 여부  
  "members": boolean,            // 교인현황 데이터 사용 여부
  "worship_services": boolean    // 예배정보 데이터 사용 여부
}
```

## 2. AI Agent 생성 API 수정

### 엔드포인트
`POST /api/v1/ai-agents`

### 기존 요청 body에 추가될 필드
```json
{
  "name": "string",
  "category": "string", 
  "description": "string",
  "detailed_description": "string",
  "icon": "string",
  "is_active": boolean,
  "system_prompt": "string",
  "template_id": "string (optional)",
  "church_data_sources": {           // 새로 추가되는 필드
    "announcements": boolean,
    "attendances": boolean, 
    "members": boolean,
    "worship_services": boolean
  }
}
```

### 응답 예시
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "교회 공지 도우미",
    "category": "행정 지원",
    "description": "교회 공지사항을 관리하는 AI 에이전트",
    "detailed_description": "공지사항 작성, 분류, 검색을 도와주는 AI 에이전트입니다.",
    "icon": "📢", 
    "is_active": true,
    "system_prompt": "당신은...",
    "church_data_sources": {
      "announcements": true,
      "attendances": false,
      "members": false, 
      "worship_services": false
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## 3. AI Agent 조회 API 수정

### 엔드포인트
- `GET /api/v1/ai-agents` (전체 목록)
- `GET /api/v1/ai-agents/{id}` (개별 조회)

### 응답에 `church_data_sources` 필드 포함
기존 응답 구조에 `church_data_sources` 필드를 추가하여 반환

## 4. 채팅 API 수정 (핵심 기능)

### 엔드포인트
`POST /api/v1/ai-agents/{agent_id}/chat` 또는 기존 채팅 엔드포인트

### 구현 로직
1. 채팅 요청 시 해당 에이전트의 `church_data_sources` 설정을 확인
2. 활성화된 데이터 소스에서 관련 데이터를 조회
3. 조회된 데이터를 컨텍스트로 포함하여 GPT API에 전달

### 데이터 조회 로직 예시
```python
def get_church_context_data(agent_id, user_query):
    agent = get_agent_by_id(agent_id)
    context_data = {}
    
    if agent.church_data_sources.get('announcements'):
        # 공지사항 테이블에서 최근 공지사항 조회
        announcements = get_recent_announcements(limit=10)
        context_data['announcements'] = announcements
    
    if agent.church_data_sources.get('attendances'):
        # 출석현황 테이블에서 최근 출석 통계 조회
        attendances = get_attendance_stats()
        context_data['attendances'] = attendances
    
    if agent.church_data_sources.get('members'):
        # 교인현황 테이블에서 교인 통계 조회 (개인정보 제외)
        member_stats = get_member_statistics()
        context_data['members'] = member_stats
    
    if agent.church_data_sources.get('worship_services'):
        # 예배정보 테이블에서 예배 일정 조회
        worship_info = get_worship_schedule()
        context_data['worship_services'] = worship_info
    
    return context_data
```

### GPT API 호출 시 프롬프트 구성
```python
def build_chat_prompt(system_prompt, user_message, context_data):
    context_text = ""
    
    if context_data.get('announcements'):
        context_text += f"\n[교회 공지사항]\n{format_announcements(context_data['announcements'])}\n"
    
    if context_data.get('attendances'):
        context_text += f"\n[출석 현황]\n{format_attendances(context_data['attendances'])}\n"
    
    if context_data.get('members'):
        context_text += f"\n[교인 현황]\n{format_member_stats(context_data['members'])}\n"
    
    if context_data.get('worship_services'):
        context_text += f"\n[예배 정보]\n{format_worship_info(context_data['worship_services'])}\n"
    
    enhanced_system_prompt = system_prompt + context_text
    
    return {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": enhanced_system_prompt},
            {"role": "user", "content": user_message}
        ]
    }
```

## 5. 기존 테이블 데이터 조회 API 활용

다음 기존 API들을 활용하여 교회 데이터를 조회:

- **공지사항**: `GET /api/v1/announcements`
- **출석현황**: `GET /api/v1/attendances` 
- **교인현황**: `GET /api/v1/members`
- **예배정보**: `GET /api/v1/worship-services`

## 6. 보안 고려사항

1. **개인정보 보호**: 교인 정보 조회 시 개인식별정보는 제외하고 통계 정보만 제공
2. **데이터 최소화**: 사용자 질의와 관련된 최소한의 데이터만 GPT API에 전달
3. **권한 확인**: 해당 교회의 에이전트만 해당 교회 데이터에 접근 가능하도록 제한

## 7. 성능 최적화

1. **캐싱**: 자주 조회되는 교회 데이터는 Redis 등을 활용하여 캐싱
2. **데이터 제한**: 각 데이터 소스별로 적절한 limit을 설정하여 응답 속도 확보
3. **비동기 처리**: 데이터 조회를 비동기로 처리하여 응답 시간 단축

## 8. 마이그레이션 계획

1. **1단계**: `ai_agents` 테이블에 `church_data_sources` 컬럼 추가
2. **2단계**: Agent 생성/조회 API에 새 필드 추가
3. **3단계**: 채팅 API에 교회 데이터 연동 로직 구현
4. **4단계**: 기존 에이전트들의 `church_data_sources` 필드를 빈 객체로 초기화

## 9. 테스트 케이스

1. **에이전트 생성 테스트**: 교회 데이터 소스 선택하여 에이전트 생성
2. **채팅 테스트**: 각 데이터 소스 활성화된 에이전트와 채팅하여 해당 데이터 참조 확인
3. **권한 테스트**: 다른 교회의 데이터에 접근하지 않는지 확인
4. **성능 테스트**: 대량 데이터 상황에서의 응답 속도 확인

---

## 구현 우선순위
1. **High**: `ai_agents` 테이블 스키마 변경 및 생성/조회 API 수정
2. **High**: 채팅 API에서 교회 데이터 연동 로직 구현  
3. **Medium**: 성능 최적화 (캐싱, 비동기 처리)
4. **Low**: 고급 보안 기능 (세밀한 권한 제어)

이 변경사항들을 통해 AI 에이전트가 실제 교회 데이터를 기반으로 더욱 정확하고 유용한 답변을 제공할 수 있게 됩니다.
