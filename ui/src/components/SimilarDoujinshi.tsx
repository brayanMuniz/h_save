import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Doujinshi } from "../types";

type Props = {
  galleryId: string;
  characters: string[];
  parodies: string[];
  tags: string[];
};

const SimilarDoujinshi: React.FC<Props> = ({ galleryId, characters, parodies, tags }) => {
  const [suggestions, setSuggestions] = useState<Doujinshi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/doujinshi/${galleryId}/similar/metadata`)
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
  }, [galleryId, characters, parodies, tags]);

  if (loading) return <span className="text-gray-400">Loading suggestions...</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((d) => (
        <Link
          key={d.GalleryID}
          to={`/doujinshi/${d.GalleryID}`}
          className="block"
        >
          <img
            src={d.thumbnail_url}
            alt={d.Title}
            className="w-25 h-40 object-cover rounded bg-gray-700 
            hover:ring-2 hover:ring-indigo-400 transition"
          />
          <div className="text-xs text-gray-300 truncate w-20">{d.Title}</div>
        </Link>
      ))}
      {suggestions.length === 0 && (
        <span className="text-gray-400">No suggestions found.</span>
      )}
    </div>
  );
};

export default SimilarDoujinshi;

