"use client";

import { useRef, useState, useCallback, KeyboardEvent } from "react";

export default function ChatInput({
  onSend,
  disabled,
  onCameraClick,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  onCameraClick?: () => void;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasText = value.trim().length > 0;

  return (
    <div style={{
      padding: "8px 12px calc(env(safe-area-inset-bottom, 0px) + 8px)",
      background: "rgba(255,255,255,0.9)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      <div style={{
        maxWidth: 768, margin: "0 auto",
        display: "flex", alignItems: "flex-end", gap: 8,
        background: "#F4F4F4",
        border: "1px solid #E5E5E5",
        borderRadius: 26,
        padding: "6px 6px 6px 16px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        transition: "border-color 200ms ease, box-shadow 200ms ease",
      }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); adjustHeight(); }}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about China..."
          rows={1}
          disabled={disabled}
          style={{
            flex: 1, border: "none", background: "transparent",
            fontSize: 16, lineHeight: 1.4, resize: "none",
            color: "#0D0D0D", outline: "none",
            padding: "6px 0", minHeight: 28,
            opacity: disabled ? 0.5 : 1,
          }}
        />
        {onCameraClick && (
          <button
            onClick={onCameraClick}
            disabled={disabled}
            style={{
              width: 36, height: 36, borderRadius: 18, flexShrink: 0,
              border: "none", cursor: disabled ? "default" : "pointer",
              background: disabled ? "#E5E5E5" : "#E8E8E8",
              color: disabled ? "#B0B0B0" : "#666",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 150ms ease",
            }}
            aria-label="Take or upload photo"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M1 8a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 8.07 3h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 16.07 6H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8Zm13.5 3a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={!hasText || disabled}
          style={{
            width: 36, height: 36, borderRadius: 18, flexShrink: 0,
            border: "none",
            cursor: (hasText && !disabled) ? "pointer" : "default",
            background: (hasText && !disabled) ? "#D0021B" : "#E5E5E5",
            color: (hasText && !disabled) ? "#fff" : "#B0B0B0",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 150ms ease, transform 100ms ease",
          }}
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
