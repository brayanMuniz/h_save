import React, { useState } from "react";
import { Link } from "react-router-dom";

type FilterSectionProps = {
  label: string;
  items: string[];
  excluded: Set<string>;
  setExcluded: React.Dispatch<React.SetStateAction<Set<string>>>;
  color: string;
};

const FilterSection: React.FC<FilterSectionProps> = ({
  label, items, excluded, setExcluded, color
}) => (
  <div className="mb-4">
    <div className="font-bold mb-2">{label}</div>
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          onClick={() =>
            setExcluded((prev) => {
              const newSet = new Set(prev);
              if (newSet.has(item)) newSet.delete(item);
              else newSet.add(item);
              return newSet;
            })
          }
          className={`px-3 py-1 rounded border transition
            ${excluded.has(item)
              ? "bg-gray-700 text-gray-400 border-gray-500 line-through"
              : `${color} text-white border-white`
            }`}
        >
          {item}
        </button>
      ))}
    </div>
  </div>
);



type DoujinOverviewFilterProps = {
  characters: string[];
  parodies: string[];
  tags: string[];
};

const DoujinOverviewFilter: React.FC<DoujinOverviewFilterProps> = ({
  characters, parodies, tags
}) => {
  const [excludedChars, setExcludedChars] = useState<Set<string>>(new Set());
  const [excludedParodies, setExcludedParodies] = useState<Set<string>>(new Set());
  const [excludedTags, setExcludedTags] = useState<Set<string>>(new Set());

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col sticky top-0 h-screen bg-gray-800 rounded-lg p-4 text-gray-200">
      <Link
        to="/"
        className="mb-8 text-2xl font-bold text-white hover:text-indigo-400 transition"
        aria-label="Back to Home"
        title="Back to Home"
      >
        Ecchi
      </Link>
      <div className="flex-1 overflow-y-auto">
        <FilterSection
          label="Characters"
          items={characters}
          excluded={excludedChars}
          setExcluded={setExcludedChars}
          color="bg-green-700"
        />
        <FilterSection
          label="Parodies"
          items={parodies}
          excluded={excludedParodies}
          setExcluded={setExcludedParodies}
          color="bg-yellow-700"
        />
        <FilterSection
          label="Tags"
          items={tags}
          excluded={excludedTags}
          setExcluded={setExcludedTags}
          color="bg-indigo-700"
        />
      </div>
    </aside>
  );
};

export default DoujinOverviewFilter;
