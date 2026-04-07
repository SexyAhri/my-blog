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

const allowedTagSet = new Set(allowedTags);
const allowedAttributeSet = new Set(allowedAttributes);
const forbiddenTags = [
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
];
const forbiddenTagSet = new Set(forbiddenTags);

function escapeAttributeValue(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isSafeAttributeValue(name: string, value: string): boolean {
  if (name === "href") {
    return /^(#|\/|\.{1,2}\/|https?:|mailto:|tel:)/i.test(value);
  }

  if (name === "src") {
    return /^(\/|\.{1,2}\/|https?:|data:image\/)/i.test(value);
  }

  return true;
}

function sanitizeTag(tag: string): string {
  const match = tag.match(/^<\s*(\/?)\s*([a-zA-Z0-9-]+)([^>]*)>$/);
  if (!match) {
    return "";
  }

  const isClosing = match[1] === "/";
  const tagName = match[2].toLowerCase();

  if (!allowedTagSet.has(tagName) || forbiddenTagSet.has(tagName)) {
    return "";
  }

  if (isClosing) {
    return `</${tagName}>`;
  }

  const attributes = match[3] ?? "";
  const sanitizedAttributes: string[] = [];
  const attrRegex =
    /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const attrMatch of attributes.matchAll(attrRegex)) {
    const rawName = attrMatch[1];
    const rawValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4];

    if (!rawName || rawValue === undefined) {
      continue;
    }

    const name = rawName.toLowerCase();
    const value = rawValue.trim();

    if (
      !allowedAttributeSet.has(name) ||
      name === "style" ||
      name.startsWith("on") ||
      !isSafeAttributeValue(name, value)
    ) {
      continue;
    }

    sanitizedAttributes.push(`${name}="${escapeAttributeValue(value)}"`);
  }

  if (
    tagName === "a" &&
    sanitizedAttributes.some((attr) => attr === 'target="_blank"') &&
    !sanitizedAttributes.some((attr) => attr.startsWith("rel="))
  ) {
    sanitizedAttributes.push('rel="noopener noreferrer"');
  }

  const serializedAttributes =
    sanitizedAttributes.length > 0 ? ` ${sanitizedAttributes.join(" ")}` : "";

  return `<${tagName}${serializedAttributes}>`;
}

export function sanitizeRichContent(content: string): string {
  let sanitized = content.replace(/<!--[\s\S]*?-->/g, "");

  for (const tag of forbiddenTags) {
    const pairPattern = new RegExp(
      `<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`,
      "gi",
    );
    const singlePattern = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
    sanitized = sanitized.replace(pairPattern, "");
    sanitized = sanitized.replace(singlePattern, "");
  }

  return sanitized.replace(/<[^>]*>/g, (tag) => sanitizeTag(tag));
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
