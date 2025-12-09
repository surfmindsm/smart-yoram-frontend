// Organization Management Service
// Service layer for church organization management APIs

import { supabase } from '../lib/supabase';
import {
  ChurchOrganization,
  MemberOrganization,
  OrganizationActivity,
  OrganizationFormData,
  MemberAssignmentFormData,
  ActivityFormData,
  OrganizationListResponse,
  MemberOrganizationListResponse,
  OrganizationStatsResponse,
  OrganizationFilter,
  MemberFilter
} from '../types/organization';

class OrganizationService {
  // ==================== Organization Management ====================

  /**
   * Get all organizations for a church with optional filtering
   */
  async getOrganizations(
    churchId: number,
    filter?: Partial<OrganizationFilter>
  ): Promise<OrganizationListResponse> {
    try {
      let query = supabase
        .from('church_organizations')
        .select(`
          id,
          church_id,
          name,
          description,
          organization_type,
          parent_id,
          level,
          sort_order,
          leader_id,
          contact_phone,
          contact_email,
          meeting_schedule,
          meeting_location,
          is_active,
          member_count,
          created_at,
          updated_at
        `)
        .eq('church_id', churchId)
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      // Apply filters
      if (filter?.search) {
        query = query.ilike('name', `%${filter.search}%`);
      }

      if (filter?.organization_type && filter.organization_type !== 'all') {
        query = query.eq('organization_type', filter.organization_type);
      }

      if (filter?.is_active !== 'all' && typeof filter?.is_active === 'boolean') {
        query = query.eq('is_active', filter.is_active);
      }

      if (filter?.parent_id && filter.parent_id !== 'all') {
        query = query.eq('parent_id', filter.parent_id);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching organizations:', error);
        throw error;
      }

      // Build organization tree structure
      const organizations = this.buildOrganizationTree(data || []);

      return {
        organizations,
        total_count: count || 0,
        has_next: false,
        has_prev: false
      };
    } catch (error) {
      console.error('Error in getOrganizations:', error);
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<ChurchOrganization> {
    try {
      const { data, error } = await supabase
        .from('church_organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrganization:', error);
      throw error;
    }
  }

  /**
   * Create new organization
   */
  async createOrganization(
    churchId: number,
    data: OrganizationFormData
  ): Promise<ChurchOrganization> {
    try {
      // Calculate level based on parent
      let level = 1;
      if (data.parent_id) {
        const { data: parent } = await supabase
          .from('church_organizations')
          .select('level')
          .eq('id', data.parent_id)
          .single();

        if (parent) {
          level = parent.level + 1;
        }
      }

      const organizationData = {
        church_id: churchId,
        name: data.name,
        description: data.description || null,
        organization_type: data.organization_type,
        parent_id: data.parent_id || null,
        level,
        leader_id: data.leader_id || null,
        contact_phone: data.contact_phone || null,
        contact_email: data.contact_email || null,
        meeting_schedule: data.meeting_schedule || null,
        meeting_location: data.meeting_location || null,
        is_active: true
      };

      const { data: result, error } = await supabase
        .from('church_organizations')
        .insert(organizationData)
        .select()
        .single();

      if (error) {
        console.error('Error creating organization:', error);
        throw error;
      }

      return result;
    } catch (error) {
      console.error('Error in createOrganization:', error);
      throw error;
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(
    id: string,
    data: Partial<OrganizationFormData>
  ): Promise<ChurchOrganization> {
    try {
      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString()
      };

      // Convert empty string to null for UUID fields
      if (updateData.parent_id === '') {
        updateData.parent_id = null;
      }
      if (updateData.leader_id === '') {
        updateData.leader_id = null;
      }

      // Recalculate level if parent changed
      if (data.parent_id !== undefined) {
        if (data.parent_id && data.parent_id !== '') {
          const { data: parent } = await supabase
            .from('church_organizations')
            .select('level')
            .eq('id', data.parent_id)
            .single();

          if (parent) {
            updateData.level = parent.level + 1;
          }
        } else {
          updateData.level = 1;
        }
      }

      const { data: result, error } = await supabase
        .from('church_organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating organization:', error);
        throw error;
      }

      return result;
    } catch (error) {
      console.error('Error in updateOrganization:', error);
      throw error;
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<void> {
    try {
      // Check if organization has children
      const { data: children } = await supabase
        .from('church_organizations')
        .select('id')
        .eq('parent_id', id);

      if (children && children.length > 0) {
        throw new Error('하위 조직이 있는 조직은 삭제할 수 없습니다.');
      }

      // Check if organization has members
      const { data: members } = await supabase
        .from('member_organizations')
        .select('id')
        .eq('organization_id', id)
        .eq('is_active', true);

      if (members && members.length > 0) {
        throw new Error('소속 교인이 있는 조직은 삭제할 수 없습니다.');
      }

      const { error } = await supabase
        .from('church_organizations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting organization:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteOrganization:', error);
      throw error;
    }
  }

  // ==================== Member Assignment Management ====================

  /**
   * Get member assignments for an organization
   */
  async getMemberAssignments(
    organizationId: string,
    filter?: Partial<MemberFilter>
  ): Promise<MemberOrganizationListResponse> {
    try {
      let query = supabase
        .from('member_organizations')
        .select(`
          id,
          member_id,
          organization_id,
          role,
          assigned_at,
          assigned_by,
          is_active,
          notes,
          created_at,
          updated_at
        `)
        .eq('organization_id', organizationId);

      // Apply filters
      if (filter?.role && filter.role !== 'all') {
        query = query.eq('role', filter.role);
      }

      if (filter?.is_active !== 'all' && typeof filter?.is_active === 'boolean') {
        query = query.eq('is_active', filter.is_active);
      }

      query = query.order('assigned_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching member assignments:', error);
        throw error;
      }

      return {
        assignments: data || [],
        total_count: count || 0,
        has_next: false,
        has_prev: false
      };
    } catch (error) {
      console.error('Error in getMemberAssignments:', error);
      throw error;
    }
  }

  /**
   * Assign member to organization
   */
  async assignMember(data: MemberAssignmentFormData): Promise<MemberOrganization> {
    try {
      // Check if member is already assigned to this organization
      const { data: existing } = await supabase
        .from('member_organizations')
        .select('id')
        .eq('member_id', data.member_id)
        .eq('organization_id', data.organization_id)
        .single();

      if (existing) {
        throw new Error('이미 해당 조직에 배정된 교인입니다.');
      }

      const assignmentData = {
        member_id: data.member_id,
        organization_id: data.organization_id,
        role: data.role,
        notes: data.notes || null,
        is_active: true
      };

      const { data: result, error } = await supabase
        .from('member_organizations')
        .insert(assignmentData)
        .select()
        .single();

      if (error) {
        console.error('Error assigning member:', error);
        throw error;
      }

      return result;
    } catch (error) {
      console.error('Error in assignMember:', error);
      throw error;
    }
  }

  /**
   * Update member assignment
   */
  async updateMemberAssignment(
    id: string,
    data: Partial<MemberAssignmentFormData>
  ): Promise<MemberOrganization> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('member_organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating member assignment:', error);
        throw error;
      }

      return result;
    } catch (error) {
      console.error('Error in updateMemberAssignment:', error);
      throw error;
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('member_organizations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error removing member:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in removeMember:', error);
      throw error;
    }
  }

  // ==================== Organization Statistics ====================

  /**
   * Get organization statistics
   */
  async getOrganizationStats(organizationId: string): Promise<OrganizationStatsResponse> {
    try {
      // This would typically call a stored procedure or use a more complex query
      // For now, we'll implement basic stats
      const { data: assignments } = await supabase
        .from('member_organizations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      const { data: organization } = await supabase
        .from('church_organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

      const stats: OrganizationStatsResponse = {
        organization_id: organizationId,
        organization_name: organization?.name || '',
        total_members: assignments?.length || 0,
        active_members: assignments?.length || 0,
        leaders_count: assignments?.filter(a => a.role === 'leader').length || 0,
        gender_distribution: {
          male: 0,
          female: 0,
          unknown: 0
        },
        age_distribution: {
          '0-19': 0,
          '20-29': 0,
          '30-39': 0,
          '40-49': 0,
          '50-59': 0,
          '60+': 0
        },
        recent_activities: 0
      };

      return stats;
    } catch (error) {
      console.error('Error in getOrganizationStats:', error);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Build hierarchical organization tree from flat array
   */
  private buildOrganizationTree(organizations: ChurchOrganization[]): ChurchOrganization[] {
    const orgMap = new Map<string, ChurchOrganization>();
    const rootOrgs: ChurchOrganization[] = [];

    // Initialize organizations with empty children arrays
    organizations.forEach(org => {
      orgMap.set(org.id, { ...org, children: [] });
    });

    // Build tree structure
    organizations.forEach(org => {
      const currentOrg = orgMap.get(org.id)!;

      if (org.parent_id && orgMap.has(org.parent_id)) {
        const parent = orgMap.get(org.parent_id)!;
        parent.children!.push(currentOrg);
      } else {
        rootOrgs.push(currentOrg);
      }
    });

    return rootOrgs;
  }

  /**
   * Get organization path (breadcrumb)
   */
  async getOrganizationPath(organizationId: string): Promise<ChurchOrganization[]> {
    try {
      const path: ChurchOrganization[] = [];
      let currentId: string | null = organizationId;

      while (currentId) {
        const { data, error } = await supabase
          .from('church_organizations')
          .select('*')
          .eq('id', currentId)
          .single();

        if (data && !error) {
          const org = data as ChurchOrganization;
          path.unshift(org);
          currentId = org.parent_id || null;
        } else {
          break;
        }
      }

      return path;
    } catch (error) {
      console.error('Error in getOrganizationPath:', error);
      return [];
    }
  }
}

export const organizationService = new OrganizationService();