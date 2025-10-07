import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Textarea } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui";
import {
  ChurchOrganization,
  OrganizationType,
  OrganizationFormData,
  ORGANIZATION_TYPE_LABELS,
  validateOrganizationForm
} from '../types/organization';
import { organizationService } from '../services/organizationService';

interface OrganizationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organization?: ChurchOrganization | null;
  organizations: ChurchOrganization[];
  churchId: number;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organization,
  organizations,
  churchId
}) => {
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    description: '',
    organization_type: 'cell_group',
    parent_id: '',
    leader_id: null,
    contact_phone: '',
    contact_email: '',
    meeting_schedule: '',
    meeting_location: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        organization_type: organization.organization_type,
        parent_id: organization.parent_id || '',
        leader_id: organization.leader_id || null,
        contact_phone: organization.contact_phone || '',
        contact_email: organization.contact_email || '',
        meeting_schedule: organization.meeting_schedule || '',
        meeting_location: organization.meeting_location || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        organization_type: 'cell_group',
        parent_id: '',
        leader_id: null,
        contact_phone: '',
        contact_email: '',
        meeting_schedule: '',
        meeting_location: ''
      });
    }
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateOrganizationForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors([]);

      if (organization) {
        // Update existing organization
        await organizationService.updateOrganization(organization.id, formData);
      } else {
        // Create new organization
        await organizationService.createOrganization(churchId, formData);
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error saving organization:', error);
      setErrors([error.message || '조직 저장 중 오류가 발생했습니다.']);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      organization_type: 'cell_group',
      parent_id: '',
      leader_id: null,
      contact_phone: '',
      contact_email: '',
      meeting_schedule: '',
      meeting_location: ''
    });
    setErrors([]);
    onClose();
  };

  // Get available parent organizations (exclude current organization and its children)
  const getAvailableParents = () => {
    if (!organization) {
      return organizations;
    }

    // For editing, exclude self and descendants
    const excludeIds = new Set<string>([organization.id]);

    const collectDescendants = (org: ChurchOrganization) => {
      if (org.children) {
        org.children.forEach(child => {
          excludeIds.add(child.id);
          collectDescendants(child);
        });
      }
    };

    collectDescendants(organization);

    return organizations.filter(org => !excludeIds.has(org.id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {organization ? '조직 수정' : '새 조직 추가'}
          </DialogTitle>
          <DialogDescription>
            교회 조직 정보를 입력해주세요. 셀그룹, 사역팀 등을 생성할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Error messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {errors.map((error, index) => (
                <p key={index} className="text-sm">{error}</p>
              ))}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              조직명 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: 청년부, 예배팀"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="조직에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          {/* Parent Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상위 조직
            </label>
            <Select
              value={formData.parent_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="상위 조직 선택 (최상위인 경우 비워두세요)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">없음 (최상위 조직)</SelectItem>
                {getAvailableParents().map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name} ({ORGANIZATION_TYPE_LABELS[org.organization_type]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연락처
              </label>
              <Input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="010-0000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="example@church.org"
              />
            </div>
          </div>

          {/* Meeting Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                모임 일정
              </label>
              <Input
                value={formData.meeting_schedule}
                onChange={(e) => setFormData({ ...formData, meeting_schedule: e.target.value })}
                placeholder="예: 매주 금요일 오후 7시"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                모임 장소
              </label>
              <Input
                value={formData.meeting_location}
                onChange={(e) => setFormData({ ...formData, meeting_location: e.target.value })}
                placeholder="예: 교회 2층 소모임실"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : (organization ? '수정' : '추가')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationForm;