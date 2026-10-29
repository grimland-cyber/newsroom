import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "code",
  "pre",
  "hr",
  "span",
  "img",
];

/**
 * Allowlist sanitizer for press-release HTML.
 * Keeps TipTap output (and the tags already stored from imported articles)
 * and drops scripts, event handlers, and unsafe URLs.
 */
export function sanitizeReleaseHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      li: ["style"],
      span: ["style"],
      blockquote: ["style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    enforceHtmlBoundary: false,
    disallowedTagsMode: "discard",
    transformTags: {
      a: (_tagName, attribs) => {
        const next: sanitizeHtml.Attributes = {};
        if (attribs.href) next.href = attribs.href;
        if (attribs.target === "_blank") {
          next.target = "_blank";
          next.rel = "noopener noreferrer";
        }
        return { tagName: "a", attribs: next };
      },
      img: (_tagName, attribs) => {
        const src = attribs.src ?? "";
        const safe = /^(https?:\/\/|data:image\/(?:jpeg|jpg|png|gif|webp);base64,)/i.test(
          src
        );
        if (!safe) return { tagName: "img", attribs: {} };
        const next: sanitizeHtml.Attributes = { src };
        if (attribs.alt) next.alt = attribs.alt;
        return { tagName: "img", attribs: next };
      },
    },
  });
}

/** Media links are admin-supplied. Only http(s) URLs are rendered as hrefs. */
export function safeMediaHref(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return url;
  } catch {
    return "#";
  }
  return "#";
}
