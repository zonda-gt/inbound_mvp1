'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import EatCategoryScreen from '@/components/v2/screens/EatCategoryScreen';
import type { EatCategory } from '@/components/v2/data/eat-restaurants';

const VALID: Set<string> = new Set(['chinese', 'asian', 'middle_eastern', 'western', 'bars']);

export default function EatCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const router = useRouter();

  if (!VALID.has(category)) return <div>Not found</div>;

  const handleNavigate = (screen: string) => {
    if (screen === 'eat') {
      router.push('/v2/eat');
    } else {
      router.push('/v2');
    }
  };

  return (
    <div className="v2-shell">
      <EatCategoryScreen categoryId={category as EatCategory} onNavigate={handleNavigate} />
    </div>
  );
}
