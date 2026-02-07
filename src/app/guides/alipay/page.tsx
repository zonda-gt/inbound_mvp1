import Link from "next/link";

export default function AlipayGuidePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Alipay Setup Guide — Coming Soon
      </h1>
      <Link
        href="/guides"
        className="mt-6 text-sm font-medium text-[#2563EB] hover:underline"
      >
        ← Back to guides
      </Link>
    </div>
  );
}
