import React, { useState, useRef, useEffect } from "react";

interface PendingEntry {
  id: number;
  title: string;
  source: string;
  external_id: string;
}

interface ManualSyncCardProps {
  pendingItem: PendingEntry;
  availableFolders: string[];
  onSyncSuccess: (syncedId: number) => void;
}

const ManualSyncCard: React.FC<ManualSyncCardProps> = ({
  pendingItem,
  availableFolders,
  onSyncSuccess,
}) => {
  const [folderNameInput, setFolderNameInput] = useState("");
  const [localThumbnailUrl, setLocalThumbnailUrl] = useState<string | null>(null);
  const [officialCoverUrl, setOfficialCoverUrl] = useState<string | null>(null);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const [isLoadingCover, setIsLoadingCover] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredFolders, setFilteredFolders] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter folders based on input
  useEffect(() => {
    if (folderNameInput) {
      const filtered = availableFolders.filter(folder =>
        folder.toLowerCase().includes(folderNameInput.toLowerCase())
      );
      setFilteredFolders(filtered);
    } else {
      setFilteredFolders([]);
    }
  }, [folderNameInput, availableFolders]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFetchOfficialCover = async () => {
    if (pendingItem.source !== "nhentai") {
      setError("Official cover only available for nhentai sources");
      return;
    }

    setIsLoadingCover(true);
    setOfficialCoverUrl(null);
    setError(null);

    try {
      const response = await fetch(`/nhentai/doujinshi/${pendingItem.external_id}/cover`);
      if (!response.ok) {
        throw new Error("Failed to fetch official cover");
      }
      const data = await response.json();
      setOfficialCoverUrl(data.coverUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load official cover");
    } finally {
      setIsLoadingCover(false);
    }
  };

  const handleFetchThumbnail = async () => {
    if (!folderNameInput) return;
    setIsLoadingThumbnail(true);
    setLocalThumbnailUrl(null);
    setError(null);
    try {
      const response = await fetch(
        `/api/thumbnail?folderName=${encodeURIComponent(folderNameInput)}`,
      );
      if (!response.ok) {
        throw new Error("Thumbnail not found for this folder.");
      }
      const imageBlob = await response.blob();
      setLocalThumbnailUrl(URL.createObjectURL(imageBlob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview.");
    } finally {
      setIsLoadingThumbnail(false);
    }
  };

  const handleConfirmSync = async () => {
    if (!folderNameInput || isConfirming) return;
    setIsConfirming(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/doujinshi/${pendingItem.id}/manual-sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderName: folderNameInput }),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to confirm sync.");
      }
      setIsSynced(true);
      onSyncSuccess(pendingItem.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleViewSource = () => {
    if (pendingItem.source === "nhentai" && pendingItem.external_id) {
      const url = `https://nhentai.net/g/${pendingItem.external_id}/`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (folder: string) => {
    setFolderNameInput(folder);
    setShowSuggestions(false);
  };

  return (
    <div
      className={`bg-gray-900/50 p-4 rounded-lg border transition-colors relative ${isSynced
        ? "border-green-500"
        : "border-gray-700 hover:border-gray-600"
        }`}
    >
      <div className="space-y-4">
        {/* Title and Source Info - Top */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h5
              className="font-semibold text-gray-200 truncate mb-2"
              title={pendingItem.title}
            >
              {pendingItem.title}
            </h5>
            <div className="text-xs text-gray-400 flex gap-4">
              <span>Source: {pendingItem.source}</span>
              <span>ID: {pendingItem.external_id}</span>
            </div>
          </div>
          {pendingItem.source === "nhentai" && pendingItem.external_id && (
            <button
              onClick={handleViewSource}
              className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-md text-xs transition flex-shrink-0"
              title="View on nhentai"
            >
              🌸 View Source
            </button>
          )}
        </div>

        {/* Image Comparison - Middle */}
        <div className="flex justify-center gap-4">
          {/* Official Cover */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">Official Cover</p>
            <div
              className={`w-32 h-48 bg-gray-700 rounded flex items-center justify-center transition-all ${pendingItem.source === "nhentai"
                ? "cursor-pointer hover:bg-gray-600 hover:ring-2 hover:ring-indigo-400"
                : "cursor-not-allowed opacity-50"
                }`}
              onClick={pendingItem.source === "nhentai" ? handleFetchOfficialCover : undefined}
              title={pendingItem.source === "nhentai" ? "Click to load official cover" : "Official cover not available for this source"}
            >
              {isLoadingCover ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div>
              ) : officialCoverUrl ? (
                <img
                  src={officialCoverUrl}
                  alt="Official Cover"
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="text-center p-2">
                  <span className="text-xs text-gray-500">
                    {pendingItem.source === "nhentai" ? "Click to Load" : "Not Available"}
                  </span>
                  {pendingItem.source === "nhentai" && (
                    <div className="text-2xl mt-1">🖼️</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* VS */}
          <div className="flex items-center">
            <span className="text-gray-400 text-lg font-bold">VS</span>
          </div>

          {/* Local Preview */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">Local Preview</p>
            <div className="w-32 h-48 bg-gray-700 rounded flex items-center justify-center">
              {isLoadingThumbnail ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div>
              ) : localThumbnailUrl ? (
                <img
                  src={localThumbnailUrl}
                  alt="Local Preview"
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <span className="text-xs text-gray-500 text-center p-2">
                  No Preview
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Input and Controls - Bottom */}
        <div className="space-y-3 relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              onFocus={handleInputFocus}
              disabled={isSynced}
              placeholder="Enter or select folder name..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:ring-indigo-500 focus:border-transparent"
            />

            {/* Custom Dropdown */}
            {showSuggestions && filteredFolders.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
              >
                {filteredFolders.slice(0, 10).map((folder) => (
                  <button
                    key={folder}
                    onClick={() => handleSuggestionClick(folder)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors"
                  >
                    {folder}
                  </button>
                ))}
                {filteredFolders.length > 10 && (
                  <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-600">
                    ... and {filteredFolders.length - 10} more
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFetchThumbnail}
              disabled={!folderNameInput || isLoadingThumbnail || isSynced}
              className="px-4 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm transition disabled:opacity-50"
            >
              Preview
            </button>
            <button
              onClick={handleConfirmSync}
              disabled={!localThumbnailUrl || isConfirming || isSynced}
              className="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm transition disabled:opacity-50"
            >
              {isConfirming ? "Saving..." : "Confirm"}
            </button>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ManualSyncCard;
