# SearchFilterBar 컴포넌트

검색, 필터, 전체 개수 표시 기능을 제공하는 공통 UI 컴포넌트입니다.

## 기능

- 🔍 **검색 Input**: 초성 검색 지원
- 🔄 **전체보기 버튼**: 검색어 초기화
- ⚙️ **상세검색 버튼**: 상세 검색 모달 트리거
- 🏷️ **동적 필터**: 여러 개의 다중 선택 필터 지원
- 📊 **전체 개수 표시**: 현재 조회 결과 개수

## 설치 및 Import

```typescript
import { SearchFilterBar } from '../components/common';
import type { Filter } from '../components/common';
```

## 기본 사용법

### 1. 검색만 사용하는 경우

```typescript
import { SearchFilterBar } from '../components/common';

function MyComponent() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <SearchFilterBar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSearch={() => setSearchTerm('')}
      searchPlaceholder="이름 또는 전화번호 검색"
      totalCount={100}
    />
  );
}
```

### 2. 검색 + 상세검색 버튼

```typescript
import { SearchFilterBar } from '../components/common';

function MyComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdvancedSearchActive, setIsAdvancedSearchActive] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const handleAdvancedSearchClear = () => {
    setIsAdvancedSearchActive(false);
    // 상세검색 데이터 초기화 로직
  };

  return (
    <SearchFilterBar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSearch={() => setSearchTerm('')}
      searchDisabled={isAdvancedSearchActive}
      // 상세검색 관련
      showAdvancedSearch={true}
      isAdvancedSearchActive={isAdvancedSearchActive}
      onAdvancedSearchClick={() => setShowAdvancedSearch(true)}
      onAdvancedSearchClear={handleAdvancedSearchClear}
      totalCount={100}
    />
  );
}
```

### 3. 검색 + 필터

```typescript
import { SearchFilterBar } from '../components/common';
import type { Filter } from '../components/common';

function MyComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const filters: Filter[] = [
    {
      id: 'status',
      label: '상태',
      value: statusFilter,
      options: [
        { value: 'active', label: '활성' },
        { value: 'inactive', label: '비활성' },
        { value: 'pending', label: '대기중' },
      ],
      onChange: setStatusFilter,
    },
  ];

  return (
    <SearchFilterBar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSearch={() => setSearchTerm('')}
      filters={filters}
      totalCount={100}
    />
  );
}
```

### 4. 전체 기능 사용 (교인관리 예시)

```typescript
import { SearchFilterBar } from '../components/common';
import type { Filter } from '../components/common';

function MemberManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdvancedSearchActive, setIsAdvancedSearchActive] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [invitationStatusFilter, setInvitationStatusFilter] = useState<string[]>([]);

  const filters: Filter[] = [
    {
      id: 'invitation-status',
      label: '초대상태',
      value: invitationStatusFilter,
      options: [
        { value: 'pending', label: '대기중' },
        { value: 'sent', label: '발송완료' },
        { value: 'active', label: '등록완료' },
        { value: 'failed', label: '발송실패' },
      ],
      onChange: setInvitationStatusFilter,
    },
  ];

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (isAdvancedSearchActive) {
      setIsAdvancedSearchActive(false);
    }
  };

  const handleAdvancedSearchClear = () => {
    setIsAdvancedSearchActive(false);
    // 상세검색 데이터 초기화
  };

  return (
    <SearchFilterBar
      // 검색
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      onClearSearch={() => setSearchTerm('')}
      searchPlaceholder="이름 또는 전화번호 (초성 실시간 검색: ㄱㅊㅅ)"
      searchDisabled={isAdvancedSearchActive}
      // 상세검색
      showAdvancedSearch={true}
      isAdvancedSearchActive={isAdvancedSearchActive}
      onAdvancedSearchClick={() => setShowAdvancedSearch(true)}
      onAdvancedSearchClear={handleAdvancedSearchClear}
      // 필터
      filters={filters}
      // 전체 개수
      totalCount={pagination.total_count}
    />
  );
}
```

## Props

### SearchFilterBarProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `searchTerm` | `string` | ✅ | - | 현재 검색어 |
| `onSearchChange` | `(value: string) => void` | ✅ | - | 검색어 변경 핸들러 |
| `onClearSearch` | `() => void` | ✅ | - | 검색어 초기화 핸들러 |
| `searchPlaceholder` | `string` | ❌ | `'검색'` | 검색 input placeholder |
| `searchDisabled` | `boolean` | ❌ | `false` | 검색 input 비활성화 여부 |
| `isAdvancedSearchActive` | `boolean` | ❌ | `false` | 상세검색 활성화 여부 |
| `onAdvancedSearchClick` | `() => void` | ❌ | - | 상세검색 버튼 클릭 핸들러 |
| `onAdvancedSearchClear` | `() => void` | ❌ | - | 상세검색 초기화 핸들러 |
| `showAdvancedSearch` | `boolean` | ❌ | `false` | 상세검색 버튼 표시 여부 |
| `filters` | `Filter[]` | ❌ | `[]` | 필터 목록 |
| `totalCount` | `number` | ❌ | - | 전체 개수 (undefined면 표시 안 함) |
| `totalLabel` | `string` | ❌ | `'전체'` | 전체 개수 레이블 |
| `onKeyPress` | `(e: React.KeyboardEvent) => void` | ❌ | - | 검색 input 키 이벤트 핸들러 |

### Filter Type

```typescript
interface Filter {
  id: string;              // 필터 고유 ID
  label: string;           // 필터 버튼 레이블
  value: string[];         // 선택된 값들
  options: FilterOption[]; // 필터 옵션 목록
  onChange: (value: string[]) => void; // 선택 변경 핸들러
}

interface FilterOption {
  value: string;  // 옵션 값
  label: string;  // 옵션 레이블
}
```

## 스타일링

컴포넌트는 Tailwind CSS를 사용하며, 기본 스타일은 다음과 같습니다:

- **검색 Input**: `w-full md:w-[400px]` - 모바일에서 전체 너비, 데스크톱에서 400px
- **버튼/필터**: 흰색 배경 + 회색 테두리, 활성화 시 파란색 테두리와 텍스트
- **전체 개수**: 우측 정렬, 상단 테두리 포함

## 주의사항

1. **필터는 다중 선택만 지원**: 현재 버전은 다중 선택(checkbox) 필터만 지원합니다
2. **상세검색과 일반 검색의 상호 배타성**: 상세검색 활성화 시 일반 검색 input이 비활성화되도록 `searchDisabled` prop을 설정하세요
3. **필터 ID의 고유성**: 각 필터의 `id`는 고유해야 합니다 (checkbox id 생성에 사용됨)

## 페이지 헤더와 함께 사용하기

SearchFilterBar는 일반적으로 PageContainer와 함께 사용됩니다. 깔끔한 UI를 위해 서브타이틀은 제거하는 것을 권장합니다.

### PageHeader 서브타이틀 제거

```typescript
import { PageContainer, PageHeader } from '../components/ui';
import { SearchFilterBar } from '../components/common';

function MyComponent() {
  return (
    <PageContainer
      header={
        <PageHeader
          title="교인관리"
          // description을 생략하면 서브타이틀이 표시되지 않음
          actions={
            // 필요한 액션 버튼들
          }
        />
      }
    >
      <SearchFilterBar
        // SearchFilterBar props
      />

      {/* 나머지 컨텐츠 */}
    </PageContainer>
  );
}
```

### 권장 레이아웃 구조

```
┌─────────────────────────────────────────┐
│ PageHeader (타이틀만)                    │
│ ├─ title: "교인관리"                     │
│ └─ actions: [액션 버튼들]                │
├─────────────────────────────────────────┤
│ SearchFilterBar                          │
│ ├─ 검색 Input                            │
│ ├─ 상세검색 버튼                         │
│ ├─ 필터들                                │
│ └─ 전체 개수                             │
├─────────────────────────────────────────┤
│ 메인 컨텐츠 (테이블, 카드 등)             │
└─────────────────────────────────────────┘
```

### PageHeader 타이틀 크기 조정

타이틀 크기는 이미 `text-xl`로 최적화되어 있습니다 (기본 `text-2xl`에서 변경).

```typescript
// PageContainer.tsx 내부 구현
<h1 className="text-xl font-bold text-gray-900">{title}</h1>
```

## 향후 개선 사항

- [ ] 단일 선택(radio) 필터 지원
- [ ] 날짜 범위 필터 지원
- [ ] 정렬 옵션 통합
- [ ] 필터 프리셋 저장/불러오기
- [ ] 커스텀 필터 렌더링 지원
