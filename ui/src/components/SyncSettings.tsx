import { useState } from "react";
import ManualSyncCard from "./ManualSyncCard";

interface SyncedEntry {
  id: number;
  title: string;
  folderName: string;
  thumbnailUrl: string;
}

interface PendingEntry {
  id: number;
  title: string;
  source: string;
  external_id: string;
}

interface SyncResult {
  synced: SyncedEntry[];
  stillPending: PendingEntry[];
  availableFolders: string[];
}

interface ImageScanResult {
  total_scanned: number;
  new_images: number;
  duplicates: number;
  errors: string[];
}

const SyncSettings = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingEntry[]>([]);

  // Image scan state
  const [isImageScanning, setIsImageScanning] = useState(false);
  const [imageScanResult, setImageScanResult] = useState<ImageScanResult | null>(null);
  const [imageScanError, setImageScanError] = useState<string | null>(null);
  const [imageScanPath, setImageScanPath] = useState("images");

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResult(null);
    setPendingItems([]);

    try {
      const response = await fetch("/api/sync", { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Sync failed.");
      }
      const data = await response.json();
      if (!data) throw new Error("Received an empty response from the server.");

      const result: SyncResult = {
        synced: Array.isArray(data.synced) ? data.synced : [],
        stillPending: Array.isArray(data.stillPending) ? data.stillPending : [],
        availableFolders: Array.isArray(data.availableFolders) ? data.availableFolders : [],
      };
      setSyncResult(result);
      setPendingItems(result.stillPending);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImageScan = async () => {
    setIsImageScanning(true);
    setImageScanError(null);
    setImageScanResult(null);

    try {
      const url = new URL("/api/images/scan", window.location.origin);
      if (imageScanPath.trim() && imageScanPath !== "images") {
        url.searchParams.set("path", imageScanPath.trim());
      }

      const response = await fetch(url.toString(), { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Image scan failed.");
      }

      const data = await response.json();
      if (!data || !data.result) {
        throw new Error("Received an invalid response from the server.");
      }

      setImageScanResult(data.result);
    } catch (err) {
      setImageScanError(err instanceof Error ? err.message : "An unexpected error occurred during image scan.");
    } finally {
      setIsImageScanning(false);
    }
  };

  const handleManualSyncSuccess = (syncedId: number) => {
    setPendingItems((currentItems) =>
      currentItems.filter((item) => item.id !== syncedId),
    );
  };

  return (
    <div className="space-y-6">
      {/* Doujinshi Sync Section */}
      <div className="bg-gray-800 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-gray-200 mb-2">
          Synchronize Doujinshi Library
        </h3>
        <p className="text-gray-400 mb-6 text-sm">
          This will scan your doujinshi library and update the database with the correct
          folder names for any newly downloaded entries.
        </p>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg transition font-medium text-lg cursor-pointer disabled:cursor-not-allowed"
        >
          {isSyncing ? "Syncing..." : "Start Doujinshi Sync"}
        </button>
      </div>

      {/* Image Scan Section */}
      <div className="bg-gray-800 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-gray-200 mb-2">
          Scan Images Folder
        </h3>
        <p className="text-gray-400 mb-4 text-sm">
          This will scan your images folder and add any new image files to the database.
          Existing images and duplicates will be skipped.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Images Folder Path
          </label>
          <input
            type="text"
            value={imageScanPath}
            onChange={(e) => setImageScanPath(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="images"
          />
          <p className="text-xs text-gray-400 mt-1">
            Path to the folder containing images to scan (relative to the application root)
          </p>
        </div>

        <button
          onClick={handleImageScan}
          disabled={isImageScanning}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg transition font-medium text-lg cursor-pointer disabled:cursor-not-allowed"
        >
          {isImageScanning ? "Scanning..." : "Start Image Scan"}
        </button>
      </div>

      {/* Doujinshi Sync Error */}
      {error && (
        <div className="bg-red-900 border border-red-600 rounded-2xl p-6 text-red-200">
          <h4 className="font-semibold mb-2">Doujinshi Sync Error</h4>
          <p>{error}</p>
        </div>
      )}

      {/* Image Scan Error */}
      {imageScanError && (
        <div className="bg-red-900 border border-red-600 rounded-2xl p-6 text-red-200">
          <h4 className="font-semibold mb-2">Image Scan Error</h4>
          <p>{imageScanError}</p>
        </div>
      )}

      {/* Doujinshi Sync Results */}
      {syncResult && (
        <div className="bg-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-200 mb-4">
            Doujinshi Sync Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-400 mb-3">
                Synced ({syncResult.synced.length})
              </h4>
              {syncResult.synced.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-300 max-h-60 overflow-y-auto">
                  {syncResult.synced.map((d, index) => (
                    <li key={index} className="truncate">
                      {d.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No new items to sync.</p>
              )}
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-400 mb-3">
                Still Pending ({syncResult.stillPending.length})
              </h4>
              {syncResult.stillPending.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-300 max-h-60 overflow-y-auto">
                  {syncResult.stillPending.map((d, index) => (
                    <li key={index} className="truncate">
                      {d.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">
                  All items synced successfully.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Scan Results */}
      {imageScanResult && (
        <div className="bg-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-200 mb-4">
            Image Scan Results
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-900 rounded-lg p-4 border border-blue-600">
              <h4 className="text-sm font-medium text-blue-200 mb-2">
                Total Scanned
              </h4>
              <div className="text-2xl font-bold text-blue-400">
                {imageScanResult.total_scanned}
              </div>
            </div>
            <div className="bg-green-900 rounded-lg p-4 border border-green-600">
              <h4 className="text-sm font-medium text-green-200 mb-2">
                New Images
              </h4>
              <div className="text-2xl font-bold text-green-400">
                {imageScanResult.new_images}
              </div>
            </div>
            <div className="bg-yellow-900 rounded-lg p-4 border border-yellow-600">
              <h4 className="text-sm font-medium text-yellow-200 mb-2">
                Duplicates
              </h4>
              <div className="text-2xl font-bold text-yellow-400">
                {imageScanResult.duplicates}
              </div>
            </div>
            <div className="bg-red-900 rounded-lg p-4 border border-red-600">
              <h4 className="text-sm font-medium text-red-200 mb-2">
                Errors
              </h4>
              <div className="text-2xl font-bold text-red-400">
                {imageScanResult.errors.length}
              </div>
            </div>
          </div>

          {/* Show errors if any */}
          {imageScanResult.errors.length > 0 && (
            <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
              <h4 className="font-semibold text-red-200 mb-2">Scan Errors</h4>
              <ul className="space-y-1 text-sm text-red-300 max-h-40 overflow-y-auto">
                {imageScanResult.errors.map((error, index) => (
                  <li key={index} className="text-xs">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Manual Sync Section for Doujinshi */}
      {pendingItems.length > 0 && syncResult && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-200">
            Manual Sync Required
          </h3>
          {pendingItems.map((item) => (
            <ManualSyncCard
              key={item.id}
              pendingItem={item}
              availableFolders={syncResult.availableFolders}
              onSyncSuccess={handleManualSyncSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SyncSettings;
