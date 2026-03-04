"use client";

import { AiAvatar } from "./ChatMessage";

export default function TypingIndicator() {
  return (
    <div className="flex items-center justify-start gap-2.5">
      <div className="mt-1 flex-shrink-0"><AiAvatar /></div>
      <div className="flex items-center gap-1.5 py-2">
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#D0021B", animation: "hc-typing-bounce 1.4s ease-in-out infinite" }} />
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#D0021B", animation: "hc-typing-bounce 1.4s ease-in-out infinite", animationDelay: "160ms" }} />
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#D0021B", animation: "hc-typing-bounce 1.4s ease-in-out infinite", animationDelay: "320ms" }} />
      </div>
      <style>{`@keyframes hc-typing-bounce{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-4px);opacity:1}}`}</style>
    </div>
  );
}
