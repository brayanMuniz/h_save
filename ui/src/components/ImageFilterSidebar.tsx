import { useMemo, useState, useRef } from "react";
import type { ImageBrowseFilters, FilterType, SavedImageFilter, ImageCollection, FilterGroup } from "../types";
import type { Image } from "../types";
import RangeSlider from "./RangeSlider";
import TagSelectorModal from "./TagSelectorModal";

interface Props {
  filters: ImageBrowseFilters;
  setFilters: (filters: ImageBrowseFilters) => void;
  images?: Image[];
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  savedFilters: SavedImageFilter[];
  collections: ImageCollection[];
  onSaveFilter: () => void;
  onLoadFilter: (filters: ImageBrowseFilters) => void;
  onDeleteFilter: (id: number) => void;
  onCreateCollection: (name: string, description?: string) => void;
  onAddToCollection: (collectionId: number, imageIds: number[]) => void;
}

const formats = [
  { code: "all", label: "All Formats" },
  { code: "jpg", label: "JPEG" },
  { code: "png", label: "PNG" },
  { code: "webp", label: "WebP" },
  { code: "gif", label: "GIF" },
];

const ImageFilterSidebar = ({
  filters,
  setFilters,
  images = [],
  sortBy,
  setSortBy,
  savedFilters,
  collections,
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  onCreateCollection,
  onAddToCollection,
}: Props) => {
  const [activeModal, setActiveModal] = useState<{
    type: FilterType | "categories";
    title: string;
    placeholder: string;
  } | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const availableTags = useMemo(() => {
    const safeFilter = (items: string[]) =>
      [...new Set(items.filter((item) => item != null && item.trim() !== ""))].sort();
    return {
      tags: safeFilter(images.flatMap((img) => img.tags || [])),
      artists: safeFilter(images.flatMap((img) => img.artists || [])),
      characters: safeFilter(images.flatMap((img) => img.characters || [])),
      parodies: safeFilter(images.flatMap((img) => img.parodies || [])),
      groups: safeFilter(images.flatMap((img) => img.groups || [])),
      categories: safeFilter(images.flatMap((img) => img.categories || [])),
    };
  }, [images]);

  // Get images rated 4 or 5 for collection creation
  const highRatedImages = useMemo(() => {
    return images.filter(img => img.rating >= 4);
  }, [images]);

  const updateFilterGroup = (type: FilterType | "categories", filterGroup: any) =>
    setFilters({ ...filters, [type]: filterGroup });

  const toggleFormat = (formatCode: string) => {
    if (formatCode === "all") {
      setFilters({ ...filters, formats: [] });
    } else {
      const currentFormats = filters.formats;
      const newFormats = currentFormats.includes(formatCode)
        ? currentFormats.filter((f) => f !== formatCode)
        : [...currentFormats, formatCode];
      setFilters({ ...filters, formats: newFormats });
    }
  };

  const openModal = (
    type: FilterType | "categories",
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

  const handleCreateCollection = () => {
    const name = prompt("Enter collection name:");
    if (!name?.trim()) return;

    const description = prompt("Enter collection description (optional):");
    onCreateCollection(name.trim(), description?.trim() || undefined);
  };

  const handleAddHighRatedToCollection = (collectionId: number) => {
    if (highRatedImages.length === 0) {
      alert("No images with rating 4+ found!");
      return;
    }

    const confirmed = confirm(`Add ${highRatedImages.length} images (rating 4+) to this collection?`);
    if (confirmed) {
      onAddToCollection(collectionId, highRatedImages.map(img => img.id));
    }
  };

  return (
    <div className="fixed left-0 top-0 z-10">
      <aside className="w-80 h-screen bg-gray-800 text-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-700 space-y-3">
          <h2 className="text-xl font-bold">Image Gallery</h2>

          {/* Quick Rating Toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-700 hover:bg-gray-600 rounded transition">
              <input
                type="checkbox"
                checked={filters.unratedOnly}
                onChange={(e) =>
                  setFilters({ ...filters, unratedOnly: e.target.checked })
                }
                className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
              />
              <span className="text-lg font-semibold flex items-center gap-2">
                ⚡ Quick Rating Mode
              </span>
            </label>
            {filters.unratedOnly && (
              <p className="text-xs text-gray-400 mt-1 px-3">
                Showing only unrated images. Use 1-5 keys to rate quickly!
              </p>
            )}
          </div>

          {/* Saved Filters */}
          <div className="relative">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span>💾</span>
              <span>Saved Filters</span>
            </h3>
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none flex justify-between items-center"
            >
              <span>Select a filter...</span>
              <span
                className={`transition-transform ${isFilterDropdownOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {isFilterDropdownOpen && (
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
                          setIsFilterDropdownOpen(false);
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

          {/* Collections */}
          <div className="relative">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span>📁</span>
              <span>Collections</span>
            </h3>
            <button
              onClick={() => setIsCollectionDropdownOpen(!isCollectionDropdownOpen)}
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none flex justify-between items-center"
            >
              <span>Manage collections...</span>
              <span
                className={`transition-transform ${isCollectionDropdownOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {isCollectionDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                <div className="p-2 border-b border-gray-600">
                  <button
                    onClick={handleCreateCollection}
                    className="w-full text-left text-green-400 hover:text-green-300"
                  >
                    + Create New Collection
                  </button>
                </div>
                {collections.length > 0 ? (
                  collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="p-2 hover:bg-gray-600"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{collection.name}</span>
                        <button
                          onClick={() => handleAddHighRatedToCollection(collection.id)}
                          className="text-indigo-400 hover:text-indigo-300 text-sm"
                          title="Add high-rated images (4+) to this collection"
                        >
                          Add 4+
                        </button>
                      </div>
                      {collection.description && (
                        <p className="text-xs text-gray-400 mt-1">{collection.description}</p>
                      )}
                      {collection.image_count !== undefined && (
                        <p className="text-xs text-gray-500">{collection.image_count} images</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-400 text-sm">
                    No collections yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <input
            type="text"
            placeholder="Search filenames..."
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
              <option value="filename">Filename A-Z</option>
              <option value="rating">Rating (High to Low)</option>
              <option value="ocount">O Count (High to Low)</option>
              <option value="filesize">File Size (Large to Small)</option>
              <option value="random">Random</option>
            </select>
          </div>

          {/* Tag Categories */}
          {[
            { key: "tags", icon: "🏷️", title: "Tags", placeholder: "Search tags..." },
            { key: "artists", icon: "🎨", title: "Artists", placeholder: "Search artists..." },
            { key: "characters", icon: "🧑‍🎤", title: "Characters", placeholder: "Search characters..." },
            { key: "parodies", icon: "🎭", title: "Parodies", placeholder: "Search parodies..." },
            { key: "groups", icon: "👥", title: "Groups", placeholder: "Search groups..." },
            { key: "categories", icon: "📂", title: "Categories", placeholder: "Search categories..." },
          ].map((category) => (
            <div key={category.key}>
              <button
                ref={(el) => {
                  buttonRefs.current[category.key] = el;
                }}
                onClick={() =>
                  openModal(
                    category.key as FilterType | "categories",
                    category.title,
                    category.placeholder,
                  )
                }
                className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-semibold">{category.title}</span>
                  {renderTagCount(filters[category.key as keyof ImageBrowseFilters])}
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

          {/* O Count Range */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>💖</span>
              <span>O Count Range</span>
            </h3>
            <RangeSlider
              min={0}
              max={Math.max(10, ...images.map((img) => img.o_count))}
              value={filters.oCount}
              onChange={(oCount) => setFilters({ ...filters, oCount })}
              step={1}
              label="O Count"
            />
          </div>

          {/* File Formats */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>🖼️</span>
              <span>File Format</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {formats.map((format) => (
                <button
                  key={format.code}
                  onClick={() => toggleFormat(format.code)}
                  className={`px-3 py-1 rounded text-sm transition ${format.code === "all"
                      ? filters.formats.length === 0
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-700 hover:bg-indigo-600"
                      : filters.formats.includes(format.code)
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-700 hover:bg-indigo-600"
                    }`}
                >
                  {format.label}
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
          availableTags={availableTags[activeModal.type as keyof typeof availableTags]}
          filterGroup={filters[activeModal.type] as FilterGroup}
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

export default ImageFilterSidebar;
