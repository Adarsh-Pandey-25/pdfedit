export type InlineRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
};

export type RichText = InlineRun[];

export type ContentBlock =
  | {
      type: "h1" | "h2" | "h3" | "paragraph" | "quote";
      content: RichText;
    }
  | {
      type: "bullet-list" | "numbered-list";
      content: RichText[];
    }
  | {
      type: "code";
      content: string;
    }
  | {
      type: "divider" | "spacer";
      content: "";
    };

export function plainRichText(text: string): RichText {
  return text ? [{ text }] : [];
}

export function richTextValue(value: string | RichText): RichText {
  return typeof value === "string" ? plainRichText(value) : value;
}

/**
 * Normalize line/control characters without destroying supported Unicode
 * punctuation. Inter handles arrows, bullets, em/en dashes and smart quotes.
 */
export function normalizePdfText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b\u200c\u200d\u2060\ufeff]/g, "")
    .replace(/\t/g, "    ");
}

function mergeRuns(runs: RichText): RichText {
  const merged: RichText = [];
  for (const run of runs) {
    const text = normalizePdfText(run.text);
    if (!text) continue;
    const prev = merged[merged.length - 1];
    if (
      prev &&
      Boolean(prev.bold) === Boolean(run.bold) &&
      Boolean(prev.italic) === Boolean(run.italic) &&
      Boolean(prev.code) === Boolean(run.code)
    ) {
      prev.text += text;
    } else {
      merged.push({ ...run, text });
    }
  }
  return merged;
}

function inlineRuns(
  node: Node,
  inherited: Omit<InlineRun, "text"> = {}
): RichText {
  if (node.nodeType === Node.TEXT_NODE) {
    return [{ text: node.textContent || "", ...inherited }];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const el = node as HTMLElement;
  const tag = el.tagName;
  const style = {
    bold:
      inherited.bold ||
      tag === "STRONG" ||
      tag === "B" ||
      /^(bold|[6-9]00)$/i.test(el.style.fontWeight),
    italic:
      inherited.italic ||
      tag === "EM" ||
      tag === "I" ||
      el.style.fontStyle === "italic",
    code: inherited.code || tag === "CODE" || tag === "KBD",
  };

  const runs = Array.from(el.childNodes).flatMap((child) =>
    inlineRuns(child, style)
  );
  if (tag === "BR") runs.push({ text: "\n", ...style });
  return mergeRuns(runs);
}

function directListItems(el: Element): Element[] {
  return Array.from(el.children).filter((child) => child.tagName === "LI");
}

function blockFromElement(el: Element): ContentBlock[] {
  const tag = el.tagName;
  const rich = mergeRuns(inlineRuns(el));
  const text = rich.map((run) => run.text).join("").trim();

  if (tag === "HR") return [{ type: "divider", content: "" }];
  if (!text && tag !== "PRE" && tag !== "CODE") return [];

  if (tag === "H1") return [{ type: "h1", content: rich }];
  if (tag === "H2") return [{ type: "h2", content: rich }];
  if (tag === "H3" || tag === "H4" || tag === "H5" || tag === "H6") {
    return [{ type: "h3", content: rich }];
  }
  if (tag === "BLOCKQUOTE") return [{ type: "quote", content: rich }];
  if (tag === "PRE" || tag === "CODE") {
    return [{ type: "code", content: normalizePdfText(el.textContent || "") }];
  }
  if (tag === "UL" || tag === "OL") {
    const items = directListItems(el)
      .map((li) => mergeRuns(inlineRuns(li)))
      .filter((item) => item.length > 0);
    return [
      {
        type: tag === "UL" ? "bullet-list" : "numbered-list",
        content: items,
      },
    ];
  }

  // Mammoth may wrap content in tables/divs. Preserve their child block
  // structure instead of flattening all hierarchy into one paragraph.
  if (tag === "DIV" || tag === "SECTION" || tag === "ARTICLE" || tag === "TABLE") {
    const nested = Array.from(el.children).flatMap(blockFromElement);
    if (nested.length) return nested;
  }

  return [{ type: "paragraph", content: rich }];
}

/** Parse Mammoth HTML while preserving headings, lists and inline emphasis. */
export function parseWordContent(html: string): ContentBlock[] {
  if (typeof DOMParser === "undefined") {
    throw new Error("Word content parsing requires a browser.");
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return Array.from(doc.body.children).flatMap(blockFromElement);
}

function parseInlineMarkdown(text: string): RichText {
  const runs: RichText = [];
  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  let cursor = 0;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const index = match.index;
    if (index > cursor) runs.push({ text: text.slice(cursor, index) });
    const token = match[0];
    if (token.startsWith("***")) {
      runs.push({ text: token.slice(3, -3), bold: true, italic: true });
    } else if (token.startsWith("**") || token.startsWith("__")) {
      runs.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith("`")) {
      runs.push({ text: token.slice(1, -1), code: true });
    } else {
      runs.push({ text: token.slice(1, -1), italic: true });
    }
    cursor = index + token.length;
  }
  if (cursor < text.length) runs.push({ text: text.slice(cursor) });
  return mergeRuns(runs);
}

/**
 * Parse plain text with Markdown-like headings/emphasis, lists, quotes and
 * fenced code. Consecutive non-empty body lines become one paragraph.
 */
export function parseTextContent(text: string): ContentBlock[] {
  const lines = normalizePdfText(text).split("\n");
  const blocks: ContentBlock[] = [];
  let paragraph: string[] = [];
  let list: RichText[] = [];
  let listType: "bullet-list" | "numbered-list" | null = null;
  let code: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({
      type: "paragraph",
      content: parseInlineMarkdown(paragraph.join(" ")),
    });
    paragraph = [];
  };
  const flushList = () => {
    if (listType && list.length) blocks.push({ type: listType, content: list });
    list = [];
    listType = null;
  };

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();
      if (code) {
        blocks.push({ type: "code", content: code.join("\n") });
        code = null;
      } else {
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(raw);
      continue;
    }
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: heading[1].length === 1 ? "h1" : heading[1].length === 2 ? "h2" : "h3",
        content: parseInlineMarkdown(heading[2]),
      });
      continue;
    }

    if (
      trimmed.length > 3 &&
      trimmed.length < 90 &&
      trimmed === trimmed.toUpperCase() &&
      /[A-Z]/.test(trimmed) &&
      !/^\d/.test(trimmed)
    ) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h2", content: parseInlineMarkdown(trimmed) });
      continue;
    }

    const numbered = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (numbered) {
      flushParagraph();
      if (listType && listType !== "numbered-list") flushList();
      listType = "numbered-list";
      list.push(parseInlineMarkdown(numbered[1]));
      continue;
    }

    const bullet = /^[-*•→]\s+(.+)$/.exec(trimmed);
    if (bullet) {
      flushParagraph();
      if (listType && listType !== "bullet-list") flushList();
      listType = "bullet-list";
      list.push(parseInlineMarkdown(bullet[1]));
      continue;
    }

    if (/^[-=_]{3,}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "divider", content: "" });
      continue;
    }

    const quote = /^>\s*(.+)$/.exec(trimmed);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", content: parseInlineMarkdown(quote[1]) });
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  if (code) blocks.push({ type: "code", content: code.join("\n") });
  return blocks;
}

