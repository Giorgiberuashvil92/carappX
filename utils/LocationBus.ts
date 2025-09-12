export type LocationPickedEvent = {
  type: 'LOCATION_PICKED';
  payload: {
    latitude: number;
    longitude: number;
    address: string;
  };
};

type Listener = (event: LocationPickedEvent) => void;

const listeners: Listener[] = [];

export function subscribeToLocation(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function publishLocation(event: LocationPickedEvent): void {
  const snapshot = listeners.slice();
  for (const l of snapshot) {
    try {
      l(event);
    } catch {}
  }
}


