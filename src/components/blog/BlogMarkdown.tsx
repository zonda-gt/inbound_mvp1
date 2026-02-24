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
    <h1 className="mt-12 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-12 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-9 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mt-5 text-[1rem] leading-8 text-slate-700 md:text-[1.125rem]">
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-[#2563EB] underline decoration-[#93c5fd] decoration-2 underline-offset-4 hover:text-[#1d4ed8]"
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
            : "my-6 list-disc space-y-2 pl-6 text-[1rem] leading-8 text-slate-700 md:text-[1.125rem]"
        }
        {...props}
      >
        {children}
      </ul>
    );
  },
  ol: ({ children, ...props }) => (
    <ol
      className="my-6 list-decimal space-y-2 pl-6 text-[1rem] leading-8 text-slate-700 md:text-[1.125rem]"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => {
    const taskItem = containsCheckbox(children);
    return (
      <li className={taskItem ? "flex items-start gap-3 text-[1rem] leading-8 text-slate-700 md:text-[1.125rem]" : ""} {...props}>
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
        className="mt-2 h-4 w-4 rounded border-slate-300 accent-[#2563EB]"
      />
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="mt-7 rounded-r-xl border-l-4 border-[#2563EB] bg-blue-50/70 px-4 py-3 text-[1rem] leading-8 text-slate-700 md:text-[1.125rem]">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full border-collapse text-left text-sm sm:text-base">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-slate-200">{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 align-top text-sm leading-7 text-slate-700 sm:text-base">
      {children}
    </td>
  ),
  pre: ({ children }) => (
    <pre className="my-7 overflow-x-auto rounded-xl bg-slate-900 px-4 py-4 text-sm leading-6 text-slate-100">
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
        className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800"
        {...props}
      >
        {children}
      </code>
    );
  },
  hr: () => <hr className="my-12 border-slate-200" />,
};

export default function BlogMarkdown({ content }: BlogMarkdownProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}
