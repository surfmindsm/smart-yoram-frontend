# 스마트 요람 교회 데이터 통합 시스템 백엔드 설계

## 개요
교회 관리를 위한 통합 시스템으로, 다음 기능들을 구현합니다:
1. **AI 에이전트가 교회 데이터를 활용한 맞춤형 서비스 제공**
2. **모바일 사용자의 심방 신청 및 중보 기도 요청**
3. **웹 관리자의 통합 관리 시스템**

AI 에이전트는 기존 교회 데이터(공지사항, 출석현황, 교인현황, 예배정보)뿐만 아니라 새로운 데이터(심방 신청, 중보 기도 요청)도 참조하여 더욱 정확하고 맞춤화된 답변을 제공할 수 있습니다.

---

## 1. 데이터베이스 테이블 설계

### 1.1 AI Agent 테이블 스키마 변경

#### `ai_agents` 테이블에 새 컬럼 추가
```sql
ALTER TABLE ai_agents ADD COLUMN church_data_sources JSONB DEFAULT '{}';
```

#### 확장된 컬럼 구조
```json
{
  "announcements": boolean,          // 공지사항 데이터 사용 여부
  "attendances": boolean,            // 출석현황 데이터 사용 여부  
  "members": boolean,                // 교인현황 데이터 사용 여부
  "worship_services": boolean,       // 예배정보 데이터 사용 여부
  "pastoral_care_requests": boolean, // 심방 신청 데이터 사용 여부 (신규)
  "prayer_requests": boolean         // 중보 기도 요청 데이터 사용 여부 (신규)
}
```

### 1.2 심방 신청 테이블 (pastoral_care_requests)

```sql
CREATE TABLE pastoral_care_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    requester_name VARCHAR(100) NOT NULL,
    requester_phone VARCHAR(20) NOT NULL,
    request_type VARCHAR(50) DEFAULT 'general', -- 'general', 'urgent', 'hospital', 'counseling'
    request_content TEXT NOT NULL,
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'scheduled', 'completed', 'cancelled'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    assigned_pastor_id UUID REFERENCES members(id),
    scheduled_date DATE,
    scheduled_time TIME,
    completion_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 생성
CREATE INDEX idx_pastoral_care_church_id ON pastoral_care_requests(church_id);
CREATE INDEX idx_pastoral_care_member_id ON pastoral_care_requests(member_id);
CREATE INDEX idx_pastoral_care_status ON pastoral_care_requests(status);
CREATE INDEX idx_pastoral_care_priority ON pastoral_care_requests(priority);
CREATE INDEX idx_pastoral_care_created_at ON pastoral_care_requests(created_at);
```

### 1.3 중보 기도 요청 테이블 (prayer_requests)

```sql
CREATE TABLE prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    requester_name VARCHAR(100) NOT NULL,
    requester_phone VARCHAR(20),
    prayer_type VARCHAR(50) DEFAULT 'general', -- 'general', 'healing', 'family', 'work', 'spiritual', 'thanksgiving'
    prayer_content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    is_urgent BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'answered', 'closed'
    is_public BOOLEAN DEFAULT true, -- 공개 여부 (주보 게재 등)
    admin_notes TEXT,
    answered_testimony TEXT, -- 응답받은 간증
    prayer_count INTEGER DEFAULT 0, -- 기도해준 사람 수
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days') -- 기본 30일 후 만료
);

-- 인덱스 생성
CREATE INDEX idx_prayer_requests_church_id ON prayer_requests(church_id);
CREATE INDEX idx_prayer_requests_member_id ON prayer_requests(member_id);
CREATE INDEX idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX idx_prayer_requests_is_public ON prayer_requests(is_public);
CREATE INDEX idx_prayer_requests_created_at ON prayer_requests(created_at);
CREATE INDEX idx_prayer_requests_expires_at ON prayer_requests(expires_at);
```

### 1.4 기도 참여 테이블 (prayer_participations)

```sql
CREATE TABLE prayer_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
    participated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(prayer_request_id, member_id) -- 한 사람이 같은 기도 요청에 중복 참여 방지
);

-- 인덱스 생성
CREATE INDEX idx_prayer_participations_prayer_id ON prayer_participations(prayer_request_id);
CREATE INDEX idx_prayer_participations_member_id ON prayer_participations(member_id);
```

---

## 2. AI Agent API 설계

### 2.1 AI Agent 생성 API 수정

#### 엔드포인트
`POST /api/v1/ai-agents`

#### 확장된 요청 Body
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
  "church_data_sources": {                    // 확장된 데이터 소스 필드
    "announcements": boolean,                 // 공지사항
    "attendances": boolean,                   // 출석현황
    "members": boolean,                       // 교인현황
    "worship_services": boolean,              // 예배정보
    "pastoral_care_requests": boolean,        // 심방 신청 (신규)
    "prayer_requests": boolean                // 중보 기도 요청 (신규)
  }
}
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "교회 종합 도우미",
    "category": "통합 지원",
    "description": "교회 운영 전반을 지원하는 AI 에이전트",
    "detailed_description": "공지사항, 심방, 기도 요청 등 교회 데이터를 종합적으로 활용하여 맞춤형 서비스를 제공합니다.",
    "icon": "⛪", 
    "is_active": true,
    "system_prompt": "당신은 교회의 모든 데이터를 활용하여...",
    "church_data_sources": {
      "announcements": true,
      "attendances": false,
      "members": true,
      "worship_services": true,
      "pastoral_care_requests": true,
      "prayer_requests": true
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2.2 AI Agent 조회 API 수정

#### 엔드포인트
- `GET /api/v1/ai-agents` (전체 목록)
- `GET /api/v1/ai-agents/{id}` (개별 조회)

응답에 확장된 `church_data_sources` 필드 포함

---

## 3. 심방 신청 관련 API

### 3.1 모바일용 API
```
POST   /api/v1/pastoral-care/requests        # 심방 신청 생성
GET    /api/v1/pastoral-care/requests/my     # 내 심방 신청 목록
PUT    /api/v1/pastoral-care/requests/:id    # 심방 신청 수정 (대기 상태일 때만)
DELETE /api/v1/pastoral-care/requests/:id    # 심방 신청 취소
```

### 3.2 관리자용 API
```
GET    /api/v1/admin/pastoral-care/requests           # 심방 신청 목록 조회 (필터링, 페이징)
GET    /api/v1/admin/pastoral-care/requests/:id       # 특정 심방 신청 상세 조회
PUT    /api/v1/admin/pastoral-care/requests/:id       # 심방 신청 상태 변경/스케줄링
PUT    /api/v1/admin/pastoral-care/requests/:id/assign # 담당 목사 배정
POST   /api/v1/admin/pastoral-care/requests/:id/complete # 심방 완료 처리
GET    /api/v1/admin/pastoral-care/stats               # 심방 신청 통계
```

### 3.3 심방 신청 생성 API 예시

#### 요청 Body
```json
{
  "request_type": "general",
  "request_content": "최근 아버지께서 편찮으셔서 심방을 요청드립니다.",
  "preferred_date": "2024-01-15",
  "preferred_time_start": "14:00",
  "preferred_time_end": "16:00",
  "priority": "normal"
}
```

---

## 4. 중보 기도 요청 관련 API

### 4.1 모바일용 API
```
POST   /api/v1/prayer-requests              # 중보 기도 요청 생성
GET    /api/v1/prayer-requests              # 공개 기도 요청 목록
GET    /api/v1/prayer-requests/my           # 내 기도 요청 목록
POST   /api/v1/prayer-requests/:id/pray     # 기도 참여
PUT    /api/v1/prayer-requests/:id          # 기도 요청 수정
PUT    /api/v1/prayer-requests/:id/testimony # 응답 간증 추가
DELETE /api/v1/prayer-requests/:id          # 기도 요청 삭제
```

### 4.2 관리자용 API
```
GET    /api/v1/admin/prayer-requests              # 모든 기도 요청 목록 (비공개 포함)
GET    /api/v1/admin/prayer-requests/:id          # 특정 기도 요청 상세 조회
PUT    /api/v1/admin/prayer-requests/:id          # 기도 요청 상태 변경
PUT    /api/v1/admin/prayer-requests/:id/moderate # 기도 요청 승인/비승인
GET    /api/v1/admin/prayer-requests/stats        # 기도 요청 통계
GET    /api/v1/admin/prayer-requests/bulletin     # 주보용 기도 요청 목록
```

### 4.3 중보 기도 요청 생성 API 예시

#### 요청 Body
```json
{
  "prayer_type": "healing",
  "prayer_content": "아버지의 건강 회복을 위해 기도 부탁드립니다.",
  "is_anonymous": false,
  "is_urgent": false,
  "is_public": true
}
```

---

## 5. AI 채팅 API 강화 (핵심 기능)

### 5.1 확장된 채팅 API

#### 엔드포인트
`POST /api/v1/ai-agents/{agent_id}/chat`

### 5.2 확장된 컨텍스트 데이터 조회 로직

```python
def get_church_context_data(agent_id, user_query):
    agent = get_agent_by_id(agent_id)
    context_data = {}
    
    # 기존 데이터 소스
    if agent.church_data_sources.get('announcements'):
        announcements = get_recent_announcements(limit=10)
        context_data['announcements'] = announcements
    
    if agent.church_data_sources.get('attendances'):
        attendances = get_attendance_stats()
        context_data['attendances'] = attendances
    
    if agent.church_data_sources.get('members'):
        member_stats = get_member_statistics()
        context_data['members'] = member_stats
    
    if agent.church_data_sources.get('worship_services'):
        worship_info = get_worship_schedule()
        context_data['worship_services'] = worship_info
    
    # 신규 데이터 소스
    if agent.church_data_sources.get('pastoral_care_requests'):
        pastoral_care_data = get_pastoral_care_summary()
        context_data['pastoral_care_requests'] = pastoral_care_data
    
    if agent.church_data_sources.get('prayer_requests'):
        prayer_data = get_prayer_requests_summary()
        context_data['prayer_requests'] = prayer_data
    
    return context_data
```

### 5.3 확장된 GPT API 프롬프트 구성

```python
def build_enhanced_chat_prompt(system_prompt, user_message, context_data):
    context_text = ""
    
    # 기존 컨텍스트
    if context_data.get('announcements'):
        context_text += f"\n[교회 공지사항]\n{format_announcements(context_data['announcements'])}\n"
    
    if context_data.get('attendances'):
        context_text += f"\n[출석 현황]\n{format_attendances(context_data['attendances'])}\n"
    
    if context_data.get('members'):
        context_text += f"\n[교인 현황]\n{format_member_stats(context_data['members'])}\n"
    
    if context_data.get('worship_services'):
        context_text += f"\n[예배 정보]\n{format_worship_info(context_data['worship_services'])}\n"
    
    # 신규 컨텍스트
    if context_data.get('pastoral_care_requests'):
        context_text += f"\n[심방 신청 현황]\n{format_pastoral_care_data(context_data['pastoral_care_requests'])}\n"
    
    if context_data.get('prayer_requests'):
        context_text += f"\n[기도 요청 현황]\n{format_prayer_requests_data(context_data['prayer_requests'])}\n"
    
    enhanced_system_prompt = system_prompt + context_text
    
    return {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": enhanced_system_prompt},
            {"role": "user", "content": user_message}
        ]
    }
```

### 5.4 컨텍스트 데이터 포맷팅 함수 예시

```python
def format_pastoral_care_data(pastoral_care_data):
    """심방 신청 데이터를 AI가 이해할 수 있는 형태로 포맷팅"""
    formatted = "최근 심방 신청 현황:\n"
    
    for request in pastoral_care_data.get('recent_requests', []):
        formatted += f"- {request['request_type']} 심방: {request['requester_name']} ({request['status']})\n"
        if request['status'] == 'pending':
            formatted += f"  대기 중인 신청, 우선순위: {request['priority']}\n"
        elif request['status'] == 'scheduled':
            formatted += f"  예정일: {request['scheduled_date']} {request['scheduled_time']}\n"
    
    formatted += f"\n통계:\n"
    formatted += f"- 대기 중: {pastoral_care_data.get('pending_count', 0)}건\n"
    formatted += f"- 예정됨: {pastoral_care_data.get('scheduled_count', 0)}건\n"
    formatted += f"- 이번 달 완료: {pastoral_care_data.get('completed_this_month', 0)}건\n"
    
    return formatted

def format_prayer_requests_data(prayer_data):
    """기도 요청 데이터를 AI가 이해할 수 있는 형태로 포맷팅"""
    formatted = "활성 기도 요청 현황:\n"
    
    for request in prayer_data.get('active_requests', []):
        formatted += f"- {request['prayer_type']} 기도: {request['requester_name']}\n"
        formatted += f"  기도 참여: {request['prayer_count']}명\n"
        if request['is_urgent']:
            formatted += f"  (긴급 요청)\n"
    
    formatted += f"\n통계:\n"
    formatted += f"- 활성 기도 요청: {prayer_data.get('active_count', 0)}건\n"
    formatted += f"- 이번 달 응답됨: {prayer_data.get('answered_this_month', 0)}건\n"
    formatted += f"- 총 기도 참여: {prayer_data.get('total_prayers', 0)}회\n"
    
    return formatted
```

---

## 6. 사용 시나리오 예시

### 6.1 AI 에이전트 활용 예시

**시나리오 1: 심방 관련 문의**
- 사용자: "이번 주 심방 일정이 어떻게 되나요?"
- AI 응답: 심방 신청 데이터를 참조하여 이번 주 예정된 심방 일정과 대기 중인 신청 현황을 알려줌

**시나리오 2: 기도 요청 관련 문의**
- 사용자: "최근에 올라온 기도 요청들을 알려주세요"
- AI 응답: 공개된 기도 요청 목록과 각각의 기도 참여 현황을 제공

**시나리오 3: 통합 교회 현황 문의**
- 사용자: "우리 교회 현재 상황을 종합적으로 알려주세요"
- AI 응답: 공지사항, 예배 일정, 심방 현황, 기도 요청 등을 종합하여 교회 전반 상황을 제공

### 6.2 데이터 조합 예시

**에이전트 설정 예시:**
```json
{
  "name": "목양 도우미",
  "church_data_sources": {
    "announcements": false,
    "attendances": true,
    "members": true,
    "worship_services": false,
    "pastoral_care_requests": true,
    "prayer_requests": true
  }
}
```

이 에이전트는 출석현황, 교인현황, 심방 신청, 기도 요청 데이터만 활용하여 목양 관련 질문에 특화된 답변을 제공합니다.

---

## 7. 보안 및 권한 관리

### 7.1 데이터 접근 제어
- **교회별 분리**: 각 교회의 데이터만 접근 가능하도록 church_id 필터링
- **개인정보 보호**: 민감한 개인정보는 통계 형태로만 AI에 제공
- **익명 처리**: 기도 요청 등에서 익명 설정 시 개인정보 마스킹

### 7.2 데이터 최소화 원칙
- 사용자 질의와 관련된 최소한의 데이터만 GPT API에 전달
- 최근 데이터 위주로 제한 (예: 최근 30일 내 데이터)
- 개인식별정보 제외한 통계 정보 위주로 제공

---

## 8. 성능 최적화

### 8.1 캐싱 전략
- Redis를 활용한 자주 조회되는 교회 데이터 캐싱
- 실시간성이 중요하지 않은 통계 데이터는 캐시 활용
- 데이터 변경 시 관련 캐시 무효화

### 8.2 쿼리 최적화
- 각 데이터 소스별로 적절한 limit 설정
- 인덱스 최적화로 조회 성능 향상
- 필요한 컬럼만 선택하여 데이터 전송량 최소화

---

## 9. 알림 시스템

### 9.1 심방 신청 알림
- 신청 시: 관리자에게 즉시 알림
- 승인/거부 시: 신청자에게 알림
- 일정 확정 시: 신청자와 담당 목사에게 알림

### 9.2 기도 요청 알림
- 새 요청 시: 교회 관리자에게 알림
- 기도 참여 시: 요청자에게 알림 (선택적)
- 응답 간증 시: 기도 참여자들에게 알림

---

## 10. 구현 우선순위

### Phase 1 (High Priority)
1. **기존 AI Agent 시스템에 새로운 데이터 소스 추가**
   - `church_data_sources` 필드에 `pastoral_care_requests`, `prayer_requests` 추가
   - AI Agent 생성/조회 API 수정

2. **심방 신청 및 기도 요청 기본 CRUD API 구현**
   - 모바일용 생성/조회/수정/삭제 API
   - 관리자용 관리 API

### Phase 2 (Medium Priority)
3. **AI 채팅 API에서 신규 데이터 소스 연동**
   - 컨텍스트 데이터 조회 로직 확장
   - GPT 프롬프트에 새로운 데이터 포함

4. **알림 시스템 구현**
   - Push 알림 또는 SMS 알림
   - 실시간 상태 변경 알림

### Phase 3 (Low Priority)
5. **고급 기능 구현**
   - 통계 및 리포팅 API
   - 자동 만료 처리
   - 고급 보안 기능

---

## 11. 테스트 계획

### 11.1 AI Agent 테스트
- 새로운 데이터 소스 선택하여 에이전트 생성
- 각 데이터 소스 활성화된 에이전트와 채팅하여 해당 데이터 참조 확인
- 데이터 조합별 응답 품질 테스트

### 11.2 통합 시스템 테스트
- 모바일에서 심방/기도 요청 → 웹에서 관리 → AI 에이전트 활용 전체 플로우 테스트
- 권한 테스트: 다른 교회 데이터 접근 방지 확인
- 성능 테스트: 대량 데이터 상황에서의 응답 속도 확인

이 통합 시스템을 통해 교회는 모든 데이터를 효율적으로 관리하고, AI 에이전트는 더욱 정확하고 유용한 서비스를 제공할 수 있게 됩니다.
