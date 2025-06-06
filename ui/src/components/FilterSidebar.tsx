import { useMemo, useState, useRef } from "react";

import type { BrowseFilters, FilterType } from "../types";
import type { Doujinshi } from "../types";

import RangeSlider from "./RangeSlider";
import TagSelectorModal from "./TagSelectorModal";

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

const FilterSidebar = ({
  filters,
  setFilters,
  doujinshi = [],
  sortBy,
  setSortBy,
}: Props) => {
  const [activeModal, setActiveModal] = useState<{
    type: FilterType;
    title: string;
    placeholder: string;
  } | null>(null);

  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const availableTags = useMemo(() => {
    const safeFilter = (items: string[]) =>
      [
        ...new Set(
          items.filter((item) => item != null && item.trim() !== "")
        ),
      ].sort();

    return {
      tags: safeFilter(doujinshi.flatMap((d) => d.tags || [])),
      artists: safeFilter(doujinshi.flatMap((d) => d.artists || [])),
      characters: safeFilter(doujinshi.flatMap((d) => d.characters || [])),
      parodies: safeFilter(doujinshi.flatMap((d) => d.parodies || [])),
      groups: safeFilter(doujinshi.flatMap((d) => d.groups || [])),
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
      const currentLangs = filters.languages.filter((l) => l !== "all");
      if (currentLangs.includes(langCode)) {
        const newLangs = currentLangs.filter((l) => l !== langCode);
        setFilters({
          ...filters,
          languages: newLangs.length === 0 ? ["all"] : newLangs,
        });
      } else {
        setFilters({ ...filters, languages: [...currentLangs, langCode] });
      }
    }
  };

  const openModal = (
    type: FilterType,
    title: string,
    placeholder: string
  ) => {
    setActiveModal({ type, title, placeholder });
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const renderTagCount = (filterGroup: any) => {
    const total = filterGroup.included.length + filterGroup.excluded.length;
    return total > 0 ? (
      <span className="ml-2 px-2 py-1 text-xs bg-indigo-500 text-white rounded">
        {total}
      </span>
    ) : null;
  };

  return (
    <div className="relative">
      <aside className="sticky top-0 w-80 h-screen bg-gray-800 text-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Browse</h2>
          <input
            type="text"
            placeholder="Search titles..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
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

          {/* Clickable Filter Categories */}
          {[
            {
              key: "tags" as FilterType,
              icon: "🏷️",
              title: "Tags",
              placeholder: "Search tags...",
            },
            {
              key: "artists" as FilterType,
              icon: "🎨",
              title: "Artists",
              placeholder: "Search artists...",
            },
            {
              key: "characters" as FilterType,
              icon: "🧑‍🎤",
              title: "Characters",
              placeholder: "Search characters...",
            },
            {
              key: "parodies" as FilterType,
              icon: "🎭",
              title: "Parodies",
              placeholder: "Search parodies...",
            },
            {
              key: "groups" as FilterType,
              icon: "👥",
              title: "Groups",
              placeholder: "Search groups...",
            },
          ].map((category) => (
            <div key={category.key}>
              <button
                ref={(el) => {
                  buttonRefs.current[category.key] = el;
                }}
                onClick={() =>
                  openModal(category.key, category.title, category.placeholder)
                }
                className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span className="text-lg font-semibold">{category.title}</span>
                  {renderTagCount(filters[category.key])}
                </div>
                <span className="text-gray-400">›</span>
              </button>
            </div>
          ))}

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
              max={Math.max(10, ...doujinshi.map((d) => d.oCount))}
              value={filters.oCount}
              onChange={(oCount) => setFilters({ ...filters, oCount })}
              step={1}
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

      {/* Modal */}
      {activeModal && buttonRefs.current[activeModal.type] && (
        <TagSelectorModal
          isOpen={true}
          onClose={closeModal}
          title={activeModal.title}
          availableTags={availableTags[activeModal.type]}
          filterGroup={filters[activeModal.type]}
          onChange={(filterGroup) =>
            updateFilterGroup(activeModal.type, filterGroup)
          }
          placeholder={activeModal.placeholder}
          anchorRef={{
            current: buttonRefs.current[activeModal.type] as HTMLElement,
          }}
        />
      )}
    </div>
  );
};

export default FilterSidebar;
