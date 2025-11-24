import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Users,
  Building2,
  Settings,
  Filter,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  UserPlus,
  Layers
} from 'lucide-react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { Badge } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui";
import { Spinner } from "./ui/spinner";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import OrganizationForm from './OrganizationForm';
import {
  ChurchOrganization,
  OrganizationFilter,
  ORGANIZATION_TYPE_LABELS,
  MEMBER_ROLE_LABELS
} from '../types/organization';
import { organizationService } from '../services/organizationService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { supabase } from '../lib/supabase';

interface Department {
  id: string;
  church_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

interface OrganizationTreeNodeProps {
  organization: ChurchOrganization;
  expanded: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
  onSelect: (organization: ChurchOrganization) => void;
  onEdit: (organization: ChurchOrganization) => void;
  onDelete: (organization: ChurchOrganization) => void;
  onAddMember: (organization: ChurchOrganization) => void;
}

const OrganizationTreeNode: React.FC<OrganizationTreeNodeProps> = ({
  organization,
  expanded,
  selected,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
  onAddMember
}) => {
  const hasChildren = organization.children && organization.children.length > 0;

  return (
    <div className="w-full">
      <div
        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
          selected ? 'bg-blue-50 border border-blue-200' : ''
        }`}
        onClick={() => onSelect(organization)}
      >
        <div className="flex items-center space-x-3">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(organization.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <Building2 className="w-5 h-5 text-blue-500" />

          <div>
            <h3 className="font-medium text-gray-900">{organization.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {ORGANIZATION_TYPE_LABELS[organization.organization_type]}
              </Badge>
              <span className="text-xs text-gray-500">
                {organization.member_count}명
              </span>
              {!organization.is_active && (
                <Badge variant="destructive" className="text-xs">
                  비활성
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddMember(organization);
            }}
            className="h-8 w-8 p-0"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(organization);
            }}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(organization);
            }}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="ml-6 mt-2 space-y-1">
          {organization.children?.map((child) => (
            <OrganizationTreeNode
              key={child.id}
              organization={child}
              expanded={expanded}
              selected={selected}
              onToggle={onToggle}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddMember={onAddMember}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const OrganizationManagement: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'organizations' | 'departments'>('organizations');

  // Organization states
  const [organizations, setOrganizations] = useState<ChurchOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganization, setSelectedOrganization] = useState<ChurchOrganization | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [churchId, setChurchId] = useState<number | null>(null);

  // Filter states
  const [filter, setFilter] = useState<OrganizationFilter>({
    search: '',
    organization_type: 'all',
    is_active: 'all',
    parent_id: 'all'
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<ChurchOrganization | null>(null);

  // Department states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showDepartmentCreateModal, setShowDepartmentCreateModal] = useState(false);
  const [showDepartmentEditModal, setShowDepartmentEditModal] = useState(false);
  const [showDepartmentDeleteModal, setShowDepartmentDeleteModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [departmentFormData, setDepartmentFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  // Get current user's church_id
  useEffect(() => {
    const loadChurchId = async () => {
      try {
        const result = await supabaseAuthService.getCurrentUser();
        if (result?.user?.church_id) {
          setChurchId(result.user.church_id);
        }
      } catch (error) {
        console.error('Error loading church_id:', error);
      }
    };
    loadChurchId();
  }, []);

  // Load organizations
  const loadOrganizations = async () => {
    if (!churchId) return;

    try {
      setLoading(true);
      const result = await organizationService.getOrganizations(churchId, filter);

      // members 테이블의 organization_id로 인원수 집계
      const organizationsWithCount = await Promise.all(
        result.organizations.map(async (org) => {
          const { count, error } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .eq('organization_id', org.id);

          if (error) {
            console.error('Error counting members for org', org.id, error);
          }

          console.log(`조직 ${org.name} (${org.id}): member_count = ${count}`);

          return {
            ...org,
            member_count: count || 0
          };
        })
      );

      setOrganizations(organizationsWithCount);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (churchId) {
      loadOrganizations();
      if (activeTab === 'departments') {
        loadDepartments();
      }
    }
  }, [filter, churchId, activeTab]);

  // Load departments
  const loadDepartments = async () => {
    if (!churchId) return;

    try {
      setDepartmentLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('church_id', churchId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('부서 목록 로드 오류:', error);
        alert('부서 목록을 불러오는데 실패했습니다.');
        return;
      }

      // 각 부서별 인원 수 집계
      const departmentsWithCount = await Promise.all(
        (data || []).map(async (dept) => {
          const { count } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .eq('department', dept.name);

          return {
            ...dept,
            member_count: count || 0
          };
        })
      );

      setDepartments(departmentsWithCount);
    } catch (error) {
      console.error('부서 목록 로드 오류:', error);
      alert('부서 목록을 불러오는데 실패했습니다.');
    } finally {
      setDepartmentLoading(false);
    }
  };

  // Department CRUD handlers
  const handleCreateDepartment = async () => {
    if (!churchId) return;
    if (!departmentFormData.name.trim()) {
      alert('부서명을 입력해주세요.');
      return;
    }

    try {
      setDepartmentLoading(true);

      // Get max display_order
      const maxOrder = departments.reduce((max, dept) =>
        Math.max(max, dept.display_order), 0
      );

      const { error } = await supabase
        .from('departments')
        .insert({
          church_id: churchId,
          name: departmentFormData.name.trim(),
          description: departmentFormData.description.trim() || null,
          is_active: departmentFormData.is_active,
          display_order: maxOrder + 1
        });

      if (error) {
        console.error('부서 생성 오류:', error);
        alert('부서 생성에 실패했습니다.');
        return;
      }

      alert('부서가 생성되었습니다.');
      setShowDepartmentCreateModal(false);
      setDepartmentFormData({ name: '', description: '', is_active: true });
      loadDepartments();
    } catch (error) {
      console.error('부서 생성 오류:', error);
      alert('부서 생성에 실패했습니다.');
    } finally {
      setDepartmentLoading(false);
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartment) return;
    if (!departmentFormData.name.trim()) {
      alert('부서명을 입력해주세요.');
      return;
    }

    try {
      setDepartmentLoading(true);

      const { error } = await supabase
        .from('departments')
        .update({
          name: departmentFormData.name.trim(),
          description: departmentFormData.description.trim() || null,
          is_active: departmentFormData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDepartment.id);

      if (error) {
        console.error('부서 수정 오류:', error);
        alert('부서 수정에 실패했습니다.');
        return;
      }

      alert('부서가 수정되었습니다.');
      setShowDepartmentEditModal(false);
      setEditingDepartment(null);
      setDepartmentFormData({ name: '', description: '', is_active: true });
      loadDepartments();
    } catch (error) {
      console.error('부서 수정 오류:', error);
      alert('부서 수정에 실패했습니다.');
    } finally {
      setDepartmentLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!editingDepartment) return;

    try {
      setDepartmentLoading(true);

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', editingDepartment.id);

      if (error) {
        console.error('부서 삭제 오류:', error);
        alert('부서 삭제에 실패했습니다.');
        return;
      }

      alert('부서가 삭제되었습니다.');
      setShowDepartmentDeleteModal(false);
      setEditingDepartment(null);
      setSelectedDepartment(null);
      loadDepartments();
    } catch (error) {
      console.error('부서 삭제 오류:', error);
      alert('부서 삭제에 실패했습니다.');
    } finally {
      setDepartmentLoading(false);
    }
  };

  const openDepartmentCreateModal = () => {
    setDepartmentFormData({ name: '', description: '', is_active: true });
    setShowDepartmentCreateModal(true);
  };

  const openDepartmentEditModal = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentFormData({
      name: department.name,
      description: department.description || '',
      is_active: department.is_active
    });
    setShowDepartmentEditModal(true);
  };

  const openDepartmentDeleteModal = (department: Department) => {
    setEditingDepartment(department);
    setShowDepartmentDeleteModal(true);
  };

  // Tree node handlers
  const handleToggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelectOrganization = (organization: ChurchOrganization) => {
    setSelectedOrganization(organization);
  };

  const handleEditOrganization = (organization: ChurchOrganization) => {
    setEditingOrganization(organization);
    setShowEditModal(true);
  };

  const handleDeleteOrganization = (organization: ChurchOrganization) => {
    setEditingOrganization(organization);
    setShowDeleteModal(true);
  };

  const handleAddMember = (organization: ChurchOrganization) => {
    setSelectedOrganization(organization);
    setShowMemberModal(true);
  };

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setFilter(prev => ({ ...prev, search: value }));
  };

  const handleTypeFilterChange = (value: string) => {
    setFilter(prev => ({
      ...prev,
      organization_type: value as OrganizationFilter['organization_type']
    }));
  };

  const handleStatusFilterChange = (value: string) => {
    setFilter(prev => ({
      ...prev,
      is_active: value === 'all' ? 'all' : value === 'true'
    }));
  };

  const renderOrganizationTree = (orgs: ChurchOrganization[]) => {
    return orgs.map((org) => (
      <OrganizationTreeNode
        key={org.id}
        organization={org}
        expanded={expandedNodes.has(org.id)}
        selected={selectedOrganization?.id === org.id}
        onToggle={handleToggleNode}
        onSelect={handleSelectOrganization}
        onEdit={handleEditOrganization}
        onDelete={handleDeleteOrganization}
        onAddMember={handleAddMember}
      />
    ));
  };

  return (
    <PageContainer>
      <PageHeader
        title="조직 관리"
        description="교회 조직 구조와 교인 배정을 관리합니다"
        actions={
          <Button onClick={() => activeTab === 'organizations' ? setShowCreateModal(true) : openDepartmentCreateModal()}>
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'organizations' ? '조직 추가' : '부서 추가'}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab('organizations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'organizations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="w-5 h-5 inline-block mr-2" />
            조직 관리
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'departments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Layers className="w-5 h-5 inline-block mr-2" />
            부서 관리
          </button>
        </nav>
      </div>


      {/* Organizations Tab Content */}
      {activeTab === 'organizations' && (
        <div>
        {/* Organization List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
            <span className="ml-2">조직 목록을 불러오는 중...</span>
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>등록된 조직이 없습니다.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              첫 번째 조직 추가하기
            </Button>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      조직명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      설명
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      인원 수
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizations.map((organization) => (
                    <tr
                      key={organization.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedOrganization?.id === organization.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedOrganization(organization)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{organization.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{organization.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-700">{organization.member_count}명</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {organization.is_active ? (
                          <Badge variant="secondary" className="text-xs">활성</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">비활성</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOrganization(organization);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrganization(organization);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        </div>
      )}

      {/* Departments Tab Content */}
      {activeTab === 'departments' && (
        <div>
          {/* Department List */}
          {departmentLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
              <span className="ml-2">부서 목록을 불러오는 중...</span>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>등록된 부서가 없습니다.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={openDepartmentCreateModal}
              >
                첫 번째 부서 추가하기
              </Button>
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        부서명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        설명
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                        인원 수
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departments.map((department) => (
                      <tr key={department.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{department.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{department.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-gray-700">{department.member_count || 0}명</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {department.is_active ? (
                            <Badge variant="secondary" className="text-xs">활성</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">비활성</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDepartmentEditModal(department);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDepartmentDeleteModal(department);
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Organization Form Modal */}
      {churchId && (
        <OrganizationForm
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingOrganization(null);
          }}
          onSuccess={() => {
            loadOrganizations();
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingOrganization(null);
          }}
          organization={editingOrganization}
          organizations={organizations}
          churchId={churchId}
        />
      )}

      {/* Department Create Modal */}
      <Dialog open={showDepartmentCreateModal} onOpenChange={setShowDepartmentCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>부서 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dept-name">부서명 *</Label>
              <Input
                id="dept-name"
                placeholder="부서명을 입력하세요"
                value={departmentFormData.name}
                onChange={(e) => setDepartmentFormData({ ...departmentFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dept-description">설명</Label>
              <Textarea
                id="dept-description"
                placeholder="부서 설명을 입력하세요 (선택사항)"
                value={departmentFormData.description}
                onChange={(e) => setDepartmentFormData({ ...departmentFormData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dept-active"
                checked={departmentFormData.is_active}
                onChange={(e) => setDepartmentFormData({ ...departmentFormData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="dept-active">활성 상태</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDepartmentCreateModal(false);
                  setDepartmentFormData({ name: '', description: '', is_active: true });
                }}
              >
                취소
              </Button>
              <Button onClick={handleCreateDepartment} disabled={departmentLoading}>
                {departmentLoading ? <Spinner /> : '추가'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Edit Modal */}
      <Dialog open={showDepartmentEditModal} onOpenChange={setShowDepartmentEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>부서 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-dept-name">부서명 *</Label>
              <Input
                id="edit-dept-name"
                placeholder="부서명을 입력하세요"
                value={departmentFormData.name}
                onChange={(e) => setDepartmentFormData({ ...departmentFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-dept-description">설명</Label>
              <Textarea
                id="edit-dept-description"
                placeholder="부서 설명을 입력하세요 (선택사항)"
                value={departmentFormData.description}
                onChange={(e) => setDepartmentFormData({ ...departmentFormData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-dept-active"
                checked={departmentFormData.is_active}
                onChange={(e) => setDepartmentFormData({ ...departmentFormData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="edit-dept-active">활성 상태</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDepartmentEditModal(false);
                  setEditingDepartment(null);
                  setDepartmentFormData({ name: '', description: '', is_active: true });
                }}
              >
                취소
              </Button>
              <Button onClick={handleUpdateDepartment} disabled={departmentLoading}>
                {departmentLoading ? <Spinner /> : '수정'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Delete Modal */}
      <Dialog open={showDepartmentDeleteModal} onOpenChange={setShowDepartmentDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>부서 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              정말로 <strong>{editingDepartment?.name}</strong> 부서를 삭제하시겠습니까?
            </p>
            <p className="text-sm text-red-600">
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDepartmentDeleteModal(false);
                  setEditingDepartment(null);
                }}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteDepartment}
                disabled={departmentLoading}
              >
                {departmentLoading ? <Spinner /> : '삭제'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default OrganizationManagement;