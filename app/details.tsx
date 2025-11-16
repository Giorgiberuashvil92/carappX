import React, { useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import DetailView, { DetailViewProps } from '@/components/DetailView';
import API_BASE_URL from '@/config/api';

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const title = (params.title as string) || 'სერვისი';
  const cover = (params.image as string) || undefined;
  const addressParam = (params.address as string) || '';
  const distance = (params.distance as string) || '';
  const eta = (params.waitTime as string) || '';
  const phoneParam = (params.phone as string) || '';
  const requestId = (params.requestId as string) || (params.id as string) || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [detail, setDetail] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      const id = (params.id as string) || requestId;
      if (!id) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/carwash/locations/${encodeURIComponent(id)}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const json = await res.json();
        setDetail(json?.data || json);
      } catch (e) {
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, requestId]);

  const mapped: DetailViewProps | null = useMemo(() => {
    const d = detail;
    const phone = d?.phone || phoneParam || '';
    const addr = d?.address || addressParam || '';
    const basePrice = typeof d?.price === 'number' ? `₾${d.price}` : (params.price as string) || undefined;
    const services = (d?.detailedServices || []).map((s: any) => ({
      name: s.name,
      price: `₾${s.price}`,
      duration: `${s.duration} წთ`,
    }));
    // packages synthesis from top services if packages are not provided
    const packages = services.slice(0, 2).map((s: any, i: number) => ({
      name: i === 0 ? 'Basic' : 'Premium',
      price: s.price,
      includes: [s.name],
      highlight: i === 1,
    }));

    const coverImage = d?.images?.[0] || cover;

    const props: DetailViewProps = {
      id: d?.id || requestId,
      title: d?.name || title,
      coverImage,
      rating: { value: Number(d?.rating || params.rating || 4.9), count: Number(d?.reviews || 0) },
      distance: distance || undefined,
      eta: eta || undefined,
      price: { from: basePrice },
      vendor: { phone, location: { address: addr } },
      sections: {
        description: d?.description || (params.description as string) || '',
        services,
        packages,
        features: [
          { icon: 'wifi', label: 'WiFi' },
          { icon: 'card', label: 'ბარათით გადახდა' },
        ],
      },
      actions: {
        onBook: () => {
          const loc = {
            id: d?.id || requestId,
            name: d?.name || title,
            address: d?.address || '',
            image: coverImage,
            category: d?.category || 'Carwash',
            isOpen: Boolean(d?.isOpen),
            rating: Number(d?.rating || 0),
            reviews: Number(d?.reviews || 0),
            distance: distance || '',
          };
          const ds = d?.detailedServices || [];
          const tsc = d?.timeSlotsConfig || null;

          router.push({
            pathname: '/booking',
            params: {
              location: JSON.stringify(loc),
              locationDetailedServices: JSON.stringify(ds),
              locationTimeSlotsConfig: JSON.stringify(tsc),
            },
          });
        },
        onCall: () => { if (phone) Linking.openURL(`tel:${phone}`); },
        onFinance: (amount) => {
          const fallback = basePrice ? parseInt(String(basePrice).replace(/[^0-9]/g, '')) : 0;
          const a = amount || fallback || 0;
          router.push(`/financing-request?requestId=${encodeURIComponent(d?.id || requestId)}&amount=${encodeURIComponent(String(a))}`);
        },
        onShare: () => {},
      },
      flags: { stickyCTA: true, showFinance: true },
    };
    return props;
  }, [detail, cover, title, addressParam, distance, eta, phoneParam, requestId, params.description, params.rating, params.price]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {mapped && <DetailView {...mapped} />}
    </>
  );
}


