import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Types
export interface Offering {
  id: number;
  member_id: number;
  church_id: number;
  offered_on: string;
  fund_type: string;
  amount: number;
  note?: string;
  input_user_id: number;
  created_at: string;
  updated_at?: string;
}

export interface OfferingCreate {
  member_id: number;
  church_id: number;
  offered_on: string;
  fund_type: string;
  amount: number;
  note?: string;
}

export interface Receipt {
  id: number;
  church_id: number;
  member_id: number;
  tax_year: number;
  issue_no: string;
  issued_by: number;
  issued_at: string;
  canceled_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ReceiptCreate {
  church_id: number;
  member_id: number;
  tax_year: number;
  issue_no: string;
}

export interface FundType {
  id: number;
  church_id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface FundTypeCreate {
  church_id: number;
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface OfferingSummary {
  fund_type: string;
  total_amount: number;
  offering_count: number;
  period_start: string;
  period_end: string;
}

export interface MemberOfferingSummary {
  member_id: number;
  member_name: string;
  total_amount: number;
  offering_count: number;
  fund_types: string[];
}

// API functions
export const financialApi = {
  // Offerings
  async getOfferings(params?: {
    member_id?: number;
    fund_type?: string;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<Offering[]> {
    const response = await axios.get(`${API_BASE_URL}/financial/offerings`, { params });
    return response.data;
  },

  async createOffering(offering: OfferingCreate): Promise<Offering> {
    const response = await axios.post(`${API_BASE_URL}/financial/offerings`, offering);
    return response.data;
  },

  async updateOffering(id: number, offering: Partial<OfferingCreate>): Promise<Offering> {
    const response = await axios.put(`${API_BASE_URL}/financial/offerings/${id}`, offering);
    return response.data;
  },

  async deleteOffering(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/financial/offerings/${id}`);
  },

  // Receipts
  async getReceipts(params?: {
    tax_year?: number;
    member_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<Receipt[]> {
    const response = await axios.get(`${API_BASE_URL}/financial/receipts`, { params });
    return response.data;
  },

  async createReceipt(receipt: ReceiptCreate): Promise<Receipt> {
    const response = await axios.post(`${API_BASE_URL}/financial/receipts`, receipt);
    return response.data;
  },

  async cancelReceipt(id: number): Promise<Receipt> {
    const response = await axios.post(`${API_BASE_URL}/financial/receipts/${id}/cancel`);
    return response.data;
  },

  async downloadReceipt(id: number): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/financial/receipts/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Fund Types
  async getFundTypes(is_active?: boolean): Promise<FundType[]> {
    const params = is_active !== undefined ? { is_active } : {};
    const response = await axios.get(`${API_BASE_URL}/financial/fund-types`, { params });
    return response.data;
  },

  async createFundType(fundType: FundTypeCreate): Promise<FundType> {
    const response = await axios.post(`${API_BASE_URL}/financial/fund-types`, fundType);
    return response.data;
  },

  async updateFundType(id: number, fundType: Partial<FundTypeCreate>): Promise<FundType> {
    const response = await axios.put(`${API_BASE_URL}/financial/fund-types/${id}`, fundType);
    return response.data;
  },

  async deleteFundType(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/financial/fund-types/${id}`);
  },

  // Statistics
  async getOfferingSummary(params: {
    start_date: string;
    end_date: string;
    group_by?: 'fund_type' | 'month';
  }): Promise<OfferingSummary[]> {
    const response = await axios.get(`${API_BASE_URL}/financial/statistics/offerings-summary`, { params });
    return response.data;
  },

  async getMemberSummary(params: {
    start_date: string;
    end_date: string;
    limit?: number;
  }): Promise<MemberOfferingSummary[]> {
    const response = await axios.get(`${API_BASE_URL}/financial/statistics/member-summary`, { params });
    return response.data;
  },

  // Bulk operations
  async bulkCreateOfferings(offerings: OfferingCreate[]): Promise<Offering[]> {
    const response = await axios.post(`${API_BASE_URL}/financial/offerings/bulk`, offerings);
    return response.data;
  },

  async bulkDeleteOfferings(ids: number[]): Promise<void> {
    await axios.delete(`${API_BASE_URL}/financial/offerings/bulk`, { data: { ids } });
  }
};

export default financialApi;