# 명설교 기능 API 가이드

## 📋 목차
1. [개요](#개요)
2. [데이터베이스 스키마](#데이터베이스-스키마)
3. [API 엔드포인트](#api-엔드포인트)
4. [데이터 모델](#데이터-모델)
5. [API 사용 예제](#api-사용-예제)
6. [화면 구성 제안](#화면-구성-제안)
7. [주요 기능 구현](#주요-기능-구현)
8. [주의사항](#주의사항)

---

## 개요

명설교 기능은 시스템 관리자가 선별한 유튜브 설교 영상을 모든 앱 사용자에게 제공하는 기능입니다.

### 주요 특징
- ✅ 유튜브 영상 임베딩 방식
- ✅ 카테고리별 분류 (주일설교, 수요예배, 특별집회 등)
- ✅ 추천 설교 기능
- ✅ 조회수 추적
- ✅ 태그 기반 검색
- ✅ 본문 말씀 정보 제공

---

## 데이터베이스 스키마

### 1. `sermon_categories` 테이블
설교 카테고리 정보

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | 카테고리 ID (PK) |
| name | VARCHAR(50) | 카테고리 이름 |
| description | TEXT | 카테고리 설명 |
| display_order | INTEGER | 표시 순서 |
| is_active | BOOLEAN | 활성화 여부 |

**기본 카테고리:**
- 주일설교
- 수요예배
- 금요기도회
- 특별집회
- 새벽기도회

### 2. `sermons` 테이블
설교 정보 (메인 테이블)

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | UUID | ✅ | 설교 ID (PK) |
| title | VARCHAR(255) | ✅ | 설교 제목 |
| youtube_url | TEXT | ✅ | 유튜브 전체 URL |
| youtube_video_id | VARCHAR(20) | ✅ | 유튜브 비디오 ID (자동 추출) |
| preacher_name | VARCHAR(100) | ❌ | 설교자 이름 |
| description | TEXT | ❌ | 설교 설명/요약 |
| scripture_reference | VARCHAR(200) | ❌ | 본문 말씀 (예: "요한복음 3:16-21") |
| thumbnail_url | TEXT | ❌ | 썸네일 URL (자동 생성) |
| duration_seconds | INTEGER | ❌ | 영상 길이 (초) |
| view_count | INTEGER | ✅ | 조회수 (기본값: 0) |
| category_id | INTEGER | ❌ | 카테고리 FK |
| sermon_date | DATE | ❌ | 설교 날짜 |
| tags | TEXT[] | ❌ | 태그 배열 |
| language | VARCHAR(10) | ✅ | 언어 코드 (기본값: 'ko') |
| is_featured | BOOLEAN | ✅ | 추천 설교 여부 (기본값: false) |
| display_order | INTEGER | ✅ | 표시 순서 (기본값: 0) |
| is_active | BOOLEAN | ✅ | 활성화 여부 (기본값: true) |
| published_at | TIMESTAMP | ❌ | 발행 시간 |
| created_at | TIMESTAMP | ✅ | 생성 시간 |
| updated_at | TIMESTAMP | ✅ | 수정 시간 |

### 3. `sermon_views` 테이블
조회수 로그 (통계용)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL | 로그 ID (PK) |
| sermon_id | UUID | 설교 ID (FK) |
| user_id | INTEGER | 사용자 ID (선택) |
| church_id | INTEGER | 교회 ID (선택) |
| viewed_at | TIMESTAMP | 조회 시간 |

---

## API 엔드포인트

### 방법 1: Supabase 직접 쿼리 (권장)

Supabase 클라이언트를 사용하여 직접 데이터베이스를 쿼리하는 방법입니다.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);
```

### 방법 2: Edge Function 사용

Supabase Edge Function을 통한 API 호출 방법입니다.

**Base URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/sermons`

---

## 데이터 모델

### TypeScript 인터페이스

```typescript
// 카테고리
interface SermonCategory {
  id: number;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 설교
interface Sermon {
  id: string;
  title: string;
  youtube_url: string;
  youtube_video_id: string;
  preacher_name?: string;
  description?: string;
  scripture_reference?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  view_count: number;
  category_id?: number;
  sermon_date?: string;
  tags?: string[];
  language: string;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;

  // 관계 데이터 (JOIN 시)
  category?: SermonCategory;
}
```

---

## API 사용 예제

### 1. 모든 활성 설교 조회

```typescript
// Supabase 직접 쿼리
const { data: sermons, error } = await supabase
  .from('sermons')
  .select(`
    *,
    category:sermon_categories(*)
  `)
  .eq('is_active', true)
  .lte('published_at', new Date().toISOString())
  .order('display_order', { ascending: true })
  .order('created_at', { ascending: false });

if (error) {
  console.error('설교 조회 실패:', error);
} else {
  console.log('설교 목록:', sermons);
}
```

### 2. 추천 설교만 조회

```typescript
const { data: featuredSermons, error } = await supabase
  .from('sermons')
  .select('*')
  .eq('is_active', true)
  .eq('is_featured', true)
  .lte('published_at', new Date().toISOString())
  .order('display_order', { ascending: true })
  .limit(10);
```

### 3. 카테고리별 설교 조회

```typescript
// 카테고리 ID로 필터링
const { data: sermons, error } = await supabase
  .from('sermons')
  .select(`
    *,
    category:sermon_categories(*)
  `)
  .eq('is_active', true)
  .eq('category_id', 1)  // 1 = 주일설교
  .order('sermon_date', { ascending: false })
  .limit(20);
```

### 4. 특정 설교 상세 조회

```typescript
const sermonId = 'uuid-here';

const { data: sermon, error } = await supabase
  .from('sermons')
  .select(`
    *,
    category:sermon_categories(*)
  `)
  .eq('id', sermonId)
  .single();
```

### 5. 카테고리 목록 조회

```typescript
const { data: categories, error } = await supabase
  .from('sermon_categories')
  .select('*')
  .eq('is_active', true)
  .order('display_order', { ascending: true });
```

### 6. 태그로 검색

```typescript
const searchTag = '은혜';

const { data: sermons, error } = await supabase
  .from('sermons')
  .select('*')
  .eq('is_active', true)
  .contains('tags', [searchTag]);
```

### 7. 조회수 기록

```typescript
// 설교 시청 시 조회수 기록
const recordView = async (
  sermonId: string,
  userId?: number,
  churchId?: number
) => {
  const { error } = await supabase
    .from('sermon_views')
    .insert({
      sermon_id: sermonId,
      user_id: userId,
      church_id: churchId,
    });

  if (error) {
    console.error('조회수 기록 실패:', error);
  }
};

// 사용 예
await recordView('sermon-uuid', 123, 456);
```

**참고:** `sermon_views` 테이블에 INSERT하면 트리거가 자동으로 `sermons.view_count`를 증가시킵니다.

### 8. 페이지네이션

```typescript
const ITEMS_PER_PAGE = 10;
const page = 0; // 0부터 시작

const { data: sermons, error, count } = await supabase
  .from('sermons')
  .select('*', { count: 'exact' })
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

console.log(`총 ${count}개 중 ${sermons?.length}개 조회`);
```

---

## 화면 구성 제안

### 1. 명설교 메인 화면

**구성 요소:**
- 상단: 추천 설교 캐러셀 (is_featured = true인 항목)
- 카테고리 탭바 (주일설교, 수요예배, 금요기도회 등)
- 설교 목록 (그리드 또는 리스트)

**각 설교 카드에 표시할 정보:**
- 썸네일 이미지 (`thumbnail_url`)
- 설교 제목 (`title`)
- 설교자 (`preacher_name`)
- 본문 말씀 (`scripture_reference`)
- 조회수 (`view_count`)
- 설교 날짜 (`sermon_date`)
- 추천 뱃지 (is_featured가 true인 경우)

### 2. 설교 상세 화면

**구성 요소:**
- 유튜브 플레이어 (YouTube 임베딩)
- 설교 제목, 설교자, 날짜
- 본문 말씀
- 설교 설명
- 태그 목록
- 카테고리 정보
- 조회수
- 공유 버튼

### 3. 카테고리별 화면

각 카테고리별로 설교 목록을 필터링하여 표시

### 4. 검색 화면

- 제목, 설교자, 태그로 검색
- 최근 검색어
- 인기 태그

---

## 주요 기능 구현

### 1. 유튜브 플레이어 임베딩

#### React Native (Expo) 예제

```typescript
import { WebView } from 'react-native-webview';

interface YouTubePlayerProps {
  videoId: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId }) => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <WebView
      source={{ uri: embedUrl }}
      style={{ flex: 1, height: 300 }}
      allowsFullscreenVideo={true}
    />
  );
};

// 사용 예
<YouTubePlayer videoId={sermon.youtube_video_id} />
```

#### React Native WebView HTML 방식

```typescript
const getYouTubeHTML = (videoId: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; }
        .video-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; }
        .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div class="video-container">
        <iframe
          src="https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1"
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
    </body>
  </html>
`;

<WebView
  source={{ html: getYouTubeHTML(sermon.youtube_video_id) }}
  style={{ height: 300 }}
/>
```

### 2. 썸네일 이미지 처리

유튜브 썸네일은 자동으로 생성되어 `thumbnail_url`에 저장됩니다.

**썸네일 URL 형식:**
```
https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg
```

**다양한 품질 옵션:**
- `maxresdefault.jpg` - 최대 해상도 (1920x1080)
- `sddefault.jpg` - 표준 해상도 (640x480)
- `hqdefault.jpg` - 고품질 (480x360)
- `mqdefault.jpg` - 중품질 (320x180)
- `default.jpg` - 기본 (120x90)

```typescript
// 썸네일이 없는 경우 폴백
const getThumbnailUrl = (sermon: Sermon) => {
  if (sermon.thumbnail_url) {
    return sermon.thumbnail_url;
  }
  return `https://img.youtube.com/vi/${sermon.youtube_video_id}/hqdefault.jpg`;
};
```

### 3. 조회수 추적 구현

설교 영상을 재생할 때 조회수를 기록합니다.

```typescript
const SermonDetailScreen = ({ sermonId }: { sermonId: string }) => {
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [viewRecorded, setViewRecorded] = useState(false);

  useEffect(() => {
    loadSermon();
  }, [sermonId]);

  const loadSermon = async () => {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('id', sermonId)
      .single();

    if (data) {
      setSermon(data);
    }
  };

  // 영상 재생 시작 시 조회수 기록
  const handleVideoStart = async () => {
    if (!viewRecorded) {
      await supabase.from('sermon_views').insert({
        sermon_id: sermonId,
        user_id: currentUser?.id,
        church_id: currentUser?.church_id,
      });
      setViewRecorded(true);
    }
  };

  return (
    <View>
      <YouTubePlayer
        videoId={sermon?.youtube_video_id}
        onPlay={handleVideoStart}
      />
      {/* 기타 UI */}
    </View>
  );
};
```

### 4. 캐싱 전략

자주 조회되는 데이터는 로컬 캐싱을 권장합니다.

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'sermons_cache';
const CACHE_DURATION = 1000 * 60 * 10; // 10분

const loadSermonsWithCache = async () => {
  try {
    // 캐시 확인
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    // 서버에서 새 데이터 가져오기
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      // 캐시 저장
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() })
      );
      return data;
    }
  } catch (error) {
    console.error('캐싱 오류:', error);
  }
};
```

---

## 주의사항

### 1. Row Level Security (RLS)

Supabase RLS 정책이 설정되어 있습니다:

- **SELECT**: 활성화되고 발행된 설교만 조회 가능 (`is_active = true AND published_at <= NOW()`)
- **INSERT/UPDATE/DELETE**: 관리자만 가능 (일반 사용자는 읽기 전용)

앱에서는 **SELECT만** 사용하면 됩니다.

### 2. 유튜브 API 사용량

썸네일 이미지는 YouTube CDN에서 직접 로드하므로 API 쿼터 제한이 없습니다.

### 3. 오프라인 지원

유튜브 영상은 스트리밍이므로 오프라인 재생이 불가능합니다.
- 메타데이터(제목, 설명 등)는 캐싱 가능
- 썸네일 이미지는 로컬 캐싱 권장

### 4. 에러 처리

```typescript
const loadSermons = async () => {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('is_active', true);

    if (error) {
      // Supabase 에러
      console.error('데이터베이스 오류:', error.message);
      showErrorToast('설교를 불러올 수 없습니다.');
      return;
    }

    if (!data || data.length === 0) {
      // 데이터 없음
      showInfoToast('등록된 설교가 없습니다.');
      return;
    }

    setSermons(data);
  } catch (error) {
    // 네트워크 또는 기타 오류
    console.error('알 수 없는 오류:', error);
    showErrorToast('네트워크 오류가 발생했습니다.');
  }
};
```

### 5. 성능 최적화

**권장 사항:**
- 무한 스크롤 또는 페이지네이션 구현
- 썸네일 이미지 lazy loading
- 설교 목록 가상화 (react-native-virtualized-list)
- 메타데이터 캐싱

```typescript
// 페이지네이션 예제
const ITEMS_PER_PAGE = 20;

const loadMoreSermons = async (page: number) => {
  const { data, error } = await supabase
    .from('sermons')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

  return data;
};
```

### 6. 날짜 포맷팅

```typescript
const formatSermonDate = (dateString?: string) => {
  if (!dateString) return '날짜 미정';

  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// 사용 예: "2024년 1월 7일"
```

---

## 추가 기능 제안

### 1. 즐겨찾기 기능

사용자별 즐겨찾기 기능을 추가하려면:

```sql
CREATE TABLE user_favorite_sermons (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  sermon_id UUID NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sermon_id)
);
```

### 2. 시청 기록

```sql
CREATE TABLE user_sermon_history (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  sermon_id UUID NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
  last_position_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sermon_id)
);
```

### 3. 푸시 알림

새로운 추천 설교가 등록되면 푸시 알림 발송

---

## 문의사항

기술 지원이 필요하거나 추가 기능 요청 사항이 있으면 백엔드 팀에 문의하세요.

**작성일:** 2024-11-24
**버전:** 1.0
**담당자:** 백엔드 개발팀
