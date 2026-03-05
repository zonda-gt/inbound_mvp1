'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminNavProps {
  breadcrumb?: string;
  breadcrumbHref?: string;
  subbreadcrumb?: string;
}

export default function AdminNav({ breadcrumb, breadcrumbHref, subbreadcrumb }: AdminNavProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-900 transition-colors font-medium">Admin</Link>
        {breadcrumb && (
          <>
            <span>/</span>
            {breadcrumbHref ? (
              <Link href={breadcrumbHref} className="hover:text-gray-900 transition-colors">{breadcrumb}</Link>
            ) : (
              <span className={subbreadcrumb ? 'hover:text-gray-900' : 'text-gray-900'}>{breadcrumb}</span>
            )}
          </>
        )}
        {subbreadcrumb && (
          <>
            <span>/</span>
            <span className="text-gray-900 truncate max-w-xs">{subbreadcrumb}</span>
          </>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
