# 명설교 기능 Quick Start 가이드

## 🚀 5분 만에 시작하기

### 1. Supabase 설정

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);
```

### 2. 설교 목록 불러오기

```typescript
const { data: sermons } = await supabase
  .from('sermons')
  .select(`
    *,
    category:sermon_categories(*)
  `)
  .eq('is_active', true)
  .order('display_order')
  .limit(10);
```

### 3. 유튜브 플레이어 표시

```typescript
import { WebView } from 'react-native-webview';

<WebView
  source={{
    uri: `https://www.youtube.com/embed/${sermon.youtube_video_id}`
  }}
  style={{ height: 300 }}
  allowsFullscreenVideo
/>
```

### 4. 조회수 기록

```typescript
await supabase
  .from('sermon_views')
  .insert({
    sermon_id: sermonId,
    user_id: currentUserId,
  });
```

## 📊 주요 필드

| 필드 | 용도 |
|------|------|
| `youtube_video_id` | 유튜브 플레이어에 사용 |
| `thumbnail_url` | 썸네일 이미지 URL |
| `title` | 설교 제목 |
| `preacher_name` | 설교자 이름 |
| `scripture_reference` | 본문 말씀 |
| `is_featured` | 추천 설교 여부 |
| `view_count` | 조회수 |

## 🎯 필수 쿼리 3가지

### 1. 추천 설교
```typescript
.eq('is_featured', true)
```

### 2. 카테고리별
```typescript
.eq('category_id', categoryId)
```

### 3. 활성화된 것만
```typescript
.eq('is_active', true)
```

## 💡 꿀팁

1. **썸네일 fallback**: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
2. **캐싱**: 10분 간격으로 목록 캐싱 권장
3. **페이지네이션**: `.range(start, end)` 사용
4. **조회수 중복 방지**: 한 번만 기록하도록 플래그 관리

## 📱 완성 예제

```typescript
// 설교 목록 화면
const SermonListScreen = () => {
  const [sermons, setSermons] = useState([]);

  useEffect(() => {
    loadSermons();
  }, []);

  const loadSermons = async () => {
    const { data } = await supabase
      .from('sermons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    setSermons(data || []);
  };

  return (
    <FlatList
      data={sermons}
      renderItem={({ item }) => (
        <SermonCard sermon={item} />
      )}
    />
  );
};

// 설교 카드 컴포넌트
const SermonCard = ({ sermon }) => (
  <TouchableOpacity onPress={() => navigate('SermonDetail', { id: sermon.id })}>
    <Image source={{ uri: sermon.thumbnail_url }} />
    <Text>{sermon.title}</Text>
    <Text>{sermon.preacher_name}</Text>
    <Text>{sermon.scripture_reference}</Text>
    <Text>조회수 {sermon.view_count}</Text>
  </TouchableOpacity>
);
```

## 📞 문의

상세 문서: `sermons-api-guide.md` 참고
