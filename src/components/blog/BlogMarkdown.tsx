import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type BlogMarkdownProps = {
  content: string;
};

function containsCheckbox(children: ReactNode): boolean {
  return Children.toArray(children).some(
    (child) => isValidElement(child) && child.type === "input",
  );
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-12 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-12 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-9 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mt-5 text-[1rem] leading-8 text-foreground/80 md:text-[1.125rem]">
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-[#C84032] underline decoration-[#C84032]/30 decoration-2 underline-offset-4 hover:text-[#C84032]/80"
    >
      {children}
    </a>
  ),
  ul: ({ className, children, ...props }) => {
    const isTaskList = className?.includes("contains-task-list");
    return (
      <ul
        className={
          isTaskList
            ? "my-6 space-y-2 pl-0"
            : "my-6 list-disc space-y-2 pl-6 text-[1rem] leading-8 text-foreground/80 md:text-[1.125rem]"
        }
        {...props}
      >
        {children}
      </ul>
    );
  },
  ol: ({ children, ...props }) => (
    <ol
      className="my-6 list-decimal space-y-2 pl-6 text-[1rem] leading-8 text-foreground/80 md:text-[1.125rem]"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => {
    const taskItem = containsCheckbox(children);
    return (
      <li className={taskItem ? "flex items-start gap-3 text-[1rem] leading-8 text-foreground/80 md:text-[1.125rem]" : ""} {...props}>
        {children}
      </li>
    );
  },
  input: ({ type, checked, ...props }) => {
    if (type !== "checkbox") return <input type={type} {...props} />;
    return (
      <input
        type="checkbox"
        checked={Boolean(checked)}
        readOnly
        className="mt-2 h-4 w-4 rounded border-border accent-[#C84032]"
      />
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="mt-7 rounded-r-xl border-l-4 border-[#C84032] bg-[#C84032]/5 px-4 py-3 text-[1rem] leading-8 text-foreground/80 md:text-[1.125rem]">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full border-collapse text-left text-sm sm:text-base">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-secondary">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-foreground/80">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 align-top text-sm leading-7 text-foreground/80 sm:text-base">
      {children}
    </td>
  ),
  pre: ({ children }) => (
    <pre className="my-7 overflow-x-auto rounded-xl bg-[#1A1A1A] px-4 py-4 text-sm leading-6 text-[#F5F0E8]">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    if (className?.includes("language-")) {
      return (
        <code className={`${className} font-mono text-sm`} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code
        className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.9em] text-foreground/90"
        {...props}
      >
        {children}
      </code>
    );
  },
  hr: () => <hr className="my-12 border-border" />,
};

export default function BlogMarkdown({ content }: BlogMarkdownProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}
