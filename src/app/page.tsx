import Link from "next/link";

const valueProps = [
  {
    emoji: "🧭",
    title: "Navigation",
    description:
      "Get train routes, walking directions, and practical transit tips — in English",
    href: "/chat",
  },
  {
    emoji: "🍜",
    title: "Restaurant Discovery",
    description:
      "Find great food nearby with English names and ordering tips",
    href: "/chat",
  },
  {
    emoji: "🗣️",
    title: "Translation & Tips",
    description:
      "Translate signs, menus, and get practical tips for daily life",
    href: "/chat",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              JK Travel <span className="text-[#2563EB]">AI</span>
            </h1>
            <p className="text-sm text-gray-500">
              Your AI guide for Japan & Korea
            </p>
          </div>
          <Link
            href="/chat"
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Open Chat
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Navigate Japan & Korea with confidence
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            AI-powered navigation, restaurant discovery, and travel help —
            designed for foreigners
          </p>
          <Link
            href="/chat"
            className="mt-8 inline-block rounded-xl bg-[#2563EB] px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Start Chatting →
          </Link>
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {valueProps.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <span className="text-3xl">{item.emoji}</span>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Not there yet */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h3 className="text-2xl font-bold text-gray-900">
            Planning your trip?
          </h3>
          <p className="mt-2 text-gray-600">
            Explore what Tokyo, Osaka, Seoul, and more have to offer
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="email"
              placeholder="your@email.com"
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
            <button className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800">
              Notify me
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-2 text-sm text-gray-500">
          <p>Built for foreigners navigating Japan & Korea</p>
          <Link href="/chat" className="text-[#2563EB] hover:underline">
            Send feedback
          </Link>
        </div>
      </footer>
    </div>
  );
}
