import { useState, useEffect, useRef } from "react";
import type { FilterGroup } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  availableTags: string[];
  filterGroup: FilterGroup;
  onChange: (filterGroup: FilterGroup) => void;
  placeholder: string;
  anchorRef: React.RefObject<HTMLElement>;
}

const TagSelectorModal = ({
  isOpen,
  onClose,
  title,
  availableTags,
  filterGroup,
  onChange,
  placeholder,
  anchorRef,
}: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      setPosition({
        top: rect.bottom + scrollTop + 8,
        left: rect.left,
      });
      setSearchTerm(""); // Reset search when opening
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // Small delay to prevent immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscapeKey);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [isOpen, onClose, anchorRef]);

  const filteredTags = availableTags
    .filter((tag) => tag != null && tag.trim() !== "")
    .filter(
      (tag) =>
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
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed z-50 bg-gray-800 rounded-lg shadow-2xl w-80 border border-gray-600"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: "400px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-gray-700 flex-shrink-0">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm"
          autoFocus
        />
      </div>

      {/* Tags List - Fixed scrolling */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-3 pb-6"> {/* Added extra bottom padding */}
          {filteredTags.length > 0 ? (
            <div className="space-y-1">
              {filteredTags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded hover:bg-gray-600 transition"
                >
                  <span className="text-sm text-white truncate flex-1 mr-2">
                    {tag}
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => addTag(tag, "included")}
                      className="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
                      title="Include"
                    >
                      +
                    </button>
                    <button
                      onClick={() => addTag(tag, "excluded")}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                      title="Exclude"
                    >
                      −
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-4 text-sm">
              {searchTerm
                ? `No tags found matching "${searchTerm}"`
                : "No available tags"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagSelectorModal;
