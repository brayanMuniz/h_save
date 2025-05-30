import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Doujinshi } from "../types";

import CoverImage from "./CoverImage";

import { getLanguageFlag } from "../utils/utils"

type Props = {
  id: number;
  characters: string[];
  parodies: string[];
  tags: string[];
};

const SimilarDoujinshi: React.FC<Props> = ({ id, characters, parodies, tags }) => {
  const [suggestions, setSuggestions] = useState<Doujinshi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/doujinshi/${id}/similar/metadata`)
      .then((res) => res.json())
      .then((d) => {
        const all = d.similarDoujins || [];
        // Priority: characters > parodies > tags

        const byChar = all.filter((dj: Doujinshi) =>
          (dj.Characters ?? []).some((c) => characters.includes(c))
        );
        const byParody = all.filter(
          (dj: Doujinshi) =>
            !byChar.includes(dj) && (dj.Parodies ?? []).some((p) => parodies.includes(p))
        );
        const byTag = all.filter(
          (dj: Doujinshi) =>
            !byChar.includes(dj) &&
            !byParody.includes(dj) &&
            (dj.Tags ?? []).some((t) => tags.includes(t))
        );

        setSuggestions([...byChar, ...byParody, ...byTag]);
        setLoading(false);
      });
  }, [id, characters, parodies, tags]);

  if (loading) return <span className="text-gray-400">Loading suggestions...</span>;

  return (

    <div className="flex flex-wrap gap-2">
      {suggestions.map((d) => (
        <Link
          key={d.ID}
          to={`/doujinshi/${d.ID}`}
          className="block"
          style={{ width: "14rem" }} // Adjust width as needed for your grid
        >
          <CoverImage
            imgUrl={d.thumbnail_url}
            flag={getLanguageFlag(d.Languages)}
            title={d.Title}
            characters={d.Characters ?? []}
            tags={d.Tags ?? []}
            parodies={d.Parodies ?? []}
            oCount={0} // NOTE: for now using 0 
          // rating={d.rating}
          />
        </Link>
      ))}
      {suggestions.length === 0 && (
        <span className="text-gray-400">No suggestions found.</span>
      )}
    </div>


  );
};

export default SimilarDoujinshi;
