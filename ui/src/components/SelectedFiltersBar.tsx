import type { BrowseFilters, FilterType } from "../types";

interface SelectedFilter {
  tag: string;
  type: FilterType;
  mode: "included" | "excluded";
}

interface Props {
  filters: BrowseFilters;
  setFilters: (filters: BrowseFilters) => void;
}

const SelectedFiltersBar = ({ filters, setFilters }: Props) => {
  const allSelectedTags: SelectedFilter[] = (
    ["tags", "artists", "characters", "parodies", "groups"] as const
  ).flatMap((type) => [
    ...filters[type].included.map((tag) => ({ tag, type, mode: "included" as const })),
    ...filters[type].excluded.map((tag) => ({ tag, type, mode: "excluded" as const })),
  ]);

  const removeFilter = (tag: string, type: FilterType, mode: "included" | "excluded") => {
    const filterGroup = filters[type];
    setFilters({
      ...filters,
      [type]: { ...filterGroup, [mode]: filterGroup[mode].filter((t) => t !== tag) },
    });
  };

  const removeCurrentlyReading = () => {
    setFilters({ ...filters, currentlyReading: false });
  };

  const clearAllFilters = () => {
    setFilters({
      ...filters,
      tags: { included: [], excluded: [] },
      artists: { included: [], excluded: [] },
      characters: { included: [], excluded: [] },
      parodies: { included: [], excluded: [] },
      groups: { included: [], excluded: [] },
      currentlyReading: false, // Reset new filter
    });
  };

  if (allSelectedTags.length === 0 && !filters.currentlyReading) return null;

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Render the Currently Reading pill if active */}
        {filters.currentlyReading && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-500 text-white">
            <span>📖</span>
            <span>In Progress</span>
            <button onClick={removeCurrentlyReading} className="ml-1 hover:bg-black/20 rounded-full p-0.5 w-4 h-4 flex items-center justify-center">
              ×
            </button>
          </div>
        )}

        {allSelectedTags.map(({ tag, type, mode }) => (
          <div key={`${type}-${mode}-${tag}`} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${mode === "included" ? "bg-indigo-500 text-white" : "bg-red-500 text-white"}`}>
            <span>{mode === "excluded" ? "−" : "+"}</span>
            <span className="capitalize">{type.slice(0, -1)}</span>
            <span>·</span>
            <span>{tag}</span>
            <button onClick={() => removeFilter(tag, type, mode)} className="ml-1 hover:bg-black/20 rounded-full p-0.5 w-4 h-4 flex items-center justify-center">
              ×
            </button>
          </div>
        ))}

        {(allSelectedTags.length > 0 || filters.currentlyReading) && (
          <button onClick={clearAllFilters} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700">
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default SelectedFiltersBar;
