export const encodeDescription = (
  title: string,
  discussionUrl: string,
  body: string,
): string => {
  const trimmedUrl = discussionUrl.trim();
  if (!trimmedUrl) return `# ${title}\n\n${body}`;
  return `# ${title}\n\n${trimmedUrl}\n\n${body}`;
};
