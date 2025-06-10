import React, { useState } from "react";

interface PendingEntry {
  id: number;
  title: string;
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchThumbnail = async () => {
    if (!folderNameInput) return;
    setIsLoadingThumbnail(true);
    setThumbnailUrl(null);
    setError(null);
    try {
      const response = await fetch(
        `/api/thumbnail?folderName=${encodeURIComponent(folderNameInput)}`,
      );
      if (!response.ok) {
        throw new Error("Thumbnail not found for this folder.");
      }
      const imageBlob = await response.blob();
      setThumbnailUrl(URL.createObjectURL(imageBlob));
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
      onSyncSuccess(pendingItem.id); // Notify parent to remove this card
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      className={`bg-gray-900/50 p-4 rounded-lg border transition-colors ${isSynced
          ? "border-green-500"
          : "border-gray-700 hover:border-gray-600"
        }`}
    >
      <div className="flex gap-4">
        {/* Left Side: Info and Controls */}
        <div className="flex-1 space-y-3">
          <h5 className="font-semibold text-gray-200 truncate" title={pendingItem.title}>
            {pendingItem.title}
          </h5>
          <input
            type="text"
            list="available-folders"
            value={folderNameInput}
            onChange={(e) => setFolderNameInput(e.target.value)}
            disabled={isSynced}
            placeholder="Enter or select folder name..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:ring-indigo-500 focus:border-transparent"
          />
          <datalist id="available-folders">
            {availableFolders.map((folder) => (
              <option key={folder} value={folder} />
            ))}
          </datalist>
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
              disabled={!thumbnailUrl || isConfirming || isSynced}
              className="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm transition disabled:opacity-50"
            >
              {isConfirming ? "Saving..." : "Confirm"}
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        {/* Right Side: Thumbnail Preview */}
        <div className="w-24 h-36 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
          {isLoadingThumbnail ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div>
          ) : thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Preview"
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
  );
};

export default ManualSyncCard;
