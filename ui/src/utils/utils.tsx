import React from "react";

export function getLanguageFlag(
  languages: string[] | undefined,
): React.ReactNode {
  if (!languages || languages.length === 0) return <span>🏳️</span>;
  const joined = languages.join(" ").toLowerCase();

  if (joined.includes("jap"))
    return (
      <span role="img" aria-label="Japanese">
        🇯🇵
      </span>
    );
  if (joined.includes("eng"))
    return (
      <span role="img" aria-label="English">
        🇺🇸
      </span>
    );
  if (joined.includes("chi"))
    return (
      <span role="img" aria-label="Chinese">
        🇨🇳
      </span>
    );
  if (joined.includes("korean") || joined.includes("kor"))
    return (
      <span role="img" aria-label="Korean">
        🇰🇷
      </span>
    );

  // Fallback: try to find a language word in any entry
  for (const lang of languages) {
    const l = lang.toLowerCase();
    if (l.includes("jap"))
      return (
        <span role="img" aria-label="Japanese">
          🇯🇵
        </span>
      );
    if (l.includes("eng"))
      return (
        <span role="img" aria-label="English">
          🇺🇸
        </span>
      );
    if (l.includes("chi"))
      return (
        <span role="img" aria-label="Chinese">
          🇨🇳
        </span>
      );
    if (l.includes("korean") || l.includes("kor"))
      return (
        <span role="img" aria-label="Korean">
          🇰🇷
        </span>
      );
  }

  // If nothing matches, show white flag
  return <span>🏳️</span>;
}


export const getDisplayTitle = (doujinshi: { title: string; secondTitle: string }): string => {
  return doujinshi.secondTitle && doujinshi.secondTitle.trim() !== ''
    ? doujinshi.secondTitle
    : doujinshi.title;
};
