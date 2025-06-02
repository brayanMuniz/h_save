// components/TagSelector.tsx (Fixed with null safety)
import { useState } from "react";
import type { FilterGroup } from "../types";

interface Props {
  availableTags: string[];
  filterGroup: FilterGroup;
  onChange: (filterGroup: FilterGroup) => void;
  placeholder: string;
}

const TagSelector = ({ availableTags, filterGroup, onChange, placeholder }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filter with null safety
  const filteredTags = availableTags
    .filter(tag => tag != null && tag.trim() !== "") // Filter out null/undefined/empty tags
    .filter(tag =>
      tag.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !filterGroup.included.includes(tag) &&
      !filterGroup.excluded.includes(tag)
    );

  const addTag = (tag: string, mode: "included" | "excluded") => {
    onChange({
      ...filterGroup,
      [mode]: [...filterGroup[mode], tag],
    });
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
      />

      {isOpen && filteredTags.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded max-h-48 overflow-y-auto">
          {filteredTags.slice(0, 10).map((tag) => (
            <div key={tag} className="flex items-center justify-between p-2 hover:bg-gray-600">
              <span className="text-sm text-white">{tag}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => addTag(tag, "included")}
                  className="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600"
                  title="Include"
                >
                  +
                </button>
                <button
                  onClick={() => addTag(tag, "excluded")}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  title="Exclude"
                >
                  −
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TagSelector;
