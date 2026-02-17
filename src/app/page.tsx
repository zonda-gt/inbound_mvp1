import Link from "next/link";
import NotifyForm from "@/components/NotifyForm";

const valueProps = [
  {
    emoji: "🧭",
    title: "Navigation",
    description:
      "Get metro routes, walking directions, and one-tap taxi — in English",
    href: "/chat",
  },
  {
    emoji: "🍜",
    title: "Restaurant Discovery",
    description:
      "Find great food nearby with English menus and ordering tips",
    href: "/chat",
  },
  {
    emoji: "💳",
    title: "Setup Guides",
    description:
      "Step-by-step Alipay, WeChat Pay, and VPN setup for foreigners",
    href: "/guides",
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
              Hello<span className="text-[#2563EB]">China</span>
            </h1>
            <p className="text-sm text-gray-500">
              Your AI guide for navigating China
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
            Like having a bilingual friend who knows the city
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Ask anything in English — get metro directions, restaurant
            recommendations, and translations with real context. Free.
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

      {/* Not in China yet */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h3 className="text-2xl font-bold text-gray-900">
            Not in China yet?
          </h3>
          <p className="mt-2 text-gray-600">
            Get notified when we launch new features for your trip
          </p>
          <NotifyForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-2 text-sm text-gray-500">
          <p>Built for foreigners navigating China</p>
          <Link href="/chat" className="text-[#2563EB] hover:underline">
            Send feedback
          </Link>
        </div>
      </footer>
    </div>
  );
}
