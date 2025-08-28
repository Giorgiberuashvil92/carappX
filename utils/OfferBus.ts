export type ChatMessage = {
  id: string;
  offerId: string;
  author: 'user' | 'partner';
  text: string;
  createdAt: number;
};

export type OfferEvent =
  | {
      type: 'NEW_OFFER';
      payload: {
        offer: {
          id: string;
          reqId: string;
          providerName: string;
          priceGEL: number;
          etaMin: number;
          createdAt: number;
        };
      };
    }
  | {
      type: 'ACCEPTED';
      payload: { offerId: string };
    }
  | {
      type: 'MESSAGE';
      payload: { message: ChatMessage };
    };

type Listener = (event: OfferEvent) => void;

const listeners: Listener[] = [];

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function publish(event: OfferEvent): void {
  // Call a copy to avoid mutation issues if listeners change reentrantly
  const snapshot = listeners.slice();
  for (const l of snapshot) {
    try {
      l(event);
    } catch {}
  }
}


