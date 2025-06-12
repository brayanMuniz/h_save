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

const SyncSettings = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingEntry[]>([]);

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

  const handleManualSyncSuccess = (syncedId: number) => {
    setPendingItems((currentItems) =>
      currentItems.filter((item) => item.id !== syncedId),
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-gray-200 mb-2">
          Synchronize Library
        </h3>
        <p className="text-gray-400 mb-6 text-sm">
          This will scan your library and update the database with the correct
          folder names for any newly downloaded entries.
        </p>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg transition font-medium text-lg cursor-pointer disabled:cursor-not-allowed"
        >
          {isSyncing ? "Syncing..." : "Start Sync"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-600 rounded-2xl p-6 text-red-200">
          <h4 className="font-semibold mb-2">An Error Occurred</h4>
          <p>{error}</p>
        </div>
      )}

      {syncResult && (
        <div className="bg-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-200 mb-4">
            Sync Results
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

      {/* Manual Sync Section */}
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
