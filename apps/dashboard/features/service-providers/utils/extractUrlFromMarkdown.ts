export const extractUrlFromMarkdown = (content: string): string | undefined => {
  const match = content.match(/\[.*?\]\((https?:\/\/[^)]+)\)/);
  return match?.[1];
};
