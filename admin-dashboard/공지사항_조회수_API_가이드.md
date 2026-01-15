# 공지사항 조회수 기능 API 가이드

## 개요
공지사항에 조회수(view_count) 기능이 추가되었습니다. 모바일 앱에서 공지사항을 조회할 때 조회수를 증가시켜야 합니다.

## 데이터베이스 변경사항

### 테이블: `announcements`
새로운 컬럼이 추가되었습니다:

```sql
view_count INTEGER DEFAULT 0 NOT NULL
```

- **컬럼명**: `view_count`
- **타입**: `INTEGER`
- **기본값**: `0`
- **설명**: 공지사항이 조회된 횟수

---

## API 구현 방법

### 1. 공지사항 목록 조회 API
**변경 없음** - 기존 API 그대로 사용하되, 응답에 `view_count` 필드가 포함됩니다.

**응답 예시:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "주일예배 안내",
      "content": "이번 주 주일예배는...",
      "view_count": 152,
      "created_at": "2026-01-15T10:00:00Z",
      ...
    }
  ]
}
```

---

### 2. 공지사항 상세 조회 API - **조회수 증가 필요**

#### 방법 A: 별도 API 엔드포인트 생성 (권장)

**엔드포인트:** `POST /api/announcements/{id}/increment-view`

**요청:**
```http
POST /api/announcements/1/increment-view
Content-Type: application/json
Authorization: Bearer {token}
```

**백엔드 구현 (Supabase Edge Function 예시):**
```typescript
// supabase/functions/announcements/index.ts

// POST /announcements/{id}/increment-view
if (req.method === 'POST' && url.pathname.includes('/increment-view')) {
  const announcementId = url.pathname.split('/')[2];

  // 조회수 증가
  const { data, error } = await supabase
    .from('announcements')
    .update({
      view_count: supabase.raw('view_count + 1')
    })
    .eq('id', announcementId)
    .select('id, view_count')
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    view_count: data.view_count
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

**SQL 직접 사용 (권장):**
```sql
UPDATE announcements
SET view_count = view_count + 1
WHERE id = $1
RETURNING id, view_count;
```

**모바일 앱 구현:**
```dart
// Flutter 예시
Future<void> viewAnnouncement(int announcementId) async {
  try {
    // 1. 조회수 증가 API 호출
    await http.post(
      Uri.parse('$baseUrl/announcements/$announcementId/increment-view'),
      headers: {'Authorization': 'Bearer $token'},
    );

    // 2. 상세 내용 가져오기
    final response = await http.get(
      Uri.parse('$baseUrl/announcements/$announcementId'),
      headers: {'Authorization': 'Bearer $token'},
    );

    // 3. UI 업데이트
    final announcement = Announcement.fromJson(jsonDecode(response.body));
    setState(() {
      _currentAnnouncement = announcement;
    });
  } catch (e) {
    print('공지사항 조회 실패: $e');
  }
}
```

---

#### 방법 B: 상세 조회 시 자동 증가

**엔드포인트:** `GET /api/announcements/{id}?increment_view=true`

**백엔드 구현:**
```typescript
// GET /announcements/{id}
if (req.method === 'GET' && announcementId) {
  const incrementView = url.searchParams.get('increment_view') === 'true';

  if (incrementView) {
    // 조회수 증가
    await supabase
      .from('announcements')
      .update({ view_count: supabase.raw('view_count + 1') })
      .eq('id', announcementId);
  }

  // 공지사항 조회
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', announcementId)
    .single();

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

**모바일 앱 구현:**
```dart
// Flutter 예시
Future<Announcement> getAnnouncementDetail(int id) async {
  final response = await http.get(
    Uri.parse('$baseUrl/announcements/$id?increment_view=true'),
    headers: {'Authorization': 'Bearer $token'},
  );

  if (response.statusCode == 200) {
    return Announcement.fromJson(jsonDecode(response.body));
  } else {
    throw Exception('공지사항 조회 실패');
  }
}
```

---

## 중요 고려사항

### 1. 중복 조회 방지
같은 사용자가 짧은 시간 내에 여러 번 조회해도 1회만 카운트하려면:

**방법 1: 클라이언트 캐싱**
```dart
// 최근 조회한 공지사항 ID와 시간 저장
final Map<int, DateTime> _viewedAnnouncements = {};

Future<void> viewAnnouncement(int announcementId) async {
  final lastViewed = _viewedAnnouncements[announcementId];
  final now = DateTime.now();

  // 10분 이내 재조회는 카운트하지 않음
  if (lastViewed != null && now.difference(lastViewed).inMinutes < 10) {
    // 조회수 증가 API 호출 생략
    return getAnnouncementDetail(announcementId, incrementView: false);
  }

  // 조회수 증가
  await incrementViewCount(announcementId);
  _viewedAnnouncements[announcementId] = now;
}
```

**방법 2: 백엔드 중복 체크 (더 정확)**
```sql
-- view_logs 테이블 생성 (선택사항)
CREATE TABLE announcement_view_logs (
  id BIGSERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(announcement_id, user_id, DATE(viewed_at))
);

-- 하루에 한 번만 카운트하는 로직
INSERT INTO announcement_view_logs (announcement_id, user_id, viewed_at)
VALUES ($1, $2, NOW())
ON CONFLICT (announcement_id, user_id, DATE(viewed_at)) DO NOTHING
RETURNING id;

-- 위 쿼리가 성공하면 조회수 증가
UPDATE announcements SET view_count = view_count + 1 WHERE id = $1;
```

### 2. 비회원 조회
비회원(게스트)이 공지사항을 조회할 경우:
- 방법 1: IP 주소 기반으로 중복 체크
- 방법 2: 모든 조회 카운트 (간단하지만 부정확)
- 방법 3: 비회원은 조회수 증가 안 함

### 3. 성능 최적화
- 조회수 증가는 **비동기**로 처리
- 사용자에게 공지사항을 먼저 보여주고, 백그라운드에서 조회수 증가
```dart
Future<void> viewAnnouncement(int id) async {
  // 1. 먼저 데이터 가져오기 (사용자에게 빠르게 보여주기)
  final announcement = await getAnnouncementDetail(id);
  setState(() => _currentAnnouncement = announcement);

  // 2. 백그라운드에서 조회수 증가 (await 없이)
  incrementViewCount(id).catchError((e) {
    print('조회수 증가 실패: $e');
  });
}
```

---

## 테스트 방법

### 1. 마이그레이션 적용
```bash
cd admin-dashboard
npm run supabase:push
```

### 2. 기존 데이터 확인
```sql
SELECT id, title, view_count FROM announcements LIMIT 10;
```

### 3. 조회수 증가 테스트
```sql
-- 수동 증가 테스트
UPDATE announcements SET view_count = view_count + 1 WHERE id = 1;

-- 결과 확인
SELECT id, title, view_count FROM announcements WHERE id = 1;
```

### 4. API 테스트 (curl)
```bash
# 조회수 증가 API 테스트
curl -X POST \
  'https://your-project.supabase.co/functions/v1/announcements/1/increment-view' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# 응답 예시
{
  "success": true,
  "view_count": 153
}
```

---

## 모바일 앱 모델 업데이트

### Dart (Flutter)
```dart
class Announcement {
  final int id;
  final String title;
  final String content;
  final int viewCount;  // 추가
  final DateTime createdAt;

  Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.viewCount,  // 추가
    required this.createdAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'],
      title: json['title'],
      content: json['content'],
      viewCount: json['view_count'] ?? 0,  // 추가
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
```

### Swift (iOS)
```swift
struct Announcement: Codable {
    let id: Int
    let title: String
    let content: String
    let viewCount: Int  // 추가
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case content
        case viewCount = "view_count"  // snake_case 매핑
        case createdAt = "created_at"
    }
}
```

### Kotlin (Android)
```kotlin
data class Announcement(
    val id: Int,
    val title: String,
    val content: String,
    @SerializedName("view_count") val viewCount: Int = 0,  // 추가
    @SerializedName("created_at") val createdAt: String
)
```

---

## 문의사항
- 백엔드 API: [담당자 이메일]
- 데이터베이스: [담당자 이메일]
- 모바일 개발 관련: [담당자 이메일]

---

## 체크리스트

모바일 개발자가 구현할 사항:

- [ ] 모델에 `view_count` 필드 추가
- [ ] 공지사항 상세 조회 시 조회수 증가 API 호출
- [ ] 중복 조회 방지 로직 구현 (선택사항)
- [ ] UI에 조회수 표시 (선택사항)
- [ ] API 테스트 완료
- [ ] 에러 처리 구현

---

**마이그레이션 완료일:** 2026-01-15
**문서 버전:** 1.0
