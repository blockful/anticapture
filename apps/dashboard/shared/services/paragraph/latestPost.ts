// Reader for the blockful publication on Paragraph. Paragraph exposes no JSON
// API for a blog's posts, so the newest publication is taken from the public
// RSS 2.0 feed. Server-only: the feed host rejects browser origins.

const FEED_URL = "https://api.paragraph.com/blogs/rss/@blockful";

/** Revalidate window for the feed, in seconds. Posts ship a few times a month. */
const REVALIDATE_SECONDS = 3600;

export type ParagraphPost = {
  title: string;
  url: string;
};

/**
 * Rendered when the feed is unreachable so the ticker never ships an empty
 * strip. Points at the publication index, which always resolves.
 */
export const PARAGRAPH_PUBLICATION: ParagraphPost = {
  title: "Research that maps DAO governance risks and capture vectors",
  url: "https://paragraph.com/@blockful",
};

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
};

const decode = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(
      /&(?:amp|lt|gt|quot|apos|#39);/g,
      (entity) => HTML_ENTITIES[entity],
    )
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();

const readTag = (item: string, tag: string) => {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? decode(match[1]) : "";
};

/**
 * Newest post on the blockful publication. Falls back to the publication index
 * on any transport, status or parse failure — the panel ticker must render.
 */
export const getLatestParagraphPost = async (): Promise<ParagraphPost> => {
  try {
    const response = await fetch(FEED_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) return PARAGRAPH_PUBLICATION;

    const feed = await response.text();
    const [item] = feed.match(/<item[^>]*>[\s\S]*?<\/item>/) ?? [];
    if (!item) return PARAGRAPH_PUBLICATION;

    const title = readTag(item, "title");
    const url = readTag(item, "link") || readTag(item, "guid");

    return title && url.startsWith("http")
      ? { title, url }
      : PARAGRAPH_PUBLICATION;
  } catch {
    return PARAGRAPH_PUBLICATION;
  }
};
