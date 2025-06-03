import { useState } from "react";

interface SyncButtonProps {
  onSyncComplete?: () => void;
  compact?: boolean;
}

type SyncState = "idle" | "syncing" | "success" | "error";

const SyncButton = ({ onSyncComplete, compact = false }: SyncButtonProps) => {
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncMessage, setSyncMessage] = useState("");

  const handleSync = async () => {
    setSyncState("syncing");
    setSyncMessage("Synchronizing...");

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const data = await response.json();

      setSyncState("success");
      setSyncMessage(data.message || "Sync completed successfully!");

      // Call completion callback if provided
      onSyncComplete?.();

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setSyncState("idle");
        setSyncMessage("");
      }, 3000);

    } catch (error) {
      setSyncState("error");
      setSyncMessage(error instanceof Error ? error.message : "Sync failed");

      // Reset to idle after 5 seconds
      setTimeout(() => {
        setSyncState("idle");
        setSyncMessage("");
      }, 5000);
    }
  };

  const getIcon = () => {
    switch (syncState) {
      case "syncing":
        return (
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case "success":
        return (
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-4 h-4 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
    }
  };

  const getButtonStyle = () => {
    const baseStyle = `
      flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 
      ${compact ? 'text-sm' : 'text-base'}
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
    `;

    switch (syncState) {
      case "syncing":
        return `${baseStyle} bg-blue-600 text-white cursor-not-allowed focus:ring-blue-500`;
      case "success":
        return `${baseStyle} bg-green-600 text-white cursor-default focus:ring-green-500`;
      case "error":
        return `${baseStyle} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
      default:
        return `${baseStyle} bg-gray-700 text-gray-200 hover:bg-indigo-600 hover:text-white focus:ring-indigo-500`;
    }
  };

  const isDisabled = syncState === "syncing" || syncState === "success";

  if (compact) {
    return (
      <div className="relative group">
        <button
          onClick={handleSync}
          disabled={isDisabled}
          className={getButtonStyle()}
          title={syncMessage || "Sync library"}
        >
          {getIcon()}
          {!compact && (
            <span>
              {syncState === "syncing" && "Syncing..."}
              {syncState === "success" && "Synced!"}
              {syncState === "error" && "Retry"}
              {syncState === "idle" && "Sync"}
            </span>
          )}
        </button>

        {/* Tooltip for compact mode */}
        {syncMessage && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
                          bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 
                          transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {syncMessage}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                            border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={isDisabled}
        className={getButtonStyle()}
      >
        {getIcon()}
        <span>
          {syncState === "syncing" && "Syncing..."}
          {syncState === "success" && "Synced!"}
          {syncState === "error" && "Retry Sync"}
          {syncState === "idle" && "Sync"}
        </span>
      </button>

      {syncMessage && (
        <div className={`text-xs px-2 py-1 rounded
          ${syncState === "success" ? "text-green-400 bg-green-900/20" : ""}
          ${syncState === "error" ? "text-red-400 bg-red-900/20" : ""}
          ${syncState === "syncing" ? "text-blue-400 bg-blue-900/20" : ""}
        `}>
          {syncMessage}
        </div>
      )}
    </div>
  );
};

export default SyncButton;
