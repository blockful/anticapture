export const encodeDescription = (
  title: string,
  discussionUrl: string,
  body: string,
): string => {
  return `# ${title}\n\n${discussionUrl}\n\n${body}`;
};
