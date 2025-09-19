import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Member {
  id: number;
  name: string;
  phone: string;
  position: string;
  department: string;
  status: string;
}

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');

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
              {positions.map(pos => (
                <SelectItem key={pos.value} value={pos.value}>{pos.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddMember}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            교인 추가
          </Button>
        </div>
      </div>

      {/* Members Table */}
      <Card className="border-muted">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-muted">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    전화번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    직분
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    부서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-muted">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      등록된 교인이 없습니다.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {member.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {member.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {member.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="success">
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>교인 추가</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div>
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                type="tel"
                required
              />
            </div>
            <div>
              <Label htmlFor="position">직분</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="직분 선택" />
                </SelectTrigger>
                <SelectContent>
                  {positions.slice(1).map(pos => (
                    <SelectItem key={pos.value} value={pos.value}>{pos.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                취소
              </Button>
              <Button type="submit">
                저장
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;