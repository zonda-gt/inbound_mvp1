import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import './v2.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'HelloChina — Your China, Sorted',
  description: 'Discover restaurants, navigate the metro, and decode China — all in English.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={dmSans.variable}
      style={{
        background: '#0A0A0F',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
