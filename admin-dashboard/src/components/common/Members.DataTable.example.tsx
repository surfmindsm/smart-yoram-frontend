import React, { useState } from 'react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from '../ui';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import DataTable, { Column } from './DataTable';
import { cn } from '../../lib/utils';

interface Member {
  id: number;
  name: string;
  phone: string;
  position: string;
  department: string;
  status: string;
}

/**
 * 기존 Members.tsx를 DataTable로 변환한 예제
 *
 * 변경 사항:
 * 1. Table, TableHeader, TableBody 등을 직접 작성하던 부분 → DataTable 컴포넌트로 대체
 * 2. 컬럼 정의를 Column<Member>[] 배열로 선언
 * 3. 로딩/빈 상태 자동 처리
 * 4. Card 래퍼 자동 적용
 */
const MembersWithDataTable: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [loading, setLoading] = useState(false);

  const positions = [
    { value: 'all', label: '전체' },
    { value: 'pastor', label: '목사' },
    { value: 'elder', label: '장로' },
    { value: 'deacon', label: '집사' },
    { value: 'member', label: '성도' },
    { value: 'youth', label: '청년' },
  ];

  const handleAddMember = () => {
    setShowAddModal(true);
  };

  const handleEdit = (member: Member) => {
    console.log('수정:', member);
  };

  const handleDelete = (member: Member) => {
    if (window.confirm(`${member.name}을(를) 삭제하시겠습니까?`)) {
      console.log('삭제:', member);
    }
  };

  // 검색 및 필터링
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);
    const matchesPosition =
      selectedPosition === 'all' || member.position === selectedPosition;
    return matchesSearch && matchesPosition;
  });

  // ✅ 컬럼 정의 - 기존 TableHead들을 Column 배열로 변환
  const columns: Column<Member>[] = [
    {
      id: 'name',
      label: '이름',
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      id: 'phone',
      label: '전화번호',
      className: 'text-muted-foreground',
    },
    {
      id: 'position',
      label: '직분',
      className: 'text-muted-foreground',
    },
    {
      id: 'department',
      label: '부서',
      className: 'text-muted-foreground',
    },
    {
      id: 'status',
      label: '상태',
      width: 'w-[100px]',
      render: (row) => <Badge variant="success">{row.status}</Badge>,
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
              e.stopPropagation();
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
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">교인 관리</h2>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="이름, 전화번호로 검색"
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedPosition} onValueChange={setSelectedPosition}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {positions.map((pos) => (
                <SelectItem key={pos.value} value={pos.value}>
                  {pos.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddMember} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            교인 추가
          </Button>
        </div>
      </div>

      {/* ✅ 기존: 직접 Table 작성 → DataTable 컴포넌트 사용 */}
      <DataTable
        columns={columns}
        data={filteredMembers}
        loading={loading}
        rowKey="id"
        emptyMessage="등록된 교인이 없습니다."
        card={true}
        // onRowClick={(member) => console.log('클릭:', member)} // 선택사항
      />
    </div>
  );
};

export default MembersWithDataTable;

/**
 * 코드 비교
 *
 * ============================================
 * BEFORE (기존 코드 - Members.tsx)
 * ============================================
 *
 * <Card>
 *   <CardContent className="p-0">
 *     <div className="rounded-md border">
 *       <Table>
 *         <TableHeader>
 *           <TableRow>
 *             <TableHead>이름</TableHead>
 *             <TableHead>전화번호</TableHead>
 *             <TableHead>직분</TableHead>
 *             <TableHead>부서</TableHead>
 *             <TableHead className="w-[100px]">상태</TableHead>
 *             <TableHead className="w-[120px] text-center">작업</TableHead>
 *           </TableRow>
 *         </TableHeader>
 *         <TableBody>
 *           {members.length === 0 ? (
 *             <TableRow>
 *               <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
 *                 등록된 교인이 없습니다.
 *               </TableCell>
 *             </TableRow>
 *           ) : (
 *             members.map((member) => (
 *               <TableRow key={member.id}>
 *                 <TableCell className="font-medium">{member.name}</TableCell>
 *                 <TableCell className="text-muted-foreground">{member.phone}</TableCell>
 *                 <TableCell className="text-muted-foreground">{member.position}</TableCell>
 *                 <TableCell className="text-muted-foreground">{member.department}</TableCell>
 *                 <TableCell>
 *                   <Badge variant="success">{member.status}</Badge>
 *                 </TableCell>
 *                 <TableCell>
 *                   <div className="flex items-center justify-center gap-2">
 *                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
 *                       <Edit2 className="h-4 w-4" />
 *                     </Button>
 *                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
 *                       <Trash2 className="h-4 w-4" />
 *                     </Button>
 *                   </div>
 *                 </TableCell>
 *               </TableRow>
 *             ))
 *           )}
 *         </TableBody>
 *       </Table>
 *     </div>
 *   </CardContent>
 * </Card>
 *
 * ============================================
 * AFTER (DataTable 사용)
 * ============================================
 *
 * const columns: Column<Member>[] = [
 *   { id: 'name', label: '이름', render: (row) => <span className="font-medium">{row.name}</span> },
 *   { id: 'phone', label: '전화번호', className: 'text-muted-foreground' },
 *   { id: 'position', label: '직분', className: 'text-muted-foreground' },
 *   { id: 'department', label: '부서', className: 'text-muted-foreground' },
 *   { id: 'status', label: '상태', width: 'w-[100px]', render: (row) => <Badge variant="success">{row.status}</Badge> },
 *   { id: 'actions', label: '작업', width: 'w-[120px]', align: 'center', sortable: false, render: ... },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={members}
 *   rowKey="id"
 *   emptyMessage="등록된 교인이 없습니다."
 * />
 *
 * ============================================
 * 장점
 * ============================================
 *
 * 1. 코드 라인 수 대폭 감소 (80+ 줄 → 30 줄)
 * 2. 로딩/빈 상태 자동 처리
 * 3. 정렬 기능 자동 제공
 * 4. 페이지네이션 쉽게 추가 가능
 * 5. 일관된 스타일과 동작
 * 6. 유지보수 용이
 */
