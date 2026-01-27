import React, { useState } from 'react';
import DataTable, { Column, SortOrder } from './DataTable';
import { Badge, Button } from '../ui';
import { Edit2, Trash2, Heart } from 'lucide-react';

// 예제 데이터 타입
interface Member {
  id: number;
  name: string;
  phone: string;
  position: string;
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// 샘플 데이터
const sampleMembers: Member[] = [
  {
    id: 1,
    name: '홍길동',
    phone: '010-1234-5678',
    position: '장로',
    department: '청년부',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    name: '김영희',
    phone: '010-2345-6789',
    position: '집사',
    department: '주일학교',
    status: 'active',
    createdAt: '2024-01-16',
  },
  {
    id: 3,
    name: '이철수',
    phone: '010-3456-7890',
    position: '성도',
    department: '찬양팀',
    status: 'inactive',
    createdAt: '2024-01-17',
  },
];

// ===========================================
// 1. 기본 사용 예제
// ===========================================
export function BasicExample() {
  const columns: Column<Member>[] = [
    { id: 'id', label: 'ID', width: 'w-[80px]', align: 'center' },
    { id: 'name', label: '이름', width: 'w-[120px]' },
    { id: 'phone', label: '전화번호', width: 'w-[140px]' },
    { id: 'position', label: '직분', width: 'w-[100px]' },
    { id: 'department', label: '부서', width: 'w-[120px]' },
    {
      id: 'status',
      label: '상태',
      width: 'w-[100px]',
      align: 'center',
      format: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'secondary'}>
          {value === 'active' ? '활성' : '비활성'}
        </Badge>
      ),
    },
    {
      id: 'createdAt',
      label: '등록일',
      width: 'w-[120px]',
      format: (value: string) => new Date(value).toLocaleDateString('ko-KR'),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sampleMembers}
      rowKey="id"
      cardTitle="교인 목록"
      cardDescription="전체 교인 목록입니다"
      onRowClick={(row) => console.log('클릭:', row)}
    />
  );
}

// ===========================================
// 2. 서버 사이드 페이지네이션 예제
// ===========================================
export function ServerSideExample() {
  const [data, setData] = useState<Member[]>(sampleMembers);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(100);
  const [loading, setLoading] = useState(false);

  // API 호출 시뮬레이션
  const fetchData = async (page: number, rowsPerPage: number, sortBy?: string, order?: SortOrder) => {
    setLoading(true);
    // 실제로는 여기서 API 호출
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage, rowsPerPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchData(0, newRowsPerPage);
  };

  const handleSortChange = (sortBy: string, order: SortOrder) => {
    fetchData(page, rowsPerPage, sortBy, order);
  };

  const columns: Column<Member>[] = [
    { id: 'id', label: 'ID', width: 'w-[80px]', align: 'center' },
    { id: 'name', label: '이름' },
    { id: 'phone', label: '전화번호' },
    { id: 'position', label: '직분' },
    { id: 'department', label: '부서' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      rowKey="id"
      pagination={{ page, rowsPerPage, totalCount }}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      onSortChange={handleSortChange}
      cardTitle="서버 사이드 페이지네이션 예제"
    />
  );
}

// ===========================================
// 3. 액션 버튼 포함 예제
// ===========================================
export function ActionsExample() {
  const handleEdit = (member: Member) => {
    console.log('수정:', member);
  };

  const handleDelete = (member: Member) => {
    if (window.confirm(`${member.name}을(를) 삭제하시겠습니까?`)) {
      console.log('삭제:', member);
    }
  };

  const columns: Column<Member>[] = [
    { id: 'name', label: '이름' },
    { id: 'phone', label: '전화번호' },
    { id: 'position', label: '직분' },
    {
      id: 'status',
      label: '상태',
      align: 'center',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
          {row.status === 'active' ? '활성' : '비활성'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      label: '작업',
      width: 'w-[120px]',
      align: 'center',
      sortable: false,
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation(); // 행 클릭 이벤트 방지
              handleEdit(row);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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

  return (
    <DataTable
      columns={columns}
      data={sampleMembers}
      rowKey="id"
      cardTitle="액션 버튼 예제"
      onRowClick={(row) => console.log('행 클릭:', row)}
    />
  );
}

// ===========================================
// 4. 클라이언트 사이드 페이지네이션 예제
// ===========================================
export function ClientSideExample() {
  const columns: Column<Member>[] = [
    { id: 'id', label: 'ID', width: 'w-[80px]' },
    { id: 'name', label: '이름' },
    { id: 'phone', label: '전화번호' },
    { id: 'position', label: '직분' },
  ];

  return (
    <DataTable
      columns={columns}
      data={sampleMembers}
      rowKey="id"
      pagination={true} // boolean만 전달하면 클라이언트 사이드
      cardTitle="클라이언트 사이드 페이지네이션"
    />
  );
}

// ===========================================
// 5. 빈 데이터 예제
// ===========================================
export function EmptyStateExample() {
  const columns: Column<Member>[] = [
    { id: 'name', label: '이름' },
    { id: 'phone', label: '전화번호' },
  ];

  return (
    <DataTable
      columns={columns}
      data={[]}
      rowKey="id"
      emptyIcon={<Heart className="h-12 w-12 text-muted-foreground" />}
      emptyMessage="등록된 교인이 없습니다."
      cardTitle="빈 데이터 예제"
    />
  );
}

// ===========================================
// 6. Card 없는 예제
// ===========================================
export function NoCardExample() {
  const columns: Column<Member>[] = [
    { id: 'name', label: '이름' },
    { id: 'phone', label: '전화번호' },
    { id: 'position', label: '직분' },
  ];

  return (
    <DataTable
      columns={columns}
      data={sampleMembers}
      rowKey="id"
      card={false} // Card 래퍼 제거
    />
  );
}

// ===========================================
// 7. 커스텀 행 스타일 예제
// ===========================================
export function CustomRowStyleExample() {
  const columns: Column<Member>[] = [
    { id: 'name', label: '이름' },
    { id: 'phone', label: '전화번호' },
    { id: 'status', label: '상태' },
  ];

  return (
    <DataTable
      columns={columns}
      data={sampleMembers}
      rowKey="id"
      rowClassName={(row) =>
        row.status === 'inactive' ? 'bg-gray-100 opacity-60' : ''
      }
      cardTitle="커스텀 행 스타일 예제"
    />
  );
}

// ===========================================
// 8. 정렬 비활성화 예제
// ===========================================
export function NoSortExample() {
  const columns: Column<Member>[] = [
    { id: 'name', label: '이름' },
    { id: 'phone', label: '전화번호' },
    { id: 'position', label: '직분' },
  ];

  return (
    <DataTable
      columns={columns}
      data={sampleMembers}
      rowKey="id"
      sortable={false} // 정렬 비활성화
      cardTitle="정렬 비활성화 예제"
    />
  );
}
