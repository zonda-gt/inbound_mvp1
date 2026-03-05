'use client';

const TAGS = [
  { value: '', label: 'No tag' },
  { value: 'food', label: '🍜 Food' },
  { value: 'interior', label: '🏮 Interior' },
  { value: 'exterior', label: '🏠 Exterior' },
];

interface TagSelectorProps {
  currentTag: string;
  onChange: (tag: string) => void;
}

export default function TagSelector({ currentTag, onChange }: TagSelectorProps) {
  return (
    <select
      value={currentTag}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 mt-1"
    >
      {TAGS.map((t) => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </select>
  );
}
