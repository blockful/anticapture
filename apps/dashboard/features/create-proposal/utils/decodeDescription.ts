export const decodeDescription = (
  description: string,
): {
  title: string;
  discussionUrl: string;
  body: string;
} => {
  const lines = description.split("\n");
  const titleLine = lines[0] ?? "";
  const title = titleLine.startsWith("# ") ? titleLine.slice(2).trim() : "";

  const rest = lines.slice(1).join("\n").replace(/^\n+/, "");
  const [maybeUrlLine, ...bodyLines] = rest.split("\n\n");
  const discussionUrl = /^https?:\/\//.test(maybeUrlLine ?? "")
    ? (maybeUrlLine ?? "").trim()
    : "";
  const body = discussionUrl
    ? bodyLines.join("\n\n")
    : [maybeUrlLine, ...bodyLines].join("\n\n");

  return { title, discussionUrl, body };
};
