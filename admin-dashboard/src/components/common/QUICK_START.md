# DataTable 빠른 시작 가이드

## 1분 만에 시작하기

### 1. Import

```typescript
import DataTable, { Column } from '@/components/common/DataTable';
```

### 2. 컬럼 정의

```typescript
interface Member {
  id: number;
  name: string;
  phone: string;
}

const columns: Column<Member>[] = [
  { id: 'id', label: 'ID', width: 'w-[80px]' },
  { id: 'name', label: '이름' },
  { id: 'phone', label: '전화번호' },
];
```

### 3. 사용

```typescript
<DataTable
  columns={columns}
  data={members}
  rowKey="id"
  cardTitle="교인 목록"
/>
```

## 자주 사용하는 패턴

### Badge 사용

```typescript
import { Badge } from '@/components/ui';

{
  id: 'status',
  label: '상태',
  render: (row) => (
    <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
      {row.status === 'active' ? '활성' : '비활성'}
    </Badge>
  ),
}
```

### 액션 버튼

```typescript
import { Button } from '@/components/ui';
import { Edit2, Trash2 } from 'lucide-react';

{
  id: 'actions',
  label: '작업',
  width: 'w-[120px]',
  align: 'center',
  sortable: false,
  render: (row) => (
    <div className="flex gap-2 justify-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation(); // 중요!
          handleEdit(row);
        }}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  ),
}
```

### 날짜 포맷팅

```typescript
{
  id: 'createdAt',
  label: '등록일',
  format: (value: string) => new Date(value).toLocaleDateString('ko-KR'),
}
```

### 로딩 상태

```typescript
const [loading, setLoading] = useState(false);

<DataTable
  columns={columns}
  data={data}
  loading={loading}
  rowKey="id"
/>
```

### 페이지네이션

```typescript
// 클라이언트 사이드
<DataTable
  columns={columns}
  data={allData}
  rowKey="id"
  pagination={true}
/>

// 서버 사이드
<DataTable
  columns={columns}
  data={currentPageData}
  rowKey="id"
  pagination={{ page, rowsPerPage, totalCount }}
  onPageChange={setPage}
  onRowsPerPageChange={setRowsPerPage}
/>
```

## 더 알아보기

- [DataTable.README.md](./DataTable.README.md) - 전체 API 문서
- [DataTable.example.tsx](./DataTable.example.tsx) - 8가지 예제
- [Members.DataTable.example.tsx](./Members.DataTable.example.tsx) - 실제 마이그레이션 예제
- [DATATABLE_GUIDE.md](../../DATATABLE_GUIDE.md) - 통합 가이드
