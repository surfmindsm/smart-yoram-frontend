# 명설교 즐겨찾기 기능 가이드

## 📋 개요

사용자가 마음에 드는 설교를 즐겨찾기에 추가하고, 나중에 모아서 볼 수 있는 기능입니다.

---

## 🚀 빠른 시작

### 1. 즐겨찾기 추가

```typescript
const { data, error } = await supabase
  .from('sermon_favorites')
  .insert({
    sermon_id: 'UUID',
    user_id: currentUserId,
    church_id: currentChurchId  // 선택
  });
```

### 2. 즐겨찾기 삭제

```typescript
const { error } = await supabase
  .from('sermon_favorites')
  .delete()
  .eq('sermon_id', sermonId)
  .eq('user_id', currentUserId);
```

### 3. 즐겨찾기 목록 조회

```typescript
const { data: favorites } = await supabase
  .from('sermon_favorites')
  .select(`
    *,
    sermon:sermons(*)
  `)
  .eq('user_id', currentUserId)
  .order('created_at', { ascending: false });
```

### 4. 즐겨찾기 여부 확인

```typescript
const { data } = await supabase
  .from('sermon_favorites')
  .select('id')
  .eq('sermon_id', sermonId)
  .eq('user_id', currentUserId)
  .single();

const isFavorited = !!data;
```

---

## 📊 데이터베이스 스키마

### sermon_favorites 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL | 기본 키 |
| sermon_id | UUID | 설교 ID (FK) |
| user_id | INTEGER | 사용자 ID |
| church_id | INTEGER | 교회 ID (선택) |
| created_at | TIMESTAMP | 즐겨찾기 추가 시간 |

**UNIQUE 제약**: (sermon_id, user_id) - 중복 즐겨찾기 방지

### sermons 테이블 추가 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| favorite_count | INTEGER | 즐겨찾기 개수 (자동 업데이트) |

---

## 💡 완성 예제

### React Native 컴포넌트

```typescript
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const SermonDetailScreen = ({ sermon, userId }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  // 즐겨찾기 여부 확인
  useEffect(() => {
    checkFavoriteStatus();
  }, [sermon.id]);

  const checkFavoriteStatus = async () => {
    const { data } = await supabase
      .from('sermon_favorites')
      .select('id')
      .eq('sermon_id', sermon.id)
      .eq('user_id', userId)
      .single();

    setIsFavorited(!!data);
  };

  // 즐겨찾기 토글
  const toggleFavorite = async () => {
    setLoading(true);
    try {
      if (isFavorited) {
        // 즐겨찾기 해제
        await supabase
          .from('sermon_favorites')
          .delete()
          .eq('sermon_id', sermon.id)
          .eq('user_id', userId);

        setIsFavorited(false);
      } else {
        // 즐겨찾기 추가
        await supabase
          .from('sermon_favorites')
          .insert({
            sermon_id: sermon.id,
            user_id: userId,
          });

        setIsFavorited(true);
      }
    } catch (error) {
      console.error('즐겨찾기 처리 실패:', error);
      alert('즐겨찾기 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={toggleFavorite} disabled={loading}>
        <Icon
          name={isFavorited ? 'heart' : 'heart-outline'}
          size={24}
          color={isFavorited ? 'red' : 'gray'}
        />
        <Text>{sermon.favorite_count} 명이 즐겨찾기</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 즐겨찾기 목록 화면

```typescript
const FavoriteSermonsScreen = ({ userId }) => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const { data } = await supabase
      .from('sermon_favorites')
      .select(`
        id,
        created_at,
        sermon:sermons(
          id,
          title,
          youtube_video_id,
          thumbnail_url,
          preacher_name,
          scripture_reference,
          view_count,
          favorite_count
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setFavorites(data || []);
  };

  return (
    <FlatList
      data={favorites}
      renderItem={({ item }) => (
        <SermonCard sermon={item.sermon} />
      )}
    />
  );
};
```

---

## 🎯 주요 API 사용 패턴

### 1. 즐겨찾기 추가 (중복 체크 포함)

```typescript
const addToFavorites = async (sermonId: string, userId: number) => {
  try {
    const { data, error } = await supabase
      .from('sermon_favorites')
      .insert({
        sermon_id: sermonId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      // UNIQUE 제약 위반 시 에러 발생
      if (error.code === '23505') {
        console.log('이미 즐겨찾기에 추가되어 있습니다.');
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('즐겨찾기 추가 실패:', error);
    throw error;
  }
};
```

### 2. 설교 목록에서 즐겨찾기 여부 표시

```typescript
const loadSermonsWithFavorites = async (userId: number) => {
  // 1. 모든 설교 조회
  const { data: sermons } = await supabase
    .from('sermons')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // 2. 사용자의 즐겨찾기 목록 조회
  const { data: favorites } = await supabase
    .from('sermon_favorites')
    .select('sermon_id')
    .eq('user_id', userId);

  const favoriteIds = new Set(favorites?.map(f => f.sermon_id) || []);

  // 3. 즐겨찾기 여부 추가
  const sermonsWithFavorites = sermons?.map(sermon => ({
    ...sermon,
    isFavorited: favoriteIds.has(sermon.id),
  }));

  return sermonsWithFavorites;
};
```

### 3. 인기 설교 조회 (즐겨찾기 수 기준)

```typescript
const { data: popularSermons } = await supabase
  .from('sermons')
  .select('*')
  .eq('is_active', true)
  .order('favorite_count', { ascending: false })
  .limit(10);
```

---

## ⚠️ 주의사항

### 1. 중복 즐겨찾기 방지

테이블에 UNIQUE 제약이 설정되어 있으므로, 중복 추가 시 에러가 발생합니다.

```typescript
// 에러 처리 예제
try {
  await supabase.from('sermon_favorites').insert({ ... });
} catch (error) {
  if (error.code === '23505') {
    // 이미 즐겨찾기 되어 있음
    console.log('Already favorited');
  }
}
```

### 2. 즐겨찾기 개수 동기화

`favorite_count`는 트리거에 의해 자동으로 업데이트됩니다. 직접 수정하지 마세요.

### 3. 삭제된 설교 처리

설교가 삭제되면 `ON DELETE CASCADE`에 의해 관련 즐겨찾기도 자동으로 삭제됩니다.

---

## 🔥 고급 기능

### 1. 실시간 즐겨찾기 업데이트 (선택)

```typescript
useEffect(() => {
  // 실시간 구독
  const subscription = supabase
    .channel('sermon_favorites_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sermon_favorites',
        filter: `sermon_id=eq.${sermonId}`
      },
      (payload) => {
        console.log('즐겨찾기 변경:', payload);
        // UI 업데이트
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [sermonId]);
```

### 2. 즐겨찾기 통계

```typescript
// 사용자의 총 즐겨찾기 수
const { count } = await supabase
  .from('sermon_favorites')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);

// 특정 설교의 즐겨찾기 수
const { data: sermon } = await supabase
  .from('sermons')
  .select('favorite_count')
  .eq('id', sermonId)
  .single();
```

### 3. 즐겨찾기한 설교 검색

```typescript
const { data } = await supabase
  .from('sermon_favorites')
  .select(`
    sermon:sermons(
      id,
      title,
      preacher_name
    )
  `)
  .eq('user_id', userId)
  .ilike('sermon.title', `%${searchQuery}%`);
```

---

## 📱 UI/UX 권장사항

### 1. 즐겨찾기 버튼

- ❤️ 채워진 하트: 즐겨찾기 됨
- 🤍 빈 하트: 즐겨찾기 안 됨
- 애니메이션 추가 권장 (확대/축소 효과)

### 2. 즐겨찾기 목록

- 최신 순 정렬 (created_at DESC)
- 삭제 기능 제공 (스와이프 또는 버튼)
- 빈 상태 처리 ("아직 즐겨찾기한 설교가 없습니다")

### 3. 피드백

- 즐겨찾기 추가/해제 시 Toast 메시지
- 로딩 상태 표시
- 오프라인 상태 처리

---

## 📞 지원

- **문의**: 백엔드 개발팀
- **관련 문서**:
  - [명설교 API 가이드](./sermons-api-guide.md)
  - [Quick Start](./sermons-quick-start.md)

---

**최종 업데이트**: 2024-11-24
**버전**: 1.0
