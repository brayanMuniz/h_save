import { useMemo, useState, useRef, useEffect } from "react";
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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
  isCollapsed,
  onToggleCollapse,
}: Props) => {
  const [activeModal, setActiveModal] = useState<{
    type: FilterType | "categories";
    title: string;
    placeholder: string;
  } | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<{
    tags: string[];
    artists: string[];
    characters: string[];
    parodies: string[];
    groups: string[];
    categories: string[];
  }>({
    tags: [],
    artists: [],
    characters: [],
    parodies: [],
    groups: [],
    categories: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Fetch all available metadata on component mount
  useEffect(() => {
    const fetchAllMetadata = async () => {
      setIsLoading(true);
      setLoadingError(null);
      try {
        console.log("Fetching metadata from API...");

        // Fetch each metadata type
        const fetchPromises = [
          fetch('/api/tags').then(res => {
            if (!res.ok) throw new Error(`Tags API failed: ${res.status}`);
            return res.json();
          }),
          fetch('/api/artists').then(res => {
            if (!res.ok) throw new Error(`Artists API failed: ${res.status}`);
            return res.json();
          }),
          fetch('/api/characters').then(res => {
            if (!res.ok) throw new Error(`Characters API failed: ${res.status}`);
            return res.json();
          }),
          fetch('/api/parodies').then(res => {
            if (!res.ok) throw new Error(`Parodies API failed: ${res.status}`);
            return res.json();
          }),
          fetch('/api/groups').then(res => {
            if (!res.ok) throw new Error(`Groups API failed: ${res.status}`);
            return res.json();
          }),
        ];

        const [tags, artists, characters, parodies, groups] = await Promise.all(fetchPromises);

        console.log("API responses:", { tags, artists, characters, parodies, groups });

        // Extract categories from current images as fallback (no API endpoint exists)
        const categories = [...new Set(images.flatMap((img) => img.categories || [])
          .filter((cat) => cat != null && cat.trim() !== ""))].sort();

        // Handle different possible response structures
        const extractNames = (data: any): string[] => {
          if (Array.isArray(data)) {
            return data.map(item =>
              typeof item === 'string' ? item : (item.name || item.Name || String(item))
            ).filter(Boolean).sort();
          }
          if (data && Array.isArray(data.tags)) return data.tags.map((t: any) => t.name || t.Name || String(t)).filter(Boolean).sort();
          if (data && Array.isArray(data.artists)) return data.artists.map((a: any) => a.name || a.Name || String(a)).filter(Boolean).sort();
          if (data && Array.isArray(data.characters)) return data.characters.map((c: any) => c.name || c.Name || String(c)).filter(Boolean).sort();
          if (data && Array.isArray(data.parodies)) return data.parodies.map((p: any) => p.name || p.Name || String(p)).filter(Boolean).sort();
          if (data && Array.isArray(data.groups)) return data.groups.map((g: any) => g.name || g.Name || String(g)).filter(Boolean).sort();
          return [];
        };

        const newAvailableTags = {
          tags: extractNames(tags),
          artists: extractNames(artists),
          characters: extractNames(characters),
          parodies: extractNames(parodies),
          groups: extractNames(groups),
          categories: categories,
        };

        console.log("Processed metadata:", newAvailableTags);
        setAvailableTags(newAvailableTags);

      } catch (error) {
        console.error('Failed to fetch metadata:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to fetch metadata');

        // Fallback to calculating from current images
        const safeFilter = (items: string[]) =>
          [...new Set(items.filter((item) => item != null && item.trim() !== ""))].sort();

        setAvailableTags({
          tags: safeFilter(images.flatMap((img) => img.tags || [])),
          artists: safeFilter(images.flatMap((img) => img.artists || [])),
          characters: safeFilter(images.flatMap((img) => img.characters || [])),
          parodies: safeFilter(images.flatMap((img) => img.parodies || [])),
          groups: safeFilter(images.flatMap((img) => img.groups || [])),
          categories: safeFilter(images.flatMap((img) => img.categories || [])),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMetadata();
  }, []); // Empty dependency array - only fetch once on mount

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

  // Function to remove a filter from included or excluded arrays
  const removeFilter = (filterType: FilterType | "categories", filterValue: string, isIncluded: boolean) => {
    const currentFilterGroup = filters[filterType] as FilterGroup;

    if (isIncluded) {
      const newIncluded = currentFilterGroup.included.filter(item => item !== filterValue);
      updateFilterGroup(filterType, { ...currentFilterGroup, included: newIncluded });
    } else {
      const newExcluded = currentFilterGroup.excluded.filter(item => item !== filterValue);
      updateFilterGroup(filterType, { ...currentFilterGroup, excluded: newExcluded });
    }
  };

  // Function to render active filter tags
  const renderActiveFilters = (filterType: FilterType | "categories") => {
    const filterGroup = filters[filterType] as FilterGroup;
    const hasFilters = filterGroup.included.length > 0 || filterGroup.excluded.length > 0;

    if (!hasFilters) return null;

    return (
      <div className="px-3 pb-2 space-y-2">
        {/* Included filters (green) */}
        {filterGroup.included.length > 0 && (
          <div>
            <div className="text-xs text-green-400 font-medium mb-1">Including:</div>
            <div className="flex flex-wrap gap-1">
              {filterGroup.included.map((filterValue) => (
                <button
                  key={`inc-${filterValue}`}
                  onClick={() => removeFilter(filterType, filterValue, true)}
                  className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                  title="Click to remove"
                >
                  <span className="mr-1">+</span>
                  <span className="truncate max-w-20">{filterValue}</span>
                  <span className="ml-1 text-green-200 hover:text-white">×</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Excluded filters (red) */}
        {filterGroup.excluded.length > 0 && (
          <div>
            <div className="text-xs text-red-400 font-medium mb-1">Excluding:</div>
            <div className="flex flex-wrap gap-1">
              {filterGroup.excluded.map((filterValue) => (
                <button
                  key={`exc-${filterValue}`}
                  onClick={() => removeFilter(filterType, filterValue, false)}
                  className="inline-flex items-center px-2 py-1 text-xs bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title="Click to remove"
                >
                  <span className="mr-1">−</span>
                  <span className="truncate max-w-20">{filterValue}</span>
                  <span className="ml-1 text-red-200 hover:text-white">×</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Function to clear all filters for a specific type
  const clearFiltersForType = (filterType: FilterType | "categories") => {
    updateFilterGroup(filterType, { included: [], excluded: [] });
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

  if (isCollapsed) {
    return (
      <div className="fixed left-0 top-0 z-10">
        <aside className="w-16 h-screen bg-gray-800 text-gray-200 flex flex-col items-center py-4">
          <button
            onClick={onToggleCollapse}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded transition mb-4"
            title="Expand Sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="text-sm text-gray-400 writing-mode-vertical text-center">
            <span className="block transform rotate-90 whitespace-nowrap">Gallery Filters</span>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 z-10">
      <aside className="w-80 h-screen bg-gray-800 text-gray-200 flex flex-col">
        {/* Fixed header section */}
        <div className="flex-shrink-0 p-4 border-b border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Image Gallery</h2>
            <button
              onClick={onToggleCollapse}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition"
              title="Collapse Sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Debug info */}
          {loadingError && (
            <div className="text-red-400 text-xs p-2 bg-red-900 rounded">
              API Error: {loadingError}
            </div>
          )}

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

        {/* Scrollable content section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4 pb-8">
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
                <option value="random">Random</option>
                <option value="uploaded">Recently Uploaded</option>
                <option value="filename">Filename A-Z</option>
                <option value="rating">Rating (High to Low)</option>
                <option value="ocount">O Count (High to Low)</option>
                <option value="filesize">File Size (Large to Small)</option>
              </select>
            </div>

            {/* Loading state for tag categories */}
            {isLoading ? (
              <div className="text-center text-gray-400 py-4">
                <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading filters...
              </div>
            ) : (
              <>
                {/* Tag Categories */}
                <div className="space-y-3">
                  {[
                    { key: "tags", icon: "🏷️", title: "Tags", placeholder: "Search tags..." },
                    { key: "artists", icon: "🎨", title: "Artists", placeholder: "Search artists..." },
                    { key: "characters", icon: "🧑‍🎤", title: "Characters", placeholder: "Search characters..." },
                    { key: "parodies", icon: "🎭", title: "Parodies", placeholder: "Search parodies..." },
                    { key: "groups", icon: "👥", title: "Groups", placeholder: "Search groups..." },
                    { key: "categories", icon: "📂", title: "Categories", placeholder: "Search categories..." },
                  ].map((category) => {
                    const filterGroup = filters[category.key as keyof ImageBrowseFilters] as FilterGroup;
                    const hasActiveFilters = filterGroup.included.length > 0 || filterGroup.excluded.length > 0;

                    return (
                      <div key={category.key} className="bg-gray-750 rounded-lg overflow-hidden">
                        <button
                          ref={(el) => {
                            buttonRefs.current[category.key] = el;
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            openModal(
                              category.key as FilterType | "categories",
                              category.title,
                              category.placeholder,
                            );
                          }}
                          className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-t-lg transition flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            <span className="font-semibold">{category.title}</span>
                            {renderTagCount(filterGroup)}
                            <span className="text-xs text-gray-400">
                              ({availableTags[category.key as keyof typeof availableTags]?.length || 0})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearFiltersForType(category.key as FilterType | "categories");
                                }}
                                className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 transition-colors"
                                title="Clear all filters for this category"
                              >
                                Clear
                              </button>
                            )}
                            <span className="text-gray-400">›</span>
                          </div>
                        </button>

                        {/* Active filter tags */}
                        {hasActiveFilters && (
                          <div className="bg-gray-750">
                            {renderActiveFilters(category.key as FilterType | "categories")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

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
