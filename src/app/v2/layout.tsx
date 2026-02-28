import type { Metadata, Viewport } from 'next';
import './v2.css';

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
