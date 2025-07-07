import React from "react";
import { Link } from "react-router-dom";
import type { SortState, SortKey, SortOrder } from "../types";

type ViewMode = "card" | "cover";

interface HeaderBarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sort?: SortState;
  setSort?: (sort: SortState) => void;
  itemCount?: number;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  viewMode,
  setViewMode,
  sort,
  setSort,
  itemCount,
}) => {
  const handleSortKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (setSort && sort) {
      setSort({ ...sort, key: e.target.value as SortKey });
    }
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (setSort && sort) {
      setSort({ ...sort, order: e.target.value as SortOrder });
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left Side: Item Count or Title */}
      <div className="flex-shrink-0">
        {sort && setSort && itemCount !== undefined ? (
          <span className="text-gray-400 text-sm">
            {itemCount} result{itemCount !== 1 ? "s" : ""}
          </span>
        ) : (
          <Link
            to="/"
            className="text-4xl font-bold text-gray-200 font-handwriting hover:text-indigo-400 transition"
          >
            Ecchi
          </Link>
        )}
      </div>

      {/* Center: Sorting Controls (only if props are provided) */}
      {sort && setSort && (
        <div className="flex gap-2">
          <select
            value={sort.key}
            onChange={handleSortKeyChange}
            className="bg-gray-700/50 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Sort by"
          >
            <option value="uploaded">Date Uploaded</option>
            <option value="rating">Rating</option>
            <option value="oCount">♥ Count</option>
            <option value="title">Title</option>
            <option value="random">Random</option>
          </select>
          <select
            value={sort.order}
            onChange={handleSortOrderChange}
            className="bg-gray-700/50 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Sort order"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default HeaderBar;
