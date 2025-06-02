import { useMemo } from "react";

import type { BrowseFilters, FilterType } from "../types";
import type { Doujinshi } from "../types";

import TagSelector from "./TagSelector";
import RangeSlider from "./RangeSlider";

interface Props {
  filters: BrowseFilters;
  setFilters: (filters: BrowseFilters) => void;
  doujinshi?: Doujinshi[];
  sortBy: string;
  setSortBy: (sortBy: string) => void;
}

const languages = [
  { code: "all", label: "All", flag: "🌐" },
  { code: "japanese", label: "Japanese", flag: "🇯🇵" },
  { code: "english", label: "English", flag: "🇺🇸" },
  { code: "chinese", label: "Chinese", flag: "🇨🇳" },
];

const FilterSidebar = ({ filters, setFilters, doujinshi = [], sortBy, setSortBy }: Props) => {
  const availableTags = useMemo(() => {
    const safeFilter = (items: string[]) =>
      [...new Set(items.filter(item => item != null && item.trim() !== ""))].sort();

    return {
      tags: safeFilter(doujinshi.flatMap(d => d.tags || [])),
      artists: safeFilter(doujinshi.flatMap(d => d.artists || [])),
      characters: safeFilter(doujinshi.flatMap(d => d.characters || [])),
      parodies: safeFilter(doujinshi.flatMap(d => d.parodies || [])),
      groups: safeFilter(doujinshi.flatMap(d => d.groups || [])),
    };
  }, [doujinshi]);

  const updateFilterGroup = (type: FilterType, filterGroup: any) => {
    setFilters({
      ...filters,
      [type]: filterGroup,
    });
  };

  const toggleLanguage = (langCode: string) => {
    if (langCode === "all") {
      setFilters({ ...filters, languages: ["all"] });
    } else {
      const currentLangs = filters.languages.filter(l => l !== "all");
      if (currentLangs.includes(langCode)) {
        const newLangs = currentLangs.filter(l => l !== langCode);
        setFilters({
          ...filters,
          languages: newLangs.length === 0 ? ["all"] : newLangs
        });
      } else {
        setFilters({ ...filters, languages: [...currentLangs, langCode] });
      }
    }
  };

  return (
    <aside className="w-80 h-screen bg-gray-800 text-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">Browse</h2>
        <input
          type="text"
          placeholder="Search titles..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-full mt-2 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Scrollable Filter Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Sort By */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>📊</span>
            <span>Sort By</span>
          </h3>
          <select
            value={sortBy}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="uploaded">Recently Uploaded</option>
            <option value="title">Title A-Z</option>
            <option value="rating">Rating (High to Low)</option>
            <option value="ocount">oCount (High to Low)</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🏷️</span>
            <span>Tags</span>
          </h3>
          <TagSelector
            availableTags={availableTags.tags}
            filterGroup={filters.tags}
            onChange={(fg) => updateFilterGroup("tags", fg)}
            placeholder="Search tags..."
          />
        </div>

        {/* Artists */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🎨</span>
            <span>Artists</span>
          </h3>
          <TagSelector
            availableTags={availableTags.artists}
            filterGroup={filters.artists}
            onChange={(fg) => updateFilterGroup("artists", fg)}
            placeholder="Search artists..."
          />
        </div>

        {/* Characters */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🧑‍🎤</span>
            <span>Characters</span>
          </h3>
          <TagSelector
            availableTags={availableTags.characters}
            filterGroup={filters.characters}
            onChange={(fg) => updateFilterGroup("characters", fg)}
            placeholder="Search characters..."
          />
        </div>

        {/* Parodies */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🎭</span>
            <span>Parodies</span>
          </h3>
          <TagSelector
            availableTags={availableTags.parodies}
            filterGroup={filters.parodies}
            onChange={(fg) => updateFilterGroup("parodies", fg)}
            placeholder="Search parodies..."
          />
        </div>

        {/* Groups */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>👥</span>
            <span>Groups</span>
          </h3>
          <TagSelector
            availableTags={availableTags.groups}
            filterGroup={filters.groups}
            onChange={(fg) => updateFilterGroup("groups", fg)}
            placeholder="Search groups..."
          />
        </div>

        {/* Rating Range */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>⭐</span>
            <span>Rating Range</span>
          </h3>
          <RangeSlider
            min={0}
            max={5}
            value={filters.rating}
            onChange={(rating) => setFilters({ ...filters, rating })}
            step={1}
            label="Rating"
          />
        </div>

        {/* oCount Range */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>💖</span>
            <span>oCount Range</span>
          </h3>
          <RangeSlider
            min={0}
            max={Math.max(50, ...doujinshi.map(d => d.oCount))}
            value={filters.oCount}
            onChange={(oCount) => setFilters({ ...filters, oCount })}
            step={5}
            label="oCount"
          />
        </div>

        {/* Language */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🌐</span>
            <span>Language</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={`px-3 py-1 rounded flex items-center gap-1 text-sm transition
                  ${filters.languages.includes(lang.code)
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-700 hover:bg-indigo-600"
                  }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
