# 설교 주제 태그 가이드

## 📋 개요

시스템 관리자가 설교를 등록할 때 **5가지 주제**를 다중 선택할 수 있습니다.
앱에서는 이 주제를 활용하여 필터링, 검색, 추천 기능을 구현할 수 있습니다.

---

## 🏷️ 주제 목록 (고정)

```typescript
const SERMON_TOPICS = [
  '믿음',
  '사랑',
  '은혜',
  '소망',
  '섬김'
];
```

**특징:**
- ✅ 5개 주제로 고정
- ✅ 한 설교에 여러 주제 선택 가능 (예: "믿음, 사랑")
- ✅ `sermons.tags` 배열 필드에 저장됨

---

## 🚀 사용 예제

### 1. 주제별 설교 필터링

```typescript
// "믿음" 주제를 포함한 설교 조회
const { data } = await supabase
  .from('sermons')
  .select('*')
  .contains('tags', ['믿음'])
  .eq('is_active', true);
```

### 2. 여러 주제로 검색

```typescript
// "믿음" 또는 "사랑" 주제를 포함한 설교 조회
const { data } = await supabase
  .from('sermons')
  .select('*')
  .or('tags.cs.{"믿음"},tags.cs.{"사랑"}')
  .eq('is_active', true);
```

### 3. 주제 필터 UI 구현

```typescript
const TopicFilterScreen = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const topics = ['믿음', '사랑', '은혜', '소망', '섬김'];

  return (
    <View>
      <ScrollView horizontal>
        <TouchableOpacity onPress={() => setSelectedTopic(null)}>
          <Chip selected={!selectedTopic}>전체</Chip>
        </TouchableOpacity>

        {topics.map((topic) => (
          <TouchableOpacity
            key={topic}
            onPress={() => setSelectedTopic(topic)}
          >
            <Chip selected={selectedTopic === topic}>{topic}</Chip>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SermonList topic={selectedTopic} />
    </View>
  );
};
```

### 4. 설교 카드에 주제 표시

```typescript
const SermonCard = ({ sermon }) => (
  <View>
    <Text>{sermon.title}</Text>
    <Text>{sermon.preacher_name}</Text>

    {/* 주제 태그 표시 */}
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {sermon.tags?.map((tag) => (
        <Badge key={tag}>{tag}</Badge>
      ))}
    </View>
  </View>
);
```

---

## 💡 추천 기능 아이디어

### 1. 주제별 탭

```
[전체] [믿음] [사랑] [은혜] [소망] [섬김]
```

### 2. 관심 주제 설정

사용자가 관심 있는 주제를 선택하면 해당 주제의 새 설교를 우선 표시

```typescript
const userPreferences = {
  favoriteTopics: ['믿음', '소망']
};

// 관심 주제 필터링
const { data } = await supabase
  .from('sermons')
  .select('*')
  .overlaps('tags', userPreferences.favoriteTopics)
  .order('created_at', { ascending: false });
```

### 3. 주제별 통계

```typescript
// 주제별 설교 개수 표시
const getTopicStats = async () => {
  const topics = ['믿음', '사랑', '은혜', '소망', '섬김'];
  const stats = {};

  for (const topic of topics) {
    const { count } = await supabase
      .from('sermons')
      .select('*', { count: 'exact', head: true })
      .contains('tags', [topic])
      .eq('is_active', true);

    stats[topic] = count;
  }

  return stats;
  // { 믿음: 45, 사랑: 32, 은혜: 28, 소망: 15, 섬김: 22 }
};
```

---

## 🎨 UI/UX 권장사항

### 칩 디자인

```typescript
// 선택된 주제
<Badge
  style={{
    backgroundColor: '#3B82F6',
    color: 'white'
  }}
>
  믿음
</Badge>

// 선택 안 된 주제
<Badge
  style={{
    backgroundColor: 'transparent',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    color: '#6B7280'
  }}
>
  사랑
</Badge>
```

### 레이아웃

```
┌─────────────────────────────┐
│ 주제별 설교                  │
├─────────────────────────────┤
│ [전체] [믿음] [사랑]         │ ← 가로 스크롤 칩
│ [은혜] [소망] [섬김]         │
├─────────────────────────────┤
│ 📖 믿음의 여정              │
│ 김영진 목사 | 믿음 소망      │ ← 다중 태그 표시
│ 👁 1,234                    │
├─────────────────────────────┤
│ 📖 사랑의 실천              │
│ 이성호 목사 | 사랑 섬김      │
│ 👁 892                      │
└─────────────────────────────┘
```

---

## ⚠️ 주의사항

1. **태그는 배열**: `sermon.tags`는 배열이므로 `.contains()` 또는 `.overlaps()` 사용
2. **대소문자 정확히**: '믿음' (O), '믿  음' (X) - 정확한 문자열 매칭
3. **빈 배열 처리**: 주제가 없는 설교도 있을 수 있으므로 `tags?.length > 0` 체크 필요

---

## 📱 완성 예제

```typescript
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const SermonsByTopicScreen = () => {
  const [sermons, setSermons] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const topics = ['믿음', '사랑', '은혜', '소망', '섬김'];

  useEffect(() => {
    loadSermons();
  }, [selectedTopic]);

  const loadSermons = async () => {
    let query = supabase
      .from('sermons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // 주제 필터 적용
    if (selectedTopic) {
      query = query.contains('tags', [selectedTopic]);
    }

    const { data } = await query;
    setSermons(data || []);
  };

  return (
    <View>
      {/* 주제 필터 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity onPress={() => setSelectedTopic(null)}>
          <Chip selected={!selectedTopic}>전체</Chip>
        </TouchableOpacity>

        {topics.map((topic) => (
          <TouchableOpacity
            key={topic}
            onPress={() => setSelectedTopic(topic)}
          >
            <Chip selected={selectedTopic === topic}>{topic}</Chip>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 설교 목록 */}
      <FlatList
        data={sermons}
        renderItem={({ item }) => (
          <View>
            <Text>{item.title}</Text>
            <Text>{item.preacher_name}</Text>

            {/* 주제 태그 */}
            {item.tags?.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {item.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};
```

---

## 📞 지원

- **관련 문서**: [sermons-api-guide.md](./sermons-api-guide.md)
- **문의**: 백엔드 개발팀

---

**최종 업데이트**: 2024-11-24
**버전**: 1.0
