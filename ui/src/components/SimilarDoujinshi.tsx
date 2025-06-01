import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Doujinshi } from "../types";

import CoverImage from "./CoverImage";
import { getLanguageFlag } from "../utils/utils";

type Props = {
  id: number;
  filterState: {
    characters: { ordered: string[]; excluded: Set<string> };
    parodies: { ordered: string[]; excluded: Set<string> };
    tags: { ordered: string[]; excluded: Set<string> };
  };
};

interface ScoredDoujin {
  doujin: Doujinshi;
  score: number;
  hasMatch: boolean;
}

const SimilarDoujinshi: React.FC<Props> = ({ id, filterState }) => {
  const [suggestions, setSuggestions] = useState<Doujinshi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/doujinshi/${id}/similar/metadata`)
      .then((res) => res.json())
      .then((d) => {
        const allDoujins = d.similarDoujins || [];

        // Get active (non-excluded) items in order
        const activeCharacters = filterState.characters.ordered.filter(
          char => !filterState.characters.excluded.has(char)
        );
        const activeParodies = filterState.parodies.ordered.filter(
          parody => !filterState.parodies.excluded.has(parody)
        );
        const activeTags = filterState.tags.ordered.filter(
          tag => !filterState.tags.excluded.has(tag)
        );

        // If all categories are excluded, show nothing
        if (activeCharacters.length === 0 && activeParodies.length === 0 && activeTags.length === 0) {
          setSuggestions([]);
          setLoading(false);
          return;
        }

        // In SimilarDoujinshi.tsx, replace the scoring logic:
        const scoredDoujins: ScoredDoujin[] = allDoujins.map((doujin: Doujinshi) => {
          let score = 0;
          let hasMatch = false;

          // Safely get arrays, ensuring they exist
          const doujinCharacters = Array.isArray(doujin.characters)
            ? doujin.characters
            : [];
          const doujinParodies = Array.isArray(doujin.parodies)
            ? doujin.parodies
            : [];
          const doujinTags = Array.isArray(doujin.tags)
            ? doujin.tags
            : [];

          // Check characters (highest priority)
          activeCharacters.forEach((char, index) => {
            if (doujinCharacters.includes(char)) {
              hasMatch = true;
              score += 1000 - index;
            }
          });

          // Check parodies (medium priority)
          activeParodies.forEach((parody, index) => {
            if (doujinParodies.includes(parody)) {
              hasMatch = true;
              score += 500 - index;
            }
          });

          // Check tags (lower priority)
          activeTags.forEach((tag, index) => {
            if (doujinTags.includes(tag)) {
              hasMatch = true;
              score += 100 - index;
            }
          });

          return { doujin, score, hasMatch };
        });


        // Filter out doujins that don't match any active criteria
        const filtered = scoredDoujins
          .filter(({ hasMatch }: ScoredDoujin) => hasMatch)
          .sort((a: ScoredDoujin, b: ScoredDoujin) => b.score - a.score) // Sort by score descending
          .map(({ doujin }: ScoredDoujin) => doujin);

        setSuggestions(filtered);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching similar doujins:', error);
        setSuggestions([]);
        setLoading(false);
      });
  }, [id, filterState]);

  if (loading) return <span className="text-gray-400">Loading suggestions...</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((d) => (
        <Link
          key={d.id}
          to={`/doujinshi/${d.id}`}
          className="block"
          style={{ width: "14rem" }}
        >
          <CoverImage
            imgUrl={d.thumbnail_url}
            flag={getLanguageFlag(d.languages)}
            title={d.title}
            characters={d.characters ?? []}
            tags={d.tags ?? []}
            parodies={d.parodies ?? []}
            oCount={d.oCount}
            rating={d.progress?.rating ?? 0}
          />
        </Link>
      ))}
      {suggestions.length === 0 && (
        <span className="text-gray-400">
          {filterState.characters.excluded.size +
            filterState.parodies.excluded.size +
            filterState.tags.excluded.size > 0
            ? "No suggestions match the current filters."
            : "No suggestions found."}
        </span>
      )}
    </div>
  );
};

export default SimilarDoujinshi;
