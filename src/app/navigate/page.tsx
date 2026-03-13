'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import NavigateScreen from '@/components/v2/screens/NavigateScreen';

function NavigatePageInner() {
  const params = useSearchParams();
  const router = useRouter();

  const destination = params.get('name')
    ? {
        name: params.get('name')!,
        chineseName: params.get('nameCn') || undefined,
        address: params.get('addr') || undefined,
      }
    : null;

  const referrer = params.get('from') || null;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <NavigateScreen
        onNavigate={() => router.back()}
        destination={destination}
        onClearDestination={() => router.back()}
        referrer={referrer}
      />
    </div>
  );
}

export default function NavigatePage() {
  return (
    <Suspense fallback={<div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <NavigatePageInner />
    </Suspense>
  );
}
