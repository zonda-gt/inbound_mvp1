"use client";

const prompts = [
  "🧭 How do I get to Shibuya?",
  "🍜 Find ramen near me",
  "🚇 How does the Tokyo metro work?",
  "🍽️ Recommend restaurants in Seoul",
];

export default function SuggestedPrompts({
  onSelect,
}: {
  onSelect: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-600 transition-colors hover:border-[#2563EB] hover:text-[#2563EB] active:bg-blue-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
