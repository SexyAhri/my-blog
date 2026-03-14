import DOMPurify from "isomorphic-dompurify";
import { marked, Renderer } from "marked";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

const copyButtonLabel = "Copy";

const renderer = new Renderer();
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang || "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-block-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </span>
      <button class="code-block-copy" type="button" title="${copyButtonLabel}" aria-label="${copyButtonLabel}">${copyButtonLabel}</button>
    </div>
    <pre><code class="language-${language}">${escaped}</code></pre>
  </div>`;
};

const allowedTags = [
  "a",
  "article",
  "blockquote",
  "br",
  "button",
  "code",
  "del",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
];

const allowedAttributes = [
  "alt",
  "aria-label",
  "class",
  "colspan",
  "height",
  "href",
  "id",
  "loading",
  "rel",
  "rowspan",
  "scope",
  "src",
  "target",
  "title",
  "type",
  "width",
];

export function sanitizeRichContent(content: string): string {
  return String(
    DOMPurify.sanitize(content, {
      ALLOWED_ATTR: allowedAttributes,
      ALLOWED_TAGS: allowedTags,
      FORBID_ATTR: ["style"],
      FORBID_TAGS: [
        "embed",
        "form",
        "iframe",
        "input",
        "link",
        "math",
        "meta",
        "object",
        "script",
        "style",
        "svg",
        "textarea",
      ],
    }),
  );
}

export function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  return Math.max(1, Math.ceil(text.length / 500));
}

export function renderRichContent(content: string): {
  html: string;
  toc: TocItem[];
} {
  const tocItems: TocItem[] = [];
  let normalized = content;

  const isWrappedMarkdown =
    /<p>\s*#{1,6}\s/i.test(normalized) ||
    /<p>\s*```/.test(normalized) ||
    /<p>\s*-\s/.test(normalized);

  if (isWrappedMarkdown) {
    normalized = normalized
      .replace(/<p>/gi, "")
      .replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .trim();
  }

  normalized = normalized.replace(/```([\s\S]*?)```/g, (_match, code) => {
    return "```" + code.replace(/<a[^>]*>([^<]*)<\/a>/gi, "$1") + "```";
  });

  const hasRealHtmlStructure =
    /<(h[1-6]|ul|ol|blockquote|pre|table)[^>]*>/i.test(normalized);
  const looksLikeMarkdown =
    /^#{1,6}\s/m.test(normalized) || /```[\s\S]*?```/.test(normalized);
  const shouldParseAsMarkdown = looksLikeMarkdown && !hasRealHtmlStructure;

  let html = shouldParseAsMarkdown
    ? String(
        marked.parse(normalized, {
          breaks: true,
          gfm: true,
          renderer,
        }),
      )
    : normalized;

  if (!shouldParseAsMarkdown) {
    html = html.replace(
      /<pre[^>]*>([\s\S]*?)<\/pre>/gi,
      (match: string, code: string) => {
        return match.replace(
          code,
          code.replace(/<a[^>]*>([^<]*)<\/a>/gi, "$1"),
        );
      },
    );
  }

  let headingIndex = 0;
  html = html.replace(
    /<h([1-3])>(.*?)<\/h\1>/gi,
    (_match: string, level: string, text: string) => {
      const id = `heading-${headingIndex++}`;
      tocItems.push({
        id,
        text: text.replace(/<[^>]*>/g, ""),
        level: parseInt(level, 10),
      });
      return `<h${level} id="${id}">${text}</h${level}>`;
    },
  );

  html = html.replace(/<img /g, '<img loading="lazy" ');

  if (!shouldParseAsMarkdown) {
    html = html.replace(
      /<pre([^>]*)>([\s\S]*?)<\/pre>/gi,
      (_match: string, preAttrs: string, codeContent: string) => {
        return `<div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-dots"><span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span></span>
          <button class="code-block-copy" type="button" title="${copyButtonLabel}" aria-label="${copyButtonLabel}">${copyButtonLabel}</button>
        </div>
        <pre${preAttrs}>${codeContent}</pre>
      </div>`;
      },
    );
  }

  return {
    html: sanitizeRichContent(html),
    toc: tocItems,
  };
}
