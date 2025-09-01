# 공지사항 시스템 백엔드 API 명세서

## ⚠️ 프론트엔드 타입 불일치 문제

**발견 시각**: 2025-09-01
**상태**: 백엔드 확인 필요

### 타입 불일치 상세:

1. **교회 공지사항 응답(`/announcements/church-admin`) 누락 필드**:
   - `author_name`: string (작성자 이름)
   - `is_pinned`: boolean (고정 여부) 
   - `target_audience`: string (대상 그룹)

2. **교회 공지사항 생성(`POST /announcements/`) 필수 필드**:
   - `priority`: 'urgent' | 'important' | 'normal' (필수)
   - `start_date`: string (필수)

3. **카테고리 시스템**:
   - `category`: string (카테고리)
   - `subcategory`: string (서브카테고리) - optional

**해결 방안**: 
- 백엔드에서 응답 스키마에 누락 필드 추가
- 또는 프론트엔드 타입을 백엔드 실제 응답에 맞게 수정

---

## 개요
시스템 전체 공지 및 교회별 공지사항을 관리하는 API입니다.
- 시스템 관리자(church_id = 0)만 공지사항 작성/수정/삭제 가능
- 일반 교회 관리자는 해당 교회의 활성 공지사항 조회만 가능

## 데이터베이스 스키마

### `announcements` 테이블
```sql
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('system', 'church')),
  priority VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'important', 'normal')),
  church_id INTEGER NULL, -- NULL이면 시스템 전체 공지, 값이 있으면 해당 교회만
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- 인덱스
CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_church_id ON announcements(church_id);
CREATE INDEX idx_announcements_active_dates ON announcements(is_active, start_date, end_date);
```

### `announcement_reads` 테이블 (읽음 추적)
```sql
CREATE TABLE announcement_reads (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(announcement_id, user_id)
);
```

## API 엔드포인트

### 1. 활성 공지사항 조회 (교회 관리자용)
```
GET /api/announcements/active
```

**요청 헤더:**
```
Authorization: Bearer <token>
```

**응답:** 
- 현재 사용자의 church_id에 해당하는 활성 공지사항 반환
- 시스템 공지(type = 'system') + 해당 교회 공지(church_id = 사용자의 church_id) 
- start_date <= 오늘 <= end_date (end_date가 NULL이면 무제한)

```json
[
  {
    "id": 1,
    "title": "시스템 점검 안내",
    "content": "2024년 1월 15일 새벽 2시-4시 시스템 점검 예정",
    "type": "system",
    "priority": "important",
    "church_id": null,
    "is_active": true,
    "start_date": "2024-01-10",
    "end_date": "2024-01-20",
    "created_at": "2024-01-10T10:00:00Z"
  }
]
```

### 2. 공지사항 읽음 처리
```
POST /api/announcements/{id}/read
```

**요청 헤더:**
```
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "message": "읽음 처리 완료"
}
```

### 3. 모든 공지사항 조회 (시스템 관리자용)
```
GET /api/announcements/admin
```

**권한:** church_id = 0인 사용자만

**응답:** 모든 공지사항 (시스템 + 교회별)
```json
[
  {
    "id": 1,
    "title": "시스템 점검 안내",
    "content": "시스템 점검 내용...",
    "type": "system",
    "priority": "important",
    "church_id": null,
    "is_active": true,
    "start_date": "2024-01-10",
    "end_date": "2024-01-20",
    "created_at": "2024-01-10T10:00:00Z"
  },
  {
    "id": 2,
    "title": "교회별 공지",
    "content": "특정 교회 공지 내용...",
    "type": "church", 
    "priority": "normal",
    "church_id": 5,
    "is_active": true,
    "start_date": "2024-01-12",
    "end_date": null,
    "created_at": "2024-01-12T15:30:00Z"
  }
]
```

### 4. 공지사항 생성
```
POST /api/announcements
```

**권한:** church_id = 0인 사용자만

**요청 본문:**
```json
{
  "title": "새 공지사항 제목",
  "content": "공지사항 내용",
  "type": "system", // "system" 또는 "church"
  "priority": "normal", // "urgent", "important", "normal"
  "church_id": null, // type이 "church"면 필수, "system"이면 null
  "start_date": "2024-01-15",
  "end_date": "2024-01-31" // 선택사항
}
```

**응답:**
```json
{
  "id": 3,
  "title": "새 공지사항 제목",
  "content": "공지사항 내용",
  "type": "system",
  "priority": "normal",
  "church_id": null,
  "is_active": true,
  "start_date": "2024-01-15",
  "end_date": "2024-01-31",
  "created_at": "2024-01-15T09:00:00Z"
}
```

### 5. 공지사항 수정
```
PUT /api/announcements/{id}
```

**권한:** church_id = 0인 사용자만

**요청 본문:** 수정할 필드들
```json
{
  "title": "수정된 제목",
  "is_active": false
}
```

### 6. 공지사항 삭제
```
DELETE /api/announcements/{id}
```

**권한:** church_id = 0인 사용자만

**응답:**
```json
{
  "success": true,
  "message": "공지사항이 삭제되었습니다"
}
```

## 비즈니스 로직

### 활성 공지사항 조회 로직
1. 사용자의 church_id 확인
2. 다음 조건의 공지사항 반환:
   - `is_active = true`
   - `start_date <= 오늘날짜`  
   - `end_date >= 오늘날짜 OR end_date IS NULL`
   - `(type = 'system') OR (type = 'church' AND church_id = 사용자의_church_id)`
3. 우선순위 순서로 정렬: urgent > important > normal
4. 같은 우선순위면 created_at DESC

### 권한 검증
- **시스템 관리자 전용 API**: `church_id = 0` 확인
- **일반 사용자**: 자신의 교회 관련 데이터만 조회 가능

### 읽음 처리
- `announcement_reads` 테이블에 사용자별 읽음 기록 저장
- 읽은 공지사항은 활성 공지사항 조회에서 제외 (프론트엔드에서 필터링)

## 프론트엔드 연동

### announcementService.ts 메서드들
```typescript
// 구현된 메서드들
getActiveAnnouncements()        // GET /api/announcements/active
getAnnouncementsAdmin()        // GET /api/announcements/admin  
createAnnouncement(data)       // POST /api/announcements
updateAnnouncement(id, data)   // PUT /api/announcements/{id}
deleteAnnouncement(id)         // DELETE /api/announcements/{id}
markAsRead(id)                 // POST /api/announcements/{id}/read
```

### 컴포넌트 구조
```
Layout.tsx
├── AnnouncementBanner.tsx (모든 사용자)
│   └── 활성 공지사항 표시, 읽음 처리
│
└── SystemAnnouncementManagement.tsx (church_id=0만)
    └── CRUD 관리 인터페이스
```

## 배포 체크리스트

- [ ] 데이터베이스 테이블 생성
- [ ] API 엔드포인트 구현
- [ ] 권한 미들웨어 구현
- [ ] 읽음 처리 로직 구현  
- [ ] 날짜 기반 필터링 구현
- [ ] 테스트 시나리오 실행

## 테스트 시나리오

1. **시스템 관리자(church_id=0) 로그인**
   - 시스템 공지사항 메뉴 표시 확인
   - 공지사항 CRUD 기능 테스트

2. **일반 교회 관리자 로그인**
   - 공지사항 관리 메뉴 미표시 확인
   - 상단 배너에 활성 공지사항 표시 확인
   - 읽음 처리 기능 확인

3. **공지사항 타입별 테스트**
   - 시스템 공지: 모든 교회에 표시
   - 교회별 공지: 해당 교회에만 표시

4. **우선순위 및 날짜 필터링**
   - 긴급 > 중요 > 일반 순서 표시
   - 날짜 범위 내 공지사항만 표시