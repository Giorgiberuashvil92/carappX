import React, { createContext, useContext, useMemo, useState } from 'react';

export type RequestItem = {
  id: string;
  vehicle: { make: string; model: string; year: string };
  partName: string;
  brand?: string;
  budgetGEL?: number;
  distanceKm?: number;
  createdAt: number;
  status?: 'active' | 'fulfilled' | 'cancelled';
  description?: string;
  urgency?: 'low' | 'medium' | 'high';
};

export type OfferItem = {
  id: string;
  reqId: string;
  providerName: string;
  priceGEL: number;
  etaMin: number;
  distanceKm?: number | null;
  rating?: number;
  status?: 'new' | 'accepted' | 'counter' | 'fulfilled' | 'cancelled';
  createdAt: number;
  notes?: string;
  warranty?: string;
  isOriginal?: boolean;
};

export type MessageItem = {
  id: string;
  offerId: string;
  author: 'user' | 'partner';
  text: string;
  createdAt: number;
  isRead?: boolean;
};

type MarketplaceState = {
  requests: RequestItem[];
  offers: OfferItem[];
  messages: MessageItem[];
  // Actions
  seedRequests: (items: RequestItem[]) => void;
  postOffer: (input: { reqId: string; providerName: string; priceGEL: number; etaMin: number; distanceKm?: number | null; notes?: string; warranty?: string; isOriginal?: boolean }) => OfferItem;
  acceptOffer: (offerId: string) => void;
  postMessage: (input: { offerId: string; author: 'user' | 'partner'; text: string }) => MessageItem;
  createRequest: (input: { vehicle: { make: string; model: string; year: string }; partName: string; brand?: string; budgetGEL?: number; description?: string; urgency?: 'low' | 'medium' | 'high' }) => RequestItem;
  // Helpers
  getOffersForRequest: (reqId: string) => OfferItem[];
  getMessagesForOffer: (offerId: string) => MessageItem[];
  getActiveRequests: () => RequestItem[];
  searchRequests: (query: string) => RequestItem[];
};

const MarketplaceContext = createContext<MarketplaceState | null>(null);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<RequestItem[]>([
    { 
      id: 'r1', 
      vehicle: { make: 'BMW', model: '320i', year: '2015' }, 
      partName: 'ზეთის ფილტრი', 
      brand: 'Bosch', 
      budgetGEL: 120, 
      distanceKm: 2.3, 
      createdAt: Date.now() - 1000 * 60 * 2,
      status: 'active',
      description: 'ზეთის ფილტრი უნდა იყოს ორიგინალი ან Bosch-ის ბრენდის',
      urgency: 'medium'
    },
    { 
      id: 'r2', 
      vehicle: { make: 'Toyota', model: 'Camry', year: '2018' }, 
      partName: 'ბრეკის ხუნდები', 
      brand: 'ATE', 
      budgetGEL: 180, 
      distanceKm: 3.1, 
      createdAt: Date.now() - 1000 * 60 * 8,
      status: 'active',
      description: 'წინა ბორბლების ბრეკის ხუნდები, უნდა იყოს მაღალი ხარისხის',
      urgency: 'high'
    },
    { 
      id: 'r3', 
      vehicle: { make: 'Audi', model: 'A4', year: '2013' }, 
      partName: 'თერმოსტატი', 
      brand: 'Mahle', 
      budgetGEL: 150, 
      distanceKm: 4.8, 
      createdAt: Date.now() - 1000 * 60 * 20,
      status: 'active',
      description: 'ძრავის თერმოსტატი, უნდა იყოს ორიგინალი',
      urgency: 'low'
    },
    { 
      id: 'r4', 
      vehicle: { make: 'Mercedes', model: 'C200', year: '2016' }, 
      partName: 'ჰაერის ფილტრი', 
      brand: 'Mann', 
      budgetGEL: 80, 
      distanceKm: 1.5, 
      createdAt: Date.now() - 1000 * 60 * 5,
      status: 'active',
      description: 'ჰაერის ფილტრი ძრავისთვის',
      urgency: 'medium'
    },
    { 
      id: 'r5', 
      vehicle: { make: 'Volkswagen', model: 'Golf', year: '2017' }, 
      partName: 'სანთურები', 
      brand: 'NGK', 
      budgetGEL: 200, 
      distanceKm: 2.8, 
      createdAt: Date.now() - 1000 * 60 * 15,
      status: 'active',
      description: 'იგნიციის სანთურები, უნდა იყოს NGK ან Denso',
      urgency: 'high'
    },
  ]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);

  const seedRequests = (items: RequestItem[]) => setRequests(items);

  const createRequest: MarketplaceState['createRequest'] = ({ vehicle, partName, brand, budgetGEL, description, urgency }) => {
    const request: RequestItem = {
      id: `r-${Date.now()}`,
      vehicle,
      partName,
      brand,
      budgetGEL,
      distanceKm: Math.random() * 5 + 1, // Mock distance
      createdAt: Date.now(),
      status: 'active',
      description,
      urgency: urgency || 'medium',
    };
    setRequests((prev) => [request, ...prev]);
    return request;
  };

  const postOffer: MarketplaceState['postOffer'] = ({ reqId, providerName, priceGEL, etaMin, distanceKm = null, notes, warranty, isOriginal }) => {
    const offer: OfferItem = {
      id: `p-${Date.now()}`,
      reqId,
      providerName,
      priceGEL,
      etaMin,
      distanceKm,
      rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
      status: 'new',
      createdAt: Date.now(),
      notes,
      warranty,
      isOriginal,
    };
    setOffers((prev) => [offer, ...prev]);
    return offer;
  };

  const acceptOffer: MarketplaceState['acceptOffer'] = (offerId) => {
    setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: 'accepted' } : o)));
  };

  const postMessage: MarketplaceState['postMessage'] = ({ offerId, author, text }) => {
    const message: MessageItem = { 
      id: `m-${Date.now()}`, 
      offerId, 
      author, 
      text, 
      createdAt: Date.now(),
      isRead: false
    };
    setMessages((prev) => [...prev, message]);
    return message;
  };

  const getOffersForRequest = (reqId: string) => offers.filter((o) => o.reqId === reqId);
  const getMessagesForOffer = (offerId: string) => messages.filter((m) => m.offerId === offerId);
  const getActiveRequests = () => requests.filter((r) => r.status === 'active');
  const searchRequests = (query: string) => {
    const q = query.toLowerCase().trim();
    return requests.filter((r) => 
      r.partName.toLowerCase().includes(q) ||
      (r.brand && r.brand.toLowerCase().includes(q)) ||
      r.vehicle.make.toLowerCase().includes(q) ||
      r.vehicle.model.toLowerCase().includes(q) ||
      r.vehicle.year.includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  };

  const value = useMemo<MarketplaceState>(() => ({
    requests,
    offers,
    messages,
    seedRequests,
    postOffer,
    acceptOffer,
    postMessage,
    createRequest,
    getOffersForRequest,
    getMessagesForOffer,
    getActiveRequests,
    searchRequests,
  }), [requests, offers, messages]);

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error('useMarketplace must be used within MarketplaceProvider');
  return ctx;
}


