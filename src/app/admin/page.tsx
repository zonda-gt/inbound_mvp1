import { isAuthenticated } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminDashboard() {
  if (!(await isAuthenticated())) redirect('/admin/login');

  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 text-sm mb-10">Manage images for restaurants and attractions.</p>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/restaurants"
          className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-6 hover:border-gray-400 hover:shadow-sm transition-all"
        >
          <span className="text-3xl">🍜</span>
          <span className="font-semibold text-gray-900">Restaurants</span>
          <span className="text-sm text-gray-500">Manage photos, hero image & tags</span>
        </Link>
        <Link
          href="/admin/attractions"
          className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-6 hover:border-gray-400 hover:shadow-sm transition-all"
        >
          <span className="text-3xl">🏛️</span>
          <span className="font-semibold text-gray-900">Attractions</span>
          <span className="text-sm text-gray-500">Manage photos & order</span>
        </Link>
      </div>
    </div>
  );
}
