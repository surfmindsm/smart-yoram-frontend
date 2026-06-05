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
  Layers,
  Info
} from 'lucide-react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Card, CardContent, CardHeader, CardTitle, LoadingState } from "./ui";
import { Badge } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Spinner } from "./ui/spinner";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { PageContainer } from "./ui";
import { usePageSubtitle, usePageActions } from '../hooks/usePageSubtitle';
import { cn } from '../lib/utils';
import OrganizationForm from './OrganizationForm';
import {
  ChurchOrganization,
  OrganizationFilter
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
  expandedNodes: Set<string>;
  selectedOrganization: ChurchOrganization | null;
  onToggle: (id: string) => void;
  onSelect: (organization: ChurchOrganization) => void;
  onEdit: (organization: ChurchOrganization) => void;
  onDelete: (organization: ChurchOrganization) => void;
  onAddMember: (organization: ChurchOrganization) => void;
}

interface OrganizationTreeNodeInnerProps extends OrganizationTreeNodeProps {
  depth?: number;
}

const OrganizationTreeNode: React.FC<OrganizationTreeNodeInnerProps> = ({
  organization,
  expanded,
  selected,
  expandedNodes,
  selectedOrganization,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
  onAddMember,
  depth = 0,
}) => {
  const hasChildren = organization.children && organization.children.length > 0;
  const isRoot = depth === 0;

  return (
    <>
      <div
        className={cn(
          'flex cursor-pointer items-center gap-3 border-b border-[#F1F4F9] px-5 py-[13px] transition-colors hover:bg-[#FAFBFD]',
          selected && 'bg-accent/40'
        )}
        style={{ paddingLeft: `${20 + depth * 28}px` }}
        onClick={() => {
          onSelect(organization);
          if (hasChildren) onToggle(organization.id);
        }}
      >
        {/* 펼침 토글 */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(organization.id); }}
            className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded text-[#94A3B8] hover:bg-[#E3E8F0] hover:text-foreground"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className="h-[18px] w-[18px] flex-shrink-0" />
        )}

        {/* 아이콘 칩 — 부모는 primary, 자식은 회색 */}
        <div
          className={cn(
            'flex flex-shrink-0 items-center justify-center rounded-[9px]',
            isRoot
              ? 'h-[34px] w-[34px] bg-[#EEF3FC] text-primary'
              : 'h-[30px] w-[30px] bg-[#F1F4F9] text-[#64748B]'
          )}
        >
          <Users className={isRoot ? 'h-[17px] w-[17px]' : 'h-[15px] w-[15px]'} />
        </div>

        {/* 이름 */}
        <span className={cn('font-bold text-foreground', isRoot ? 'text-[14px]' : 'text-[13px] font-semibold')}>
          {organization.name}
        </span>

        {/* 비활성 칩 */}
        {!organization.is_active && (
          <span className="inline-flex items-center rounded-full bg-[#F1F4F9] px-[8px] py-[2px] text-[10px] font-bold text-[#94A3B8]">
            비활성
          </span>
        )}

        {/* 우측 메타: 리더 / 인원수 / 액션 */}
        <div className="ml-auto flex items-center gap-[14px]">
          {(organization as any).leader_name && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] text-[#64748B]">
              <UserPlus className="h-3.5 w-3.5 text-[#94A3B8]" />
              {(organization as any).leader_name}
            </span>
          )}
          <span className="whitespace-nowrap text-[12.5px] font-bold text-foreground tabular-nums">
            {organization.member_count}
            <small className="ml-px text-[11px] font-medium text-[#94A3B8]">명</small>
          </span>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddMember(organization)}
              className="h-[30px] w-[30px] p-0 text-[#64748B] hover:bg-secondary hover:text-foreground"
              title="교인 배정"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(organization)}
              className="h-[30px] w-[30px] p-0 text-primary hover:bg-accent"
              title="수정"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(organization)}
              className="h-[30px] w-[30px] p-0 text-[#DC2626] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
              title="삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && expanded && organization.children?.map((child) => (
        <OrganizationTreeNode
          key={child.id}
          organization={child}
          expanded={expandedNodes.has(child.id)}
          selected={selectedOrganization?.id === child.id}
          expandedNodes={expandedNodes}
          selectedOrganization={selectedOrganization}
          onToggle={onToggle}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddMember={onAddMember}
          depth={depth + 1}
        />
      ))}
    </>
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

  // Member selection states (for organizations)
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Department member selection states
  const [showDepartmentMemberModal, setShowDepartmentMemberModal] = useState(false);
  const [availableDepartmentMembers, setAvailableDepartmentMembers] = useState<any[]>([]);
  const [selectedDepartmentMemberIds, setSelectedDepartmentMemberIds] = useState<Set<string>>(new Set());
  const [departmentMemberLoading, setDepartmentMemberLoading] = useState(false);
  const [departmentMemberSearchTerm, setDepartmentMemberSearchTerm] = useState('');

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

      // Flatten all organizations (including children) to count members
      const flattenOrgs = (orgs: ChurchOrganization[]): ChurchOrganization[] => {
        const flat: ChurchOrganization[] = [];
        const flatten = (org: ChurchOrganization) => {
          flat.push(org);
          if (org.children && org.children.length > 0) {
            org.children.forEach(child => flatten(child));
          }
        };
        orgs.forEach(org => flatten(org));
        return flat;
      };

      const allOrgs = flattenOrgs(result.organizations);

      // Count members for each organization
      const countMap = new Map<string, number>();
      await Promise.all(
        allOrgs.map(async (org) => {
          const { count, error } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', churchId)
            .eq('organization_id', org.id);

          if (error) {
            console.error('Error counting members for org', org.id, error);
          }

          countMap.set(org.id, count || 0);
        })
      );

      // Apply counts to tree structure recursively and sum up children counts
      const applyCount = (org: ChurchOrganization): ChurchOrganization => {
        // First apply count to all children
        const childrenWithCount = org.children ? org.children.map(child => applyCount(child)) : [];

        // Get direct member count for this organization
        const directCount = countMap.get(org.id) || 0;

        // Calculate total count including all descendants
        const childrenTotal = childrenWithCount.reduce((sum, child) => sum + (child.member_count || 0), 0);
        const totalCount = directCount + childrenTotal;

        return {
          ...org,
          member_count: totalCount,
          children: childrenWithCount
        };
      };

      const organizationsWithCount = result.organizations.map(org => applyCount(org));

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

  // Department member management handlers
  const handleAddMemberToDepartment = async (department: Department) => {
    setSelectedDepartment(department);
    setShowDepartmentMemberModal(true);

    // Load available members for department
    await loadAvailableDepartmentMembers(department.name);
  };

  // Load members that can be added to the department
  const loadAvailableDepartmentMembers = async (departmentName: string) => {
    if (!churchId) return;

    try {
      setDepartmentMemberLoading(true);

      // Get all members with their current department
      const { data: allMembers, error: membersError } = await supabase
        .from('members')
        .select('id, name, birthdate, phone, address, department')
        .eq('church_id', churchId)
        .order('name');

      if (membersError) {
        console.error('교인 목록 로드 오류:', membersError);
        return;
      }

      // Map members with their current department info
      const available = (allMembers || []).map(member => ({
        ...member,
        currentDepartment: member.department,
        isCurrentDepartment: member.department === departmentName
      }));

      setAvailableDepartmentMembers(available);
    } catch (error) {
      console.error('교인 목록 로드 오류:', error);
    } finally {
      setDepartmentMemberLoading(false);
    }
  };

  // Add selected members to department
  const handleAddMembersToDepartment = async () => {
    if (!selectedDepartment || selectedDepartmentMemberIds.size === 0) return;

    try {
      setDepartmentMemberLoading(true);

      // Calculate counts
      const selectedMembers = availableDepartmentMembers.filter(m => selectedDepartmentMemberIds.has(m.id));
      const moveCount = selectedMembers.filter(m => m.currentDepartment && !m.isCurrentDepartment).length;
      const addCount = selectedMembers.filter(m => !m.currentDepartment).length;

      // Update department for selected members
      const { error } = await supabase
        .from('members')
        .update({ department: selectedDepartment.name })
        .in('id', Array.from(selectedDepartmentMemberIds));

      if (error) {
        console.error('교인 추가 오류:', error);
        alert('교인 추가에 실패했습니다.');
        return;
      }

      // Show success message
      let message = '';
      if (moveCount > 0 && addCount > 0) {
        message = `${addCount}명이 추가되고 ${moveCount}명이 이동되었습니다.`;
      } else if (moveCount > 0) {
        message = `${moveCount}명이 이동되었습니다.`;
      } else {
        message = `${addCount}명이 추가되었습니다.`;
      }

      alert(message);
      setShowDepartmentMemberModal(false);
      setSelectedDepartmentMemberIds(new Set());
      setDepartmentMemberSearchTerm('');
      loadDepartments();
    } catch (error) {
      console.error('교인 추가 오류:', error);
      alert('교인 추가에 실패했습니다.');
    } finally {
      setDepartmentMemberLoading(false);
    }
  };

  // Toggle department member selection
  const handleToggleDepartmentMember = (memberId: string) => {
    const newSelection = new Set(selectedDepartmentMemberIds);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedDepartmentMemberIds(newSelection);
  };

  // Toggle all department members
  const handleToggleAllDepartmentMembers = () => {
    const filteredMembers = getFilteredDepartmentMembers();
    const allSelected = filteredMembers.every(m =>
      m.isCurrentDepartment || selectedDepartmentMemberIds.has(m.id)
    );

    if (allSelected) {
      // Deselect all filtered members
      const newSelection = new Set(selectedDepartmentMemberIds);
      filteredMembers.forEach(m => {
        if (!m.isCurrentDepartment) {
          newSelection.delete(m.id);
        }
      });
      setSelectedDepartmentMemberIds(newSelection);
    } else {
      // Select all available filtered members
      const newSelection = new Set(selectedDepartmentMemberIds);
      filteredMembers.forEach(m => {
        if (!m.isCurrentDepartment) {
          newSelection.add(m.id);
        }
      });
      setSelectedDepartmentMemberIds(newSelection);
    }
  };

  // Filter department members by search term
  const getFilteredDepartmentMembers = () => {
    if (!departmentMemberSearchTerm.trim()) {
      return availableDepartmentMembers;
    }

    const searchLower = departmentMemberSearchTerm.toLowerCase();
    return availableDepartmentMembers.filter(member =>
      member.name.toLowerCase().includes(searchLower) ||
      member.phone?.toLowerCase().includes(searchLower) ||
      member.address?.toLowerCase().includes(searchLower)
    );
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

  const handleAddMember = async (organization: ChurchOrganization) => {
    setSelectedOrganization(organization);
    setShowMemberModal(true);

    // Load available members
    await loadAvailableMembers(organization.id);
  };

  // Load members that can be added to the organization
  const loadAvailableMembers = async (organizationId: string) => {
    if (!churchId) return;

    try {
      setMemberLoading(true);

      // Get all members with their current organization
      const { data: allMembers, error: membersError } = await supabase
        .from('members')
        .select('id, name, birthdate, phone, address, organization_id')
        .eq('church_id', churchId)
        .order('name');

      if (membersError) {
        console.error('교인 목록 로드 오류:', membersError);
        return;
      }

      // Get organization names for members who already have one
      const membersWithOrgIds = (allMembers || []).filter(m => m.organization_id);
      const orgIds = Array.from(new Set(membersWithOrgIds.map(m => m.organization_id)));

      let orgMap = new Map<string, string>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('church_organizations')
          .select('id, name')
          .in('id', orgIds);

        if (orgs) {
          orgs.forEach(org => orgMap.set(org.id, org.name));
        }
      }

      // Map members with their current organization info
      const available = (allMembers || []).map(member => ({
        ...member,
        currentOrganizationId: member.organization_id,
        currentOrganizationName: member.organization_id ? orgMap.get(member.organization_id) : null,
        isCurrentOrganization: member.organization_id === organizationId
      }));

      setAvailableMembers(available);
    } catch (error) {
      console.error('교인 목록 로드 오류:', error);
    } finally {
      setMemberLoading(false);
    }
  };

  // Add selected members to organization
  const handleAddMembersToOrganization = async () => {
    if (!selectedOrganization || selectedMemberIds.size === 0) return;

    try {
      setMemberLoading(true);

      // Calculate counts
      const selectedMembers = availableMembers.filter(m => selectedMemberIds.has(m.id));
      const moveCount = selectedMembers.filter(m => m.currentOrganizationId && !m.isCurrentOrganization).length;
      const addCount = selectedMembers.filter(m => !m.currentOrganizationId).length;

      // Update organization_id for selected members
      const { error } = await supabase
        .from('members')
        .update({ organization_id: selectedOrganization.id })
        .in('id', Array.from(selectedMemberIds));

      if (error) {
        console.error('교인 추가 오류:', error);
        alert('교인 추가에 실패했습니다.');
        return;
      }

      // Show success message
      let message = '';
      if (moveCount > 0 && addCount > 0) {
        message = `${addCount}명이 추가되고 ${moveCount}명이 이동되었습니다.`;
      } else if (moveCount > 0) {
        message = `${moveCount}명이 이동되었습니다.`;
      } else {
        message = `${addCount}명이 추가되었습니다.`;
      }

      alert(message);
      setShowMemberModal(false);
      setSelectedMemberIds(new Set());
      setMemberSearchTerm('');
      loadOrganizations();
    } catch (error) {
      console.error('교인 추가 오류:', error);
      alert('교인 추가에 실패했습니다.');
    } finally {
      setMemberLoading(false);
    }
  };

  // Toggle member selection
  const handleToggleMember = (memberId: string) => {
    const newSelection = new Set(selectedMemberIds);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedMemberIds(newSelection);
  };

  // Toggle all members
  const handleToggleAllMembers = () => {
    const filteredMembers = getFilteredMembers();
    const allSelected = filteredMembers.every(m =>
      m.isCurrentOrganization || selectedMemberIds.has(m.id)
    );

    if (allSelected) {
      // Deselect all filtered members
      const newSelection = new Set(selectedMemberIds);
      filteredMembers.forEach(m => {
        if (!m.isCurrentOrganization) {
          newSelection.delete(m.id);
        }
      });
      setSelectedMemberIds(newSelection);
    } else {
      // Select all available filtered members
      const newSelection = new Set(selectedMemberIds);
      filteredMembers.forEach(m => {
        if (!m.isCurrentOrganization) {
          newSelection.add(m.id);
        }
      });
      setSelectedMemberIds(newSelection);
    }
  };

  // Filter members by search term
  const getFilteredMembers = () => {
    if (!memberSearchTerm.trim()) {
      return availableMembers;
    }

    const searchLower = memberSearchTerm.toLowerCase();
    return availableMembers.filter(member =>
      member.name.toLowerCase().includes(searchLower) ||
      member.phone?.toLowerCase().includes(searchLower) ||
      member.address?.toLowerCase().includes(searchLower)
    );
  };

  const handleConfirmDeleteOrganization = async () => {
    if (!editingOrganization) return;

    try {
      setLoading(true);
      await organizationService.deleteOrganization(editingOrganization.id);

      alert('조직이 삭제되었습니다.');
      setShowDeleteModal(false);
      setEditingOrganization(null);
      setSelectedOrganization(null);
      loadOrganizations();
    } catch (error: any) {
      console.error('조직 삭제 오류:', error);
      alert(error.message || '조직 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
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
        expandedNodes={expandedNodes}
        selectedOrganization={selectedOrganization}
        onToggle={handleToggleNode}
        onSelect={handleSelectOrganization}
        onEdit={handleEditOrganization}
        onDelete={handleDeleteOrganization}
        onAddMember={handleAddMember}
      />
    ));
  };

  // 탑바 부제
  usePageSubtitle('교회 조직 구조와 교인 배정을 관리합니다');

  // 탑바 우측 액션 — 조직/부서 세그먼트 + 추가 버튼
  usePageActions(
    <>
      <div className="inline-flex items-center gap-[2px] rounded-[8px] bg-secondary p-[3px]">
        <button
          type="button"
          onClick={() => setActiveTab('organizations')}
          className={cn(
            'rounded-[6px] px-3 py-[5px] text-[12px] font-semibold transition-colors whitespace-nowrap',
            activeTab === 'organizations'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          조직
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={cn(
            'rounded-[6px] px-3 py-[5px] text-[12px] font-semibold transition-colors whitespace-nowrap',
            activeTab === 'departments'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          부서
        </button>
      </div>
      <Button
        onClick={() => activeTab === 'organizations' ? setShowCreateModal(true) : openDepartmentCreateModal()}
        size="sm"
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        {activeTab === 'organizations' ? '조직 추가' : '부서 추가'}
      </Button>
    </>,
    [activeTab]
  );

  return (
    <PageContainer>
      {/* Organizations Tab Content */}
      {activeTab === 'organizations' && (
        <div>
        {/* Organization List */}
        {loading ? (
          <Card>
            <LoadingState text="조직 목록을 불러오는 중..." />
          </Card>
        ) : organizations.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-[#CBD5E1]" />
              <p className="mb-4 text-[13px] text-muted-foreground">등록된 조직이 없습니다.</p>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(true)}
              >
                첫 번째 조직 추가하기
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                {renderOrganizationTree(organizations)}
              </div>
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
            <Card>
              <LoadingState text="부서 목록을 불러오는 중..." />
            </Card>
          ) : departments.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <Layers className="mx-auto mb-4 h-12 w-12 text-[#CBD5E1]" />
                <p className="mb-4 text-[13px] text-muted-foreground">등록된 부서가 없습니다.</p>
              <Button
                variant="outline"
                onClick={openDepartmentCreateModal}
              >
                첫 번째 부서 추가하기
              </Button>
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#FAFBFD]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        부서명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        설명
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        인원 수
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F4F9] bg-card">
                    {departments.map((department) => (
                      <tr key={department.id} className="cursor-pointer transition-colors hover:bg-[#FAFBFD]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-foreground">{department.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[12.5px] text-muted-foreground">{department.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-[12.5px] text-foreground">{department.member_count || 0}명</span>
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
                                handleAddMemberToDepartment(department);
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
                              className="h-8 w-8 p-0 text-[#DC2626] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
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

      {/* Organization Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>조직 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-foreground">
              정말로 <strong>{editingOrganization?.name}</strong> 조직을 삭제하시겠습니까?
            </p>
            <p className="text-sm text-red-600">
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setEditingOrganization(null);
                }}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDeleteOrganization}
                disabled={loading}
              >
                {loading ? <Spinner /> : '삭제'}
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
            <p className="text-foreground">
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

      {/* Add Members to Organization Modal */}
      <Dialog open={showMemberModal} onOpenChange={(open) => {
        setShowMemberModal(open);
        if (!open) {
          setSelectedMemberIds(new Set());
          setMemberSearchTerm('');
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedOrganization?.name}에 교인 추가
            </DialogTitle>
            <DialogDescription>
              추가할 교인을 선택하세요. 이미 이 조직에 소속된 교인은 회색으로 표시되며, 다른 조직에 소속된 교인은 선택 시 자동으로 이동됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="이름, 전화번호, 주소로 검색..."
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAllMembers}
                disabled={memberLoading}
              >
                전체 선택/해제
              </Button>
            </div>

            {/* Selected Count */}
            <div className="text-[12.5px] text-muted-foreground">
              선택된 교인: <strong>{selectedMemberIds.size}명</strong>
            </div>

            {/* Member List */}
            <div className="border rounded-lg overflow-hidden">
              {memberLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                  <span className="ml-2">교인 목록을 불러오는 중...</span>
                </div>
              ) : getFilteredMembers().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 text-[#CBD5E1]" />
                  <p>검색 결과가 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[400px]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="w-12 px-4 py-3">
                          <input
                            type="checkbox"
                            onChange={handleToggleAllMembers}
                            checked={
                              getFilteredMembers().length > 0 &&
                              getFilteredMembers().every(m =>
                                m.isCurrentOrganization || selectedMemberIds.has(m.id)
                              )
                            }
                            className="w-4 h-4"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          이름
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          생년월일
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          전화번호
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          주소
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F4F9] bg-card">
                      {getFilteredMembers().map((member) => (
                        <tr
                          key={member.id}
                          className={`hover:bg-[#FAFBFD] cursor-pointer ${
                            member.isCurrentOrganization ? 'bg-gray-100 text-gray-400' : ''
                          }`}
                          onClick={() => {
                            if (!member.isCurrentOrganization) {
                              handleToggleMember(member.id);
                            }
                          }}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedMemberIds.has(member.id) || member.isCurrentOrganization}
                              onChange={() => handleToggleMember(member.id)}
                              disabled={member.isCurrentOrganization}
                              className="w-4 h-4"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {member.name}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {member.birthdate || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {member.phone || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {member.address || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {member.isCurrentOrganization ? (
                              <Badge variant="secondary" className="text-xs">
                                이미 소속됨
                              </Badge>
                            ) : member.currentOrganizationName ? (
                              <Badge variant="outline" className="text-xs text-[#B45309] border-[#FBF1E3]">
                                {member.currentOrganizationName}에서 이동
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                추가 가능
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMemberModal(false);
                  setSelectedMemberIds(new Set());
                  setMemberSearchTerm('');
                }}
                disabled={memberLoading}
              >
                취소
              </Button>
              <Button
                onClick={handleAddMembersToOrganization}
                disabled={memberLoading || selectedMemberIds.size === 0}
              >
                {memberLoading ? (
                  <Spinner />
                ) : (
                  (() => {
                    const selectedMembers = availableMembers.filter(m => selectedMemberIds.has(m.id));
                    const moveCount = selectedMembers.filter(m => m.currentOrganizationId && !m.isCurrentOrganization).length;
                    const addCount = selectedMembers.filter(m => !m.currentOrganizationId).length;

                    if (moveCount > 0 && addCount > 0) {
                      return `${addCount}명 추가 / ${moveCount}명 이동`;
                    } else if (moveCount > 0) {
                      return `${moveCount}명 이동`;
                    } else {
                      return `${addCount}명 추가`;
                    }
                  })()
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Members to Department Modal */}
      <Dialog open={showDepartmentMemberModal} onOpenChange={(open) => {
        setShowDepartmentMemberModal(open);
        if (!open) {
          setSelectedDepartmentMemberIds(new Set());
          setDepartmentMemberSearchTerm('');
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedDepartment?.name}에 교인 추가
            </DialogTitle>
            <DialogDescription>
              추가할 교인을 선택하세요. 이미 이 부서에 소속된 교인은 회색으로 표시되며, 다른 부서에 소속된 교인은 선택 시 자동으로 이동됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="이름, 전화번호, 주소로 검색..."
                  value={departmentMemberSearchTerm}
                  onChange={(e) => setDepartmentMemberSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAllDepartmentMembers}
                disabled={departmentMemberLoading}
              >
                전체 선택/해제
              </Button>
            </div>

            {/* Selected Count */}
            <div className="text-[12.5px] text-muted-foreground">
              선택된 교인: <strong>{selectedDepartmentMemberIds.size}명</strong>
            </div>

            {/* Member List */}
            <div className="border rounded-lg overflow-hidden">
              {departmentMemberLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                  <span className="ml-2">교인 목록을 불러오는 중...</span>
                </div>
              ) : getFilteredDepartmentMembers().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 text-[#CBD5E1]" />
                  <p>검색 결과가 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[400px]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="w-12 px-4 py-3">
                          <input
                            type="checkbox"
                            onChange={handleToggleAllDepartmentMembers}
                            checked={
                              getFilteredDepartmentMembers().length > 0 &&
                              getFilteredDepartmentMembers().every(m =>
                                m.isCurrentDepartment || selectedDepartmentMemberIds.has(m.id)
                              )
                            }
                            className="w-4 h-4"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          이름
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          생년월일
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          전화번호
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          주소
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F4F9] bg-card">
                      {getFilteredDepartmentMembers().map((member) => (
                        <tr
                          key={member.id}
                          className={`hover:bg-[#FAFBFD] cursor-pointer ${
                            member.isCurrentDepartment ? 'bg-gray-100 text-gray-400' : ''
                          }`}
                          onClick={() => {
                            if (!member.isCurrentDepartment) {
                              handleToggleDepartmentMember(member.id);
                            }
                          }}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedDepartmentMemberIds.has(member.id) || member.isCurrentDepartment}
                              onChange={() => handleToggleDepartmentMember(member.id)}
                              disabled={member.isCurrentDepartment}
                              className="w-4 h-4"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {member.name}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {member.birthdate || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {member.phone || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {member.address || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {member.isCurrentDepartment ? (
                              <Badge variant="secondary" className="text-xs">
                                이미 소속됨
                              </Badge>
                            ) : member.currentDepartment ? (
                              <Badge variant="outline" className="text-xs text-[#B45309] border-[#FBF1E3]">
                                {member.currentDepartment}에서 이동
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                추가 가능
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDepartmentMemberModal(false);
                  setSelectedDepartmentMemberIds(new Set());
                  setDepartmentMemberSearchTerm('');
                }}
                disabled={departmentMemberLoading}
              >
                취소
              </Button>
              <Button
                onClick={handleAddMembersToDepartment}
                disabled={departmentMemberLoading || selectedDepartmentMemberIds.size === 0}
              >
                {departmentMemberLoading ? (
                  <Spinner />
                ) : (
                  (() => {
                    const selectedMembers = availableDepartmentMembers.filter(m => selectedDepartmentMemberIds.has(m.id));
                    const moveCount = selectedMembers.filter(m => m.currentDepartment && !m.isCurrentDepartment).length;
                    const addCount = selectedMembers.filter(m => !m.currentDepartment).length;

                    if (moveCount > 0 && addCount > 0) {
                      return `${addCount}명 추가 / ${moveCount}명 이동`;
                    } else if (moveCount > 0) {
                      return `${moveCount}명 이동`;
                    } else {
                      return `${addCount}명 추가`;
                    }
                  })()
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default OrganizationManagement;