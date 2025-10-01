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
  UserPlus
} from 'lucide-react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { Badge } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui";
import { Spinner } from "./ui/spinner";
import OrganizationForm from './OrganizationForm';
import {
  ChurchOrganization,
  OrganizationFilter,
  ORGANIZATION_TYPE_LABELS,
  MEMBER_ROLE_LABELS
} from '../types/organization';
import { organizationService } from '../services/organizationService';
import { supabaseAuthService } from '../services/supabaseAuthService';

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
      setOrganizations(result.organizations);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (churchId) {
      loadOrganizations();
    }
  }, [filter, churchId]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">조직 관리</h1>
          <p className="text-gray-600 mt-1">교회 조직 구조와 교인 배정을 관리합니다</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          조직 추가
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="조직명 검색..."
                  value={filter.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filter.organization_type} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="조직 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="district">구역</SelectItem>
                <SelectItem value="sub_district">소구역</SelectItem>
                <SelectItem value="cell_group">셀그룹</SelectItem>
                <SelectItem value="ministry_team">사역팀</SelectItem>
                <SelectItem value="custom">사용자정의</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.is_active === 'all' ? 'all' : filter.is_active ? 'true' : 'false'}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="true">활성</SelectItem>
                <SelectItem value="false">비활성</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              필터 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Tree */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                조직 구조
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                <div className="space-y-2">
                  {renderOrganizationTree(organizations)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Organization Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                조직 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedOrganization ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedOrganization.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {ORGANIZATION_TYPE_LABELS[selectedOrganization.organization_type]}
                    </p>
                  </div>

                  {selectedOrganization.description && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">설명</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedOrganization.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">소속 인원</span>
                      <p className="font-medium">{selectedOrganization.member_count}명</p>
                    </div>
                    <div>
                      <span className="text-gray-500">계층 레벨</span>
                      <p className="font-medium">Level {selectedOrganization.level}</p>
                    </div>
                  </div>

                  {selectedOrganization.contact_phone && (
                    <div>
                      <span className="text-gray-500 text-sm">연락처</span>
                      <p className="font-medium">{selectedOrganization.contact_phone}</p>
                    </div>
                  )}

                  {selectedOrganization.meeting_location && (
                    <div>
                      <span className="text-gray-500 text-sm">모임 장소</span>
                      <p className="font-medium">{selectedOrganization.meeting_location}</p>
                    </div>
                  )}

                  <div className="pt-4 space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => handleAddMember(selectedOrganization)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      교인 배정
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleEditOrganization(selectedOrganization)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      조직 설정
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>조직을 선택해주세요</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
};

export default OrganizationManagement;