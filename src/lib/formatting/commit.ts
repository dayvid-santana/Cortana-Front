const SHORT_HASH_LENGTH = 7;

export function shortHash(commitHash: string): string {
  return commitHash.slice(0, SHORT_HASH_LENGTH);
}

/** First line of a commit message, trimmed to a display-friendly length. */
export function commitSubject(message: string, maxLength = 72): string {
  const firstLine = message.split("\n")[0]?.trim() ?? "";
  if (firstLine.length <= maxLength) {
    return firstLine;
  }
  return `${firstLine.slice(0, maxLength - 1)}…`;
}
