import React from "react";

type ViewMode = "card" | "cover";

interface HeaderBarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ viewMode, setViewMode }) => (
  <div className="flex items-center justify-between w-full mb-6">
    <span className="text-4xl font-bold text-gray-200 font-handwriting">Ecchi</span>
    <div className="flex items-center gap-2">
      <button
        onClick={() => setViewMode("card")}
        className={`text-2xl font-handwriting px-4 py-1 rounded transition
          ${viewMode === "card"
            ? "border-2 border-gray-200 bg-gray-800 text-white"
            : "text-gray-300 hover:text-white"
          }`}
        style={{ borderRadius: "0.5rem" }}
      >
        Card
      </button>
      <span className="text-2xl font-handwriting text-gray-300">/</span>
      <button
        onClick={() => setViewMode("cover")}
        className={`text-2xl font-handwriting px-4 py-1 rounded transition
          ${viewMode === "cover"
            ? "border-2 border-gray-200 bg-gray-800 text-white"
            : "text-gray-300 hover:text-white"
          }`}
        style={{ borderRadius: "0.5rem" }}
      >
        Cover
      </button>
    </div>
  </div>
);

export default HeaderBar;
