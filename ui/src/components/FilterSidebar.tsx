import { useMemo, useState, useRef } from "react";
import type { BrowseFilters, FilterType, SavedFilter } from "../types";
import type { Doujinshi } from "../types";
import RangeSlider from "./RangeSlider";
import TagSelectorModal from "./TagSelectorModal";

interface Props {
  filters: BrowseFilters;
  setFilters: (filters: BrowseFilters) => void;
  doujinshi?: Doujinshi[];
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  savedFilters: SavedFilter[];
  onSaveFilter: () => void;
  onLoadFilter: (filters: BrowseFilters) => void;
  onDeleteFilter: (id: number) => void;
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
  savedFilters,
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
}: Props) => {
  const [activeModal, setActiveModal] = useState<{
    type: FilterType;
    title: string;
    placeholder: string;
  } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const availableTags = useMemo(() => {
    const safeFilter = (items: string[]) =>
      [...new Set(items.filter((item) => item != null && item.trim() !== ""))].sort();
    return {
      tags: safeFilter(doujinshi.flatMap((d) => d.tags || [])),
      artists: safeFilter(doujinshi.flatMap((d) => d.artists || [])),
      characters: safeFilter(doujinshi.flatMap((d) => d.characters || [])),
      parodies: safeFilter(doujinshi.flatMap((d) => d.parodies || [])),
      groups: safeFilter(doujinshi.flatMap((d) => d.groups || [])),
    };
  }, [doujinshi]);

  const updateFilterGroup = (type: FilterType, filterGroup: any) =>
    setFilters({ ...filters, [type]: filterGroup });
  const toggleLanguage = (langCode: string) => {
    if (langCode === "all") {
      setFilters({ ...filters, languages: ["all"] });
    } else {
      const currentLangs = filters.languages.filter((l) => l !== "all");
      const newLangs = currentLangs.includes(langCode)
        ? currentLangs.filter((l) => l !== langCode)
        : [...currentLangs, langCode];
      setFilters({
        ...filters,
        languages: newLangs.length === 0 ? ["all"] : newLangs,
      });
    }
  };
  const openModal = (
    type: FilterType,
    title: string,
    placeholder: string,
  ) => setActiveModal({ type, title, placeholder });
  const closeModal = () => setActiveModal(null);
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
        <div className="p-4 border-b border-gray-700 space-y-3">
          <h2 className="text-xl font-bold">Browse</h2>

          <div className="relative">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span>💾</span>
              <span>Saved Filters</span>
            </h3>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none flex justify-between items-center"
            >
              <span>Select a filter...</span>
              <span
                className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""
                  }`}
              >
                ▼
              </span>
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {savedFilters.length > 0 ? (
                  savedFilters.map((saved) => (
                    <div
                      key={saved.id}
                      className="p-2 flex justify-between items-center hover:bg-gray-600"
                    >
                      <button
                        onClick={() => {
                          onLoadFilter(saved.filters);
                          setIsDropdownOpen(false);
                        }}
                        className="text-left flex-1"
                      >
                        {saved.name}
                      </button>
                      <button
                        onClick={() => onDeleteFilter(saved.id)}
                        className="text-red-400 hover:text-red-300 text-lg p-1"
                        title="Delete filter"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-400 text-sm">
                    No saved filters.
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onSaveFilter}
            className="w-full p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-semibold"
          >
            Save Current Filter
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <input
            type="text"
            placeholder="Search titles..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
          />

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
              <option value="random">Random</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-700 hover:bg-gray-600 rounded transition">
              <input
                type="checkbox"
                checked={filters.currentlyReading}
                onChange={(e) =>
                  setFilters({ ...filters, currentlyReading: e.target.checked })
                }
                className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
              />
              <span className="text-lg font-semibold flex items-center gap-2">
                📖 Show In Progress
              </span>
            </label>
          </div>
          {[
            { key: "tags", icon: "🏷️", title: "Tags", placeholder: "Search tags..." },
            { key: "artists", icon: "🎨", title: "Artists", placeholder: "Search artists..." },
            { key: "characters", icon: "🧑‍🎤", title: "Characters", placeholder: "Search characters..." },
            { key: "parodies", icon: "🎭", title: "Parodies", placeholder: "Search parodies..." },
            { key: "groups", icon: "👥", title: "Groups", placeholder: "Search groups..." },
          ].map((category) => (
            <div key={category.key}>
              <button
                ref={(el) => {
                  buttonRefs.current[category.key] = el;
                }}
                onClick={() =>
                  openModal(
                    category.key as FilterType,
                    category.title,
                    category.placeholder,
                  )
                }
                className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-semibold">{category.title}</span>
                  {renderTagCount(filters[category.key as FilterType])}
                </div>
                <span className="text-gray-400">›</span>
              </button>
            </div>
          ))}
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
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>📖</span>
              <span>Page Count Range</span>
            </h3>
            <RangeSlider
              min={0}
              max={Math.max(
                100,
                ...doujinshi.map((d) => parseInt(d.pages, 10) || 0),
              )}
              value={filters.pageCount}
              onChange={(pageCount) => setFilters({ ...filters, pageCount })}
              step={10}
              label="Pages"
            />
          </div>
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
                  className={`px-3 py-1 rounded flex items-center gap-1 text-sm transition ${filters.languages.includes(lang.code)
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
