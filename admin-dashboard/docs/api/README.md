# 명설교 기능 개발 가이드

## 📚 문서 목록

1. **[Quick Start 가이드](./sermons-quick-start.md)** ⚡
   - 5분 만에 시작하기
   - 필수 쿼리 예제
   - 빠른 구현 예제

2. **[전체 API 가이드](./sermons-api-guide.md)** 📖
   - 상세 데이터베이스 스키마
   - 모든 API 사용 예제
   - 화면 구성 제안
   - 성능 최적화 팁
   - 주의사항 및 에러 처리

3. **[즐겨찾기 가이드](./sermons-favorites-guide.md)** ⭐
   - 즐겨찾기 추가/삭제
   - 즐겨찾기 목록 조회
   - 완성된 React Native 예제
   - 실시간 업데이트 (선택)

4. **[주제 태그 가이드](./sermon-topics-guide.md)** 🏷️
   - 5가지 주제 활용법
   - 주제별 필터링
   - UI 구현 예제
   - 추천 기능 아이디어

## 🎯 기능 개요

**명설교**는 시스템 관리자가 선별한 유튜브 설교 영상을 모든 앱 사용자에게 제공하는 기능입니다.

### 핵심 기능
- ✅ 유튜브 영상 임베딩
- ✅ 카테고리별 분류 (주일설교, 수요예배 등)
- ✅ 추천 설교 표시
- ✅ 조회수 통계
- ✅ 태그 기반 검색
- ✅ 본문 말씀 정보
- ✅ 사용자별 즐겨찾기 (NEW!)

## 🗂️ 데이터베이스 구조

```
sermon_categories (카테고리)
    ├── id
    ├── name (주일설교, 수요예배 등)
    └── display_order

sermons (설교 정보) ⭐ 메인 테이블
    ├── id (UUID)
    ├── title (제목)
    ├── youtube_video_id (유튜브 ID)
    ├── thumbnail_url (썸네일)
    ├── preacher_name (설교자)
    ├── scripture_reference (본문 말씀)
    ├── description (설명)
    ├── category_id → sermon_categories
    ├── tags (태그 배열)
    ├── is_featured (추천 여부)
    ├── view_count (조회수)
    └── is_active (활성화)

sermon_views (조회 로그)
    ├── sermon_id → sermons
    ├── user_id
    ├── church_id
    └── viewed_at

sermon_favorites (즐겨찾기) ⭐ NEW!
    ├── sermon_id → sermons
    ├── user_id
    ├── church_id
    └── created_at
```

## 🚀 빠른 시작

### 1단계: Supabase 클라이언트 설정
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);
```

### 2단계: 설교 목록 조회
```typescript
const { data: sermons } = await supabase
  .from('sermons')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

### 3단계: 유튜브 플레이어 표시
```typescript
<WebView
  source={{
    uri: `https://www.youtube.com/embed/${sermon.youtube_video_id}`
  }}
  allowsFullscreenVideo
/>
```

## 📱 화면 구성 예시

### 메인 화면
```
┌─────────────────────────────┐
│  🌟 추천 설교 (캐러셀)       │
├─────────────────────────────┤
│  [주일] [수요] [금요] [특별] │ ← 카테고리 탭
├─────────────────────────────┤
│  ┌────┐                      │
│  │썸네│ 은혜와 진리...        │
│  │일 │ 김영진 목사           │
│  └────┘ 요한복음 1:14-18     │
│         조회수 1,234         │
├─────────────────────────────┤
│  ┌────┐                      │
│  │썸네│ 십자가의 능력...      │
│  │일 │ 이성호 목사           │
│  └────┘ 고전 1:18-25         │
│         조회수 892           │
└─────────────────────────────┘
```

### 상세 화면
```
┌─────────────────────────────┐
│                              │
│    유튜브 플레이어           │
│                              │
├─────────────────────────────┤
│ 은혜와 진리가 충만하신 예수   │
│ 김영진 목사 | 2024.01.07     │
│ 📖 요한복음 1:14-18          │
├─────────────────────────────┤
│ 요한복음 1장을 통해...       │
│ (설교 설명)                  │
├─────────────────────────────┤
│ #은혜 #진리 #요한복음        │
│ 👁 조회수 1,234              │
│ [공유] [즐겨찾기]            │
└─────────────────────────────┘
```

## 🔥 필수 구현 사항

### 1. 추천 설교 표시
```typescript
.eq('is_featured', true)
```

### 2. 카테고리 필터링
```typescript
.eq('category_id', selectedCategoryId)
```

### 3. 조회수 기록
```typescript
await supabase
  .from('sermon_views')
  .insert({
    sermon_id: sermonId,
    user_id: userId,
  });
```

### 4. 즐겨찾기 기능 (NEW!)
```typescript
// 즐겨찾기 추가
await supabase
  .from('sermon_favorites')
  .insert({
    sermon_id: sermonId,
    user_id: userId,
  });

// 즐겨찾기 목록 조회
const { data } = await supabase
  .from('sermon_favorites')
  .select('*, sermon:sermons(*)')
  .eq('user_id', userId);
```

👉 **상세 가이드**: [sermons-favorites-guide.md](./sermons-favorites-guide.md)

## ⚠️ 주의사항

1. **RLS 정책**: 앱에서는 SELECT만 사용 (INSERT/UPDATE/DELETE 불가)
2. **활성화 필터**: 항상 `is_active = true` 조건 추가
3. **발행 시간**: `published_at <= NOW()` 조건으로 예약 발행 처리
4. **조회수 중복**: 한 사용자가 한 설교를 여러 번 시청해도 조회수는 한 번만 증가하도록 처리 권장

## 📊 성능 최적화

- **캐싱**: 10분 간격으로 설교 목록 캐싱
- **페이지네이션**: 20개씩 로드
- **Lazy Loading**: 썸네일 이미지 지연 로드
- **가상화**: FlatList 또는 VirtualizedList 사용

## 💬 자주 묻는 질문

**Q: 유튜브 API 키가 필요한가요?**
A: 아니요. 썸네일과 임베딩은 API 키 없이 사용 가능합니다.

**Q: 오프라인에서도 재생 가능한가요?**
A: 유튜브 스트리밍이므로 오프라인 재생은 불가능합니다.

**Q: 조회수는 어떻게 집계되나요?**
A: `sermon_views` 테이블에 INSERT하면 트리거가 자동으로 `sermons.view_count`를 증가시킵니다.

**Q: 카테고리를 추가하려면?**
A: `sermon_categories` 테이블에 직접 INSERT하거나 시스템 관리자에게 요청하세요.

## 🛠️ 개발 순서 제안

1. ✅ 설교 목록 화면 구현
2. ✅ 썸네일 및 기본 정보 표시
3. ✅ 상세 화면 및 유튜브 플레이어
4. ✅ 조회수 기록 기능
5. ✅ 추천 설교 캐러셀
6. ✅ 카테고리 탭 필터링
7. ✅ 검색 기능 (옵션)
8. ✅ 즐겨찾기 기능 (옵션)

## 📞 지원

- 📖 **상세 문서**: [sermons-api-guide.md](./sermons-api-guide.md)
- ⚡ **빠른 시작**: [sermons-quick-start.md](./sermons-quick-start.md)
- 💬 **문의**: 백엔드 개발팀

---

**최종 업데이트**: 2024-11-24
**버전**: 1.0
