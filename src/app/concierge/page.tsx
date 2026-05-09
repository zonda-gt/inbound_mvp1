import ConciergeChat from "@/components/concierge/ConciergeChat";

export const metadata = {
  title: "Chat | HelloChina",
};

export default function ConciergePage() {
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#fff" }}>
      <ConciergeChat />
    </div>
  );
}
