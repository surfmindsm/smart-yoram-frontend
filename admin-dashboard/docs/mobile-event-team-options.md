# 행사팀 모집 - 선택 항목 명세

## 1. 행사 유형 (Event Type)

행사 유형을 선택하는 드롭다운 메뉴입니다.

### 선택 옵션 (11개)

| Value | Label (한글) | 설명 |
|-------|-------------|------|
| `sunday-service` | 주일예배 | 일요일 정기 예배 |
| `wednesday-service` | 수요예배 | 수요일 정기 예배 |
| `dawn-service` | 새벽예배 | 새벽 시간대 예배 |
| `special-service` | 특별예배 | 특별한 날의 예배 (추석, 설날 등) |
| `revival` | 부흥회 | 영적 부흥을 위한 집회 |
| `praise-meeting` | 찬양집회 | 찬양 중심의 집회 |
| `wedding` | 결혼식 | 결혼 예식 |
| `funeral` | 장례식 | 장례 예식 |
| `retreat` | 수련회 | 교회 수련회/캠프 |
| `concert` | 콘서트 | 음악 콘서트 |
| `other` | 기타 | 기타 행사 |

### JSON 형식
```json
{
  "eventTypes": [
    { "value": "sunday-service", "label": "주일예배" },
    { "value": "wednesday-service", "label": "수요예배" },
    { "value": "dawn-service", "label": "새벽예배" },
    { "value": "special-service", "label": "특별예배" },
    { "value": "revival", "label": "부흥회" },
    { "value": "praise-meeting", "label": "찬양집회" },
    { "value": "wedding", "label": "결혼식" },
    { "value": "funeral", "label": "장례식" },
    { "value": "retreat", "label": "수련회" },
    { "value": "concert", "label": "콘서트" },
    { "value": "other", "label": "기타" }
  ]
}
```

---

## 2. 모집 팀 형태 (Team Type)

모집하려는 팀의 형태를 선택하는 다중 선택 옵션입니다.

### 특징
- **다중 선택 가능** (여러 개 선택 가능)
- 최소 1개 이상 선택 필수
- 선택된 항목은 태그 형태로 표시

### 선택 옵션 (9개)

| Value | Label (한글) | 아이콘 | 설명 |
|-------|-------------|--------|------|
| `solo` | 현재 솔로 활동 | 🎤 (Mic) | 개인 솔로 뮤지션 |
| `praise-team` | 찬양팀 | 🎵 (Music) | 찬양 중심 팀 |
| `worship-team` | 워십팀 | 🎵 (Music) | 워십 중심 팀 |
| `acoustic-team` | 어쿠스틱 팀 | 🎸 (Guitar) | 어쿠스틱 악기 중심 |
| `band` | 밴드 | 🎸 (Guitar) | 밴드 형태 |
| `orchestra` | 오케스트라 | 🎹 (Piano) | 오케스트라 형태 |
| `choir` | 합창단 | 🎹 (Piano) | 합창단 형태 |
| `dance-team` | 무용팀 | 🎤 (Mic) | 무용/댄스 팀 |
| `other` | 기타 | 🎵 (Music) | 기타 팀 형태 |

### JSON 형식
```json
{
  "teamTypes": [
    { "value": "solo", "label": "현재 솔로 활동", "icon": "mic" },
    { "value": "praise-team", "label": "찬양팀", "icon": "music" },
    { "value": "worship-team", "label": "워십팀", "icon": "music" },
    { "value": "acoustic-team", "label": "어쿠스틱 팀", "icon": "guitar" },
    { "value": "band", "label": "밴드", "icon": "guitar" },
    { "value": "orchestra", "label": "오케스트라", "icon": "piano" },
    { "value": "choir", "label": "합창단", "icon": "piano" },
    { "value": "dance-team", "label": "무용팀", "icon": "mic" },
    { "value": "other", "label": "기타", "icon": "music" }
  ]
}
```

### 아이콘 매핑
모바일 앱에서 각 팀 형태에 맞는 아이콘을 표시할 수 있습니다:

```javascript
const getTeamTypeIcon = (teamType) => {
  switch (teamType) {
    case 'solo':
      return 'mic'; // 🎤
    case 'praise-team':
    case 'worship-team':
      return 'music'; // 🎵
    case 'band':
    case 'acoustic-team':
      return 'guitar'; // 🎸
    case 'orchestra':
    case 'choir':
      return 'piano'; // 🎹
    case 'dance-team':
      return 'mic'; // 🎤
    default:
      return 'music'; // 🎵
  }
};
```

---

## 3. 사용 예시

### 행사 유형 드롭다운
```
┌─────────────────────────┐
│ 행사 유형 *              │
│ ┌─────────────────────┐ │
│ │ 행사 유형 선택    ▼ │ │
│ └─────────────────────┘ │
└─────────────────────────┘

선택 후:
┌─────────────────────────┐
│ 행사 유형 *              │
│ ┌─────────────────────┐ │
│ │ 주일예배          ▼ │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 모집 팀 형태 다중 선택
```
┌─────────────────────────────────┐
│ 모집 팀 형태 *                   │
│                                 │
│ [ ] 현재 솔로 활동  🎤          │
│ [✓] 찬양팀          🎵          │
│ [✓] 워십팀          🎵          │
│ [ ] 어쿠스틱 팀     🎸          │
│ [✓] 밴드            🎸          │
│ [ ] 오케스트라      🎹          │
│ [ ] 합창단          🎹          │
│ [ ] 무용팀          🎤          │
│ [ ] 기타            🎵          │
│                                 │
│ 선택된 팀: [찬양팀] [워십팀] [밴드] │
└─────────────────────────────────┘
```

---

## 4. 데이터 전송 형식

### Request Body 예시
```json
{
  "title": "주일예배 찬양팀 모집",
  "eventType": "sunday-service",
  "teamTypes": ["praise-team", "worship-team", "band"],
  "eventDate": "2025-10-15",
  "rehearsalSchedule": "토요일 오후 2시",
  "location": "서울시 강남구 ○○교회",
  "description": "주일예배를 섬길 찬양팀을 모집합니다...",
  "requirements": ["찬양 경험 1년 이상", "정기 출석 가능"],
  "compensation": "교통비 지급",
  "contactPhone": "010-1234-5678",
  "contactEmail": "contact@example.com"
}
```

### 필수 필드
- `title`: 제목 (필수)
- `eventType`: 행사 유형 (필수, 단일 선택)
- `teamTypes`: 모집 팀 형태 (필수, 다중 선택, 최소 1개)
- `contactPhone`: 연락처 (필수)

### 선택 필드
- `eventDate`: 행사 날짜
- `rehearsalSchedule`: 리허설 일정
- `location`: 장소
- `description`: 상세 설명
- `requirements`: 요구사항 (배열)
- `compensation`: 보수/보상
- `contactEmail`: 이메일

---

## 5. 유효성 검사

### 행사 유형
```javascript
// 필수 검사
if (!eventType) {
  error = "행사 유형을 선택해주세요.";
}

// 유효한 값 검사
const validEventTypes = [
  'sunday-service', 'wednesday-service', 'dawn-service',
  'special-service', 'revival', 'praise-meeting',
  'wedding', 'funeral', 'retreat', 'concert', 'other'
];

if (!validEventTypes.includes(eventType)) {
  error = "유효하지 않은 행사 유형입니다.";
}
```

### 모집 팀 형태
```javascript
// 필수 검사 (최소 1개)
if (teamTypes.length === 0) {
  error = "모집 팀 형태를 최소 1개 이상 선택해주세요.";
}

// 유효한 값 검사
const validTeamTypes = [
  'solo', 'praise-team', 'worship-team', 'acoustic-team',
  'band', 'orchestra', 'choir', 'dance-team', 'other'
];

const invalidTypes = teamTypes.filter(type => !validTeamTypes.includes(type));
if (invalidTypes.length > 0) {
  error = "유효하지 않은 팀 형태가 포함되어 있습니다.";
}
```

---

## 6. UI/UX 가이드

### 행사 유형 (단일 선택)
- **컴포넌트**: Dropdown / Select
- **기본값**: 선택되지 않음 (Placeholder: "행사 유형 선택")
- **검색 가능**: 선택 사항 (항목이 많지 않아 필수 아님)
- **정렬**: 일반적인 예배 → 특별 행사 순서

### 모집 팀 형태 (다중 선택)
- **컴포넌트**: Checkbox List 또는 Chip Selector
- **기본값**: 선택되지 않음
- **표시 방식**:
  - 체크박스 형태로 나열
  - 선택된 항목은 하단에 태그/칩 형태로 표시
- **아이콘**: 각 항목 옆에 해당 아이콘 표시
- **선택 제한**: 없음 (모두 선택 가능)

### 모바일 최적화
1. **행사 유형**: 네이티브 Picker 사용 권장
2. **모집 팀 형태**:
   - iOS: 체크박스 리스트 + 선택된 항목 하단 표시
   - Android: Material Design Chip 또는 체크박스 리스트
3. **터치 영역**: 최소 44x44pt (iOS) / 48x48dp (Android)
4. **스크롤**: 모집 팀 형태가 많으므로 적절한 스크롤 영역 제공

---

## 7. 참고 사항

### 백엔드 매핑
- `eventType` → `recruitment_type` (데이터베이스 필드)
- `teamTypes` → 배열 그대로 저장 (JSONB 또는 텍스트 배열)

### 화면 경로
- 생성 화면: `/community/music-team-recruit/create`
- 목록 화면: `/community/music-team-recruit`
- 상세 화면: `/community/music-team-recruit/:id`

### API 엔드포인트
- 생성: `POST /api/community/music-recruitment`
- 목록 조회: `GET /api/community/music-recruitment`
- 상세 조회: `GET /api/community/music-recruitment/:id`
