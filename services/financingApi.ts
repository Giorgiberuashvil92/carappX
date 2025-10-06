

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
  }) {
    const res = await fetch(`${API_BASE_URL}/financing/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('financing_apply_failed');
    return res.json();
  },
  
};


