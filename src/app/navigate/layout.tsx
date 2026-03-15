import { DM_Sans } from 'next/font/google';
import '../v2/v2.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export default function NavigateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.className} ${dmSans.variable}`}>
      {children}
    </div>
  );
}
