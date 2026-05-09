import type { Metadata } from 'next';
import ScanLanding from './ScanLanding';

export const metadata: Metadata = {
  title: 'Scan Anything in China — HelloChina AI Lens',
  description:
    'Point your camera at menus, signs, or anything in China. AI instantly explains it in English with cultural context.',
  openGraph: {
    title: 'Scan Anything in China',
    description: 'Point your camera. AI explains everything instantly.',
    type: 'website',
  },
};

export default function ScanPage() {
  return <ScanLanding />;
}
