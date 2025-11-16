

import API_BASE_URL from '@/config/api';

export const financingApi = {
  async apply(data: {
    userId: string;
    requestId: string;
    amount: number;
    downPayment?: number;
    termMonths: number;
    personalId?: string;
    phone?: string;
    merchantPhone?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/financing/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('financing_apply_failed');
    return res.json();
  },
  async createLead(data: {
    userId: string;
    requestId: string;
    amount: number;
    phone: string;
    merchantPhone?: string;
    downPayment?: number;
    termMonths?: number;
    personalId?: string;
    note?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/financing/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('financing_lead_failed');
    return res.json();
  },
  
};


