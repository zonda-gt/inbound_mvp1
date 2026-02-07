import Link from "next/link";

const guides = [
  { title: "Alipay Setup", href: "/guides/alipay" },
  { title: "WeChat Pay Setup", href: "/guides/wechat" },
  { title: "Pre-Trip Checklist", href: "/guides/checklist" },
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="text-sm font-medium text-[#2563EB] hover:underline"
        >
          ← Back to home
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Setup Guides
        </h1>
        <p className="mt-2 text-gray-600">
          Step-by-step guides to get you set up for China.
        </p>
        <div className="mt-8 space-y-4">
          {guides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="block rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md"
            >
              <span className="font-medium text-gray-900">{guide.title}</span>
              <span className="ml-2 text-gray-400">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
