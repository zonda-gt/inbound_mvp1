"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

/* ── Accordion root ── */
interface AccordionContextValue {
  openItem: string | null;
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue>({
  openItem: null,
  toggle: () => {},
});

export function Accordion({
  children,
  className,
}: {
  type?: "single";
  collapsible?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const toggle = useCallback(
    (value: string) => setOpenItem((prev) => (prev === value ? null : value)),
    [],
  );

  return (
    <AccordionContext.Provider value={{ openItem, toggle }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
}

/* ── Item ── */
export function AccordionItem({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { openItem } = useContext(AccordionContext);
  const isOpen = openItem === value;

  return (
    <div className={className} data-state={isOpen ? "open" : "closed"}>
      {children}
    </div>
  );
}

/* ── Trigger ── */
export function AccordionTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { openItem, toggle } = useContext(AccordionContext);
  // find the parent AccordionItem's value via DOM isn't great,
  // so we pass it via a nested context
  return (
    <AccordionTriggerInner className={className}>
      {children}
    </AccordionTriggerInner>
  );
}

// We need the value from AccordionItem — use a sub-context
const ItemValueContext = createContext<string>("");

// Re-export AccordionItem with value context
export function AccordionItemWithValue({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { openItem } = useContext(AccordionContext);
  const isOpen = openItem === value;

  return (
    <ItemValueContext.Provider value={value}>
      <div className={className} data-state={isOpen ? "open" : "closed"}>
        {children}
      </div>
    </ItemValueContext.Provider>
  );
}

function AccordionTriggerInner({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { openItem, toggle } = useContext(AccordionContext);
  const value = useContext(ItemValueContext);
  const isOpen = openItem === value;

  return (
    <button
      type="button"
      onClick={() => toggle(value)}
      className={cn(
        "flex w-full items-center justify-between",
        className,
      )}
      aria-expanded={isOpen}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180",
        )}
      />
    </button>
  );
}

/* ── Content ── */
export function AccordionContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { openItem } = useContext(AccordionContext);
  const value = useContext(ItemValueContext);
  const isOpen = openItem === value;

  if (!isOpen) return null;

  return <div className={className}>{children}</div>;
}
