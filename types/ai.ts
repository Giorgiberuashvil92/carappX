export type AIRequestMode = 'parts' | 'tow' | 'mechanic';

export type PartsRequest = {
  mode: 'parts';
  vehicle: {
    make: string;
    model: string;
    year: string;
    vin?: string;
  };
  part: {
    name: string;
    notes?: string;
    photoUri?: string;
  };
  logistics: {
    address?: string;
    preferredTime?: string;
    budgetGEL?: number;
  };
};

export type TowRequest = {
  mode: 'tow';
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  vehicle: {
    make?: string;
    model?: string;
    plate?: string;
  };
  issue: {
    description: string;
    priority: 'low' | 'normal' | 'urgent';
  };
  timing?: {
    window?: string;
  };
};

export type MechanicRequest = {
  mode: 'mechanic';
  symptoms: string[];
  description?: string;
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  preferredTime?: string;
  budgetGEL?: number;
};

export type AIServiceRequest = PartsRequest | TowRequest | MechanicRequest;


