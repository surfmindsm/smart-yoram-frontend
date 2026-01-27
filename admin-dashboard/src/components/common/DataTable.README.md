# DataTable 컴포넌트

재사용 가능한 공통 테이블 컴포넌트입니다. shadcn/ui와 Tailwind CSS를 기반으로 하며, TypeScript 제네릭을 활용하여 타입 안정성을 보장합니다.

## 주요 기능

- ✅ **동적 컬럼 정의**: 유연한 컬럼 구성 (render, format)
- ✅ **정렬 기능**: 클라이언트/서버 사이드 정렬
- ✅ **페이지네이션**: 클라이언트/서버 사이드 페이지네이션
- ✅ **로딩 상태**: Spinner와 메시지 표시
- ✅ **빈 데이터 처리**: 커스터마이징 가능한 빈 상태
- ✅ **행 클릭 이벤트**: 선택적 행 클릭 핸들러
- ✅ **Card 래퍼**: 선택적 Card 컨테이너
- ✅ **TypeScript**: 완전한 타입 지원
- ✅ **shadcn/ui**: 기존 프로젝트 UI와 완벽 통합

## 기본 사용법

```typescript
import DataTable, { Column } from '@/components/common/DataTable';

interface Member {
  id: number;
  name: string;
  phone: string;
}

function MemberList() {
  const columns: Column<Member>[] = [
    { id: 'id', label: 'ID', width: 'w-[80px]' },
    { id: 'name', label: '이름' },
    { id: 'phone', label: '전화번호' },
  ];

  const members: Member[] = [
    { id: 1, name: '홍길동', phone: '010-1234-5678' },
  ];

  return (
    <DataTable
      columns={columns}
      data={members}
      rowKey="id"
      cardTitle="교인 목록"
    />
  );
}
```

## Column 정의

### 기본 속성

```typescript
interface Column<T> {
  id: keyof T | string;           // 컬럼 식별자
  label: string;                   // 헤더 레이블
  sortable?: boolean;              // 정렬 가능 여부 (기본: true)
  width?: string;                  // Tailwind class (예: 'w-[100px]')
  align?: 'left' | 'center' | 'right'; // 정렬
  className?: string;              // 추가 CSS 클래스
  render?: (row: T, index: number) => React.ReactNode;
  format?: (value: any, row: T) => React.ReactNode;
}
```

### render vs format

- **format**: 특정 컬럼 값만 포맷팅할 때
- **render**: 행 전체 데이터를 사용한 복잡한 렌더링이 필요할 때

```typescript
// format 예시 - 날짜 포맷팅
{
  id: 'createdAt',
  label: '등록일',
  format: (value: string) => new Date(value).toLocaleDateString('ko-KR'),
}

// render 예시 - Badge 컴포넌트
{
  id: 'status',
  label: '상태',
  render: (row) => (
    <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
      {row.status === 'active' ? '활성' : '비활성'}
    </Badge>
  ),
}

// render 예시 - 액션 버튼
{
  id: 'actions',
  label: '작업',
  sortable: false,
  render: (row) => (
    <div className="flex gap-2">
      <Button size="sm" onClick={(e) => {
        e.stopPropagation(); // 행 클릭 방지
        handleEdit(row);
      }}>
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  ),
}
```

## Props 상세

### 필수 Props

| Prop | Type | 설명 |
|------|------|------|
| `columns` | `Column<T>[]` | 컬럼 정의 배열 |
| `data` | `T[]` | 표시할 데이터 배열 |
| `rowKey` | `keyof T \| ((row: T) => string \| number)` | 행 고유 키 |

### 선택적 Props

#### 데이터 & 이벤트

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `loading` | `boolean` | `false` | 로딩 상태 |
| `onRowClick` | `(row: T, index: number) => void` | - | 행 클릭 핸들러 |

#### 페이지네이션

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `pagination` | `boolean \| PaginationInfo` | `false` | 페이지네이션 설정 |
| `onPageChange` | `(page: number) => void` | - | 페이지 변경 핸들러 |
| `onRowsPerPageChange` | `(rowsPerPage: number) => void` | - | 페이지당 행 수 변경 핸들러 |
| `rowsPerPageOptions` | `number[]` | `[10, 25, 50, 100]` | 페이지당 행 수 옵션 |

**PaginationInfo 타입:**
```typescript
interface PaginationInfo {
  page: number;
  rowsPerPage: number;
  totalCount: number;
}
```

#### 정렬

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `sortable` | `boolean` | `true` | 정렬 기능 활성화 |
| `defaultSortBy` | `string` | - | 기본 정렬 컬럼 |
| `defaultSortOrder` | `'asc' \| 'desc'` | `'asc'` | 기본 정렬 순서 |
| `onSortChange` | `(sortBy: string, order: SortOrder) => void` | - | 정렬 변경 핸들러 |

#### 스타일

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `className` | `string` | - | 테이블 CSS 클래스 |
| `headerClassName` | `string` | - | 헤더 CSS 클래스 |
| `rowClassName` | `string \| ((row: T, index: number) => string)` | - | 행 CSS 클래스 |

#### 빈 데이터

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `emptyIcon` | `React.ReactNode` | - | 빈 상태 아이콘 |
| `emptyMessage` | `string` | `'데이터가 없습니다.'` | 빈 데이터 메시지 |

#### Card 래퍼

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `card` | `boolean` | `true` | Card로 감싸기 |
| `cardTitle` | `string` | - | Card 제목 |
| `cardDescription` | `string` | - | Card 설명 |
| `cardActions` | `React.ReactNode` | - | Card 헤더 액션 |

## 사용 패턴

### 1. 클라이언트 사이드 (기본)

```typescript
<DataTable
  columns={columns}
  data={allData}
  rowKey="id"
  pagination={true} // boolean만 전달
/>
```

### 2. 서버 사이드

```typescript
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);
const [totalCount, setTotalCount] = useState(0);

<DataTable
  columns={columns}
  data={currentPageData}
  rowKey="id"
  pagination={{ page, rowsPerPage, totalCount }}
  onPageChange={setPage}
  onRowsPerPageChange={(newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }}
  onSortChange={(sortBy, order) => {
    fetchData(sortBy, order);
  }}
/>
```

### 3. 기존 코드 마이그레이션

**Before (기존 코드):**
```typescript
<Card>
  <CardContent className="p-0">
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>전화번호</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.name}</TableCell>
              <TableCell>{member.phone}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>
```

**After (DataTable 사용):**
```typescript
const columns: Column<Member>[] = [
  { id: 'name', label: '이름' },
  { id: 'phone', label: '전화번호' },
];

<DataTable
  columns={columns}
  data={members}
  rowKey="id"
/>
```

### 4. 액션 버튼과 함께 사용

```typescript
const columns: Column<Member>[] = [
  { id: 'name', label: '이름' },
  { id: 'phone', label: '전화번호' },
  {
    id: 'actions',
    label: '작업',
    sortable: false,
    width: 'w-[120px]',
    align: 'center',
    render: (row) => (
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // 중요: 행 클릭 방지!
            handleEdit(row);
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

<DataTable
  columns={columns}
  data={members}
  rowKey="id"
  onRowClick={(row) => navigateToDetail(row.id)}
/>
```

### 5. 커스텀 행 스타일

```typescript
<DataTable
  columns={columns}
  data={members}
  rowKey="id"
  rowClassName={(row) => {
    if (row.status === 'inactive') return 'bg-gray-100 opacity-60';
    if (row.isUrgent) return 'bg-red-50';
    return '';
  }}
/>
```

### 6. Card 없이 사용

```typescript
<DataTable
  columns={columns}
  data={members}
  rowKey="id"
  card={false}
/>
```

### 7. 빈 상태 커스터마이징

```typescript
import { Heart } from 'lucide-react';

<DataTable
  columns={columns}
  data={[]}
  rowKey="id"
  emptyIcon={<Heart className="h-12 w-12 text-muted-foreground" />}
  emptyMessage="등록된 기도요청이 없습니다."
/>
```

## Tailwind Width 클래스

컬럼 너비는 Tailwind의 width 클래스를 사용합니다:

```typescript
{ id: 'id', label: 'ID', width: 'w-[80px]' }      // 고정 너비
{ id: 'id', label: 'ID', width: 'w-20' }          // Tailwind 유틸리티
{ id: 'name', label: '이름' }                      // 너비 미지정 (자동)
```

## 정렬 동작

### 클라이언트 사이드 정렬

`onSortChange`를 제공하지 않으면 자동으로 클라이언트 사이드 정렬:

```typescript
<DataTable
  columns={columns}
  data={allData}
  rowKey="id"
  defaultSortBy="name"
  defaultSortOrder="asc"
/>
```

### 서버 사이드 정렬

`onSortChange`를 제공하면 서버 사이드 정렬:

```typescript
<DataTable
  columns={columns}
  data={data}
  rowKey="id"
  onSortChange={(sortBy, order) => {
    fetchData({ sortBy, order });
  }}
/>
```

### 특정 컬럼만 정렬 비활성화

```typescript
const columns: Column<Member>[] = [
  { id: 'name', label: '이름' },
  { id: 'actions', label: '작업', sortable: false }, // 정렬 불가
];
```

## 타입 안정성

TypeScript 제네릭을 사용하여 완벽한 타입 추론:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
}

const columns: Column<Product>[] = [
  { id: 'name', label: '상품명' }, // ✅ 타입 안전
  { id: 'invalid', label: '잘못됨' }, // ❌ 컴파일 에러
];

<DataTable<Product>
  columns={columns}
  data={products}
  rowKey="id"
  onRowClick={(product) => {
    // product는 Product 타입으로 추론됨
    console.log(product.name);
  }}
/>
```

## 성능 최적화 팁

1. **대용량 데이터**: 서버 사이드 페이지네이션 사용
2. **복잡한 render 함수**: React.memo로 최적화
3. **rowKey**: 가능하면 함수보다 속성명 직접 사용

```typescript
// ✅ 좋음: 속성명 직접 사용
<DataTable rowKey="id" />

// ⚠️ 느림: 함수 사용
<DataTable rowKey={(row) => row.id} />
```

## 문제 해결

### Q: 정렬이 작동하지 않아요
A: `onSortChange`가 있으면 서버 사이드 정렬입니다. 클라이언트 정렬을 원하면 이 prop을 제거하세요.

### Q: 페이지네이션이 이상해요
A: `pagination`이 객체면 제어 모드입니다. `page`, `rowsPerPage`, `totalCount` 모두 제공해야 합니다.

### Q: 행 클릭 시 버튼도 같이 클릭돼요
A: 버튼의 onClick에서 `e.stopPropagation()`을 호출하세요.

### Q: Card가 필요 없어요
A: `card={false}` prop을 추가하세요.

## 예제 모음

더 많은 예제는 `DataTable.example.tsx` 파일을 참고하세요:

- 기본 사용 예제
- 서버 사이드 페이지네이션
- 액션 버튼 포함
- 클라이언트 사이드 페이지네이션
- 빈 데이터 처리
- Card 없는 사용
- 커스텀 행 스타일
- 정렬 비활성화

## 라이선스

이 컴포넌트는 프로젝트 내부용입니다.
