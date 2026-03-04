'use client';

import { useRouter } from 'next/navigation';
import EatScreen from '@/components/v2/screens/EatScreen';

export default function EatPage() {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    // eat-chinese → /v2/eat/chinese
    if (screen.startsWith('eat-')) {
      router.push(`/v2/eat/${screen.replace('eat-', '')}`);
    } else {
      router.push(`/v2`);
    }
  };

  return (
    <div className="v2-shell">
      <EatScreen onNavigate={handleNavigate} />
    </div>
  );
}
