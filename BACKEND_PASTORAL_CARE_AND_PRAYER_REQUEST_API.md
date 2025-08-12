# 심방 신청 및 중보 기도 요청 시스템 백엔드 설계

## 개요
모바일 사용자가 심방을 신청하고 중보 기도를 요청할 수 있으며, 웹 관리자가 이를 관리할 수 있는 시스템을 구현하기 위한 백엔드 설계입니다.

## 1. 데이터베이스 테이블 설계

### 1.1 심방 신청 테이블 (pastoral_care_requests)

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

### 1.2 중보 기도 요청 테이블 (prayer_requests)

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

### 1.3 기도 참여 테이블 (prayer_participations)

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

## 2. API 엔드포인트 설계

### 2.1 심방 신청 관련 API

#### 모바일용 API
```
POST   /api/v1/pastoral-care/requests        # 심방 신청 생성
GET    /api/v1/pastoral-care/requests/my     # 내 심방 신청 목록
PUT    /api/v1/pastoral-care/requests/:id    # 심방 신청 수정 (대기 상태일 때만)
DELETE /api/v1/pastoral-care/requests/:id    # 심방 신청 취소
```

#### 관리자용 API
```
GET    /api/v1/admin/pastoral-care/requests           # 심방 신청 목록 조회 (필터링, 페이징)
GET    /api/v1/admin/pastoral-care/requests/:id       # 특정 심방 신청 상세 조회
PUT    /api/v1/admin/pastoral-care/requests/:id       # 심방 신청 상태 변경/스케줄링
PUT    /api/v1/admin/pastoral-care/requests/:id/assign # 담당 목사 배정
POST   /api/v1/admin/pastoral-care/requests/:id/complete # 심방 완료 처리
GET    /api/v1/admin/pastoral-care/stats               # 심방 신청 통계
```

### 2.2 중보 기도 요청 관련 API

#### 모바일용 API
```
POST   /api/v1/prayer-requests              # 중보 기도 요청 생성
GET    /api/v1/prayer-requests              # 공개 기도 요청 목록
GET    /api/v1/prayer-requests/my           # 내 기도 요청 목록
POST   /api/v1/prayer-requests/:id/pray     # 기도 참여
PUT    /api/v1/prayer-requests/:id          # 기도 요청 수정
PUT    /api/v1/prayer-requests/:id/testimony # 응답 간증 추가
DELETE /api/v1/prayer-requests/:id          # 기도 요청 삭제
```

#### 관리자용 API
```
GET    /api/v1/admin/prayer-requests              # 모든 기도 요청 목록 (비공개 포함)
GET    /api/v1/admin/prayer-requests/:id          # 특정 기도 요청 상세 조회
PUT    /api/v1/admin/prayer-requests/:id          # 기도 요청 상태 변경
PUT    /api/v1/admin/prayer-requests/:id/moderate # 기도 요청 승인/비승인
GET    /api/v1/admin/prayer-requests/stats        # 기도 요청 통계
GET    /api/v1/admin/prayer-requests/bulletin     # 주보용 기도 요청 목록
```

## 3. API 상세 스펙

### 3.1 심방 신청 생성 (POST /api/v1/pastoral-care/requests)

**요청 Body:**
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

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "request_type": "general",
    "request_content": "최근 아버지께서 편찮으셔서 심방을 요청드립니다.",
    "preferred_date": "2024-01-15",
    "preferred_time_start": "14:00",
    "preferred_time_end": "16:00",
    "status": "pending",
    "priority": "normal",
    "requester_name": "김성도",
    "requester_phone": "010-1234-5678",
    "created_at": "2024-01-10T10:00:00Z"
  }
}
```

### 3.2 관리자용 심방 신청 목록 조회 (GET /api/v1/admin/pastoral-care/requests)

**쿼리 파라미터:**
```
?status=pending&priority=high&page=1&limit=20&sort=created_at&order=desc&date_from=2024-01-01&date_to=2024-01-31
```

**응답:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "uuid",
        "requester_name": "김성도",
        "requester_phone": "010-1234-5678",
        "member_id": "uuid",
        "request_type": "general",
        "request_content": "심방 요청 내용...",
        "preferred_date": "2024-01-15",
        "preferred_time_start": "14:00",
        "preferred_time_end": "16:00",
        "status": "pending",
        "priority": "normal",
        "assigned_pastor": {
          "id": "uuid",
          "name": "김목사",
          "phone": "010-5678-1234"
        },
        "scheduled_date": null,
        "scheduled_time": null,
        "created_at": "2024-01-10T10:00:00Z",
        "updated_at": "2024-01-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    },
    "stats": {
      "pending": 45,
      "approved": 23,
      "scheduled": 12,
      "completed": 60,
      "cancelled": 10
    }
  }
}
```

### 3.3 중보 기도 요청 생성 (POST /api/v1/prayer-requests)

**요청 Body:**
```json
{
  "prayer_type": "healing",
  "prayer_content": "아버지의 건강 회복을 위해 기도 부탁드립니다.",
  "is_anonymous": false,
  "is_urgent": false,
  "is_public": true
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requester_name": "김성도",
    "prayer_type": "healing",
    "prayer_content": "아버지의 건강 회복을 위해 기도 부탁드립니다.",
    "is_anonymous": false,
    "is_urgent": false,
    "is_public": true,
    "status": "active",
    "prayer_count": 0,
    "created_at": "2024-01-10T10:00:00Z",
    "expires_at": "2024-02-09T10:00:00Z"
  }
}
```

## 4. 보안 및 권한 관리

### 4.1 인증 및 권한
- **모바일 사용자**: JWT 토큰 기반 인증, 본인의 요청만 조회/수정 가능
- **관리자**: 관리자 권한 확인, 모든 요청 조회/관리 가능
- **교회별 분리**: 각 교회의 데이터만 접근 가능하도록 church_id 필터링

### 4.2 개인정보 보호
- 익명 기도 요청의 경우 개인정보 마스킹
- 전화번호 등 민감정보는 관리자만 조회 가능
- 데이터 보관 기간 설정 (완료된 심방 신청: 1년, 만료된 기도 요청: 6개월)

## 5. 알림 시스템

### 5.1 심방 신청 알림
- **신청 시**: 관리자에게 즉시 알림
- **승인 시**: 신청자에게 알림
- **일정 확정 시**: 신청자와 담당 목사에게 알림
- **완료 시**: 신청자에게 알림

### 5.2 기도 요청 알림
- **새 요청 시**: 교회 관리자에게 알림
- **기도 참여 시**: 요청자에게 알림 (선택적)
- **응답 간증 시**: 기도 참여자들에게 알림

## 6. 통계 및 리포팅

### 6.1 심방 신청 통계
- 월별/주별 신청 건수
- 심방 유형별 통계
- 완료율 및 평균 처리 시간
- 목사별 심방 건수

### 6.2 기도 요청 통계
- 기도 요청 유형별 통계
- 기도 참여율
- 응답받은 기도 비율
- 월별 기도 요청 트렌드

## 7. 구현 우선순위

1. **High**: 기본 CRUD API 구현 (심방 신청, 기도 요청)
2. **High**: 관리자용 목록 조회 및 상태 관리 API
3. **Medium**: 알림 시스템 구현
4. **Medium**: 통계 및 리포팅 API
5. **Low**: 고급 기능 (자동 만료, 배치 처리 등)

이 설계를 바탕으로 모바일 앱과 웹 관리자 화면이 효율적으로 심방과 기도 요청을 관리할 수 있게 됩니다.
