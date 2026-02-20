import Link from "next/link";
import NotifyForm from "@/components/NotifyForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Hello<span className="text-[#2563EB]">China</span>
            </h1>
            <p className="text-sm text-gray-500">Your AI guide for navigating China</p>
          </div>
          <Link
            href="/chat"
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Open Chat
          </Link>
        </div>
      </header>

      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Like having a bilingual friend who knows the city
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Ask anything in English — get metro directions, restaurant recommendations, and
            translations with real context. Free.
          </p>
          <Link
            href="/chat"
            className="mt-8 inline-block rounded-xl bg-[#2563EB] px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Start Chatting →
          </Link>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h3 className="text-2xl font-bold text-gray-900">Not in China yet?</h3>
          <p className="mt-2 text-gray-600">
            Get notified when we launch new features for your trip
          </p>
          <NotifyForm />
        </div>
      </section>
    </div>
  );
}
