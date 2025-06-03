import { useState } from "react";
import { Link } from "react-router-dom";

interface DownloadResult {
  totalProcessed: number;
  downloaded: string[];
  metadataSaved: string[];
  skipped: string[];
  failed: string[];
  pagesProcessed: number;
}

const Settings = () => {
  const [activeProvider, setActiveProvider] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [userName, setUserName] = useState("");
  const [saveMetadata, setSaveMetadata] = useState(true);
  const [skipOrganized, setSkipOrganized] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(
    null
  );
  const [authError, setAuthError] = useState("");

  const isAuthenticated = !!userName;

  const handleAuthCheck = async () => {
    if (!sessionId.trim() || !csrfToken.trim()) {
      setAuthError("Both Session ID and CSRF Token are required");
      return;
    }

    setIsAuthenticating(true);
    setAuthError("");

    try {
      const response = await fetch("/nhentai/authCheck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId.trim(),
          csrfToken: csrfToken.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserName(data.userName);
        setAuthError("");
      } else {
        const errorData = await response.json();
        setAuthError(errorData.error || "Authentication failed");
        setUserName("");
      }
    } catch (error) {
      setAuthError("Failed to connect to server");
      setUserName("");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDownloadFavorites = async () => {
    if (!userName) {
      setAuthError("Please authenticate first");
      return;
    }

    setIsDownloading(true);
    setDownloadResult(null);

    try {
      const response = await fetch("/nhentai/favorites/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId.trim(),
          csrfToken: csrfToken.trim(),
          saveMetadata,
          skipOrganized,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setDownloadResult(result);
      } else {
        const errorData = await response.json();
        setAuthError(errorData.error || "Download failed");
      }
    } catch (error) {
      setAuthError("Failed to download favorites");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderNhentaiContent = () => (
    <div className="space-y-6">
      {/* Authentication Section */}
      <div className="bg-gray-800 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-gray-200 mb-4">
          nhentai Authentication
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session ID
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter session ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CSRF Token
            </label>
            <input
              type="text"
              value={csrfToken}
              onChange={(e) => setCsrfToken(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter CSRF token"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <button
            onClick={handleAuthCheck}
            disabled={isAuthenticating}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg transition font-medium cursor-pointer disabled:cursor-not-allowed"
          >
            {isAuthenticating ? "Checking..." : "Check"}
          </button>

          {userName && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-300">
                Username:
              </label>
              <span className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                {userName}
              </span>
            </div>
          )}
        </div>

        {authError && (
          <div className="mt-4 p-3 bg-red-900 border border-red-600 rounded-lg text-red-200">
            {authError}
          </div>
        )}
      </div>

      {/* Download Configuration */}
      <div className={`bg-gray-800 rounded-2xl p-6 transition-opacity ${!isAuthenticated ? "opacity-50" : ""
        }`}>
        <h3 className="text-xl font-semibold text-gray-200 mb-4">
          Download Configuration
        </h3>

        <div className="space-y-4 mb-6">
          <label className={`flex items-center gap-3 ${!isAuthenticated ? "cursor-not-allowed" : "cursor-pointer"
            }`}>
            <input
              type="checkbox"
              checked={saveMetadata}
              onChange={(e) => setSaveMetadata(e.target.checked)}
              disabled={!isAuthenticated}
              className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className={`text-gray-300 ${!isAuthenticated ? "text-gray-500" : ""
              }`}>
              Save meta data (default true)
            </span>
          </label>

          <label className={`flex items-center gap-3 ${!isAuthenticated ? "cursor-not-allowed" : "cursor-pointer"
            }`}>
            <input
              type="checkbox"
              checked={skipOrganized}
              onChange={(e) => setSkipOrganized(e.target.checked)}
              disabled={!isAuthenticated}
              className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className={`text-gray-300 ${!isAuthenticated ? "text-gray-500" : ""
              }`}>
              Skip organized (default true)
            </span>
          </label>
        </div>

        <button
          onClick={handleDownloadFavorites}
          disabled={!isAuthenticated || isDownloading}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg transition font-medium text-lg cursor-pointer disabled:cursor-not-allowed"
        >
          {isDownloading ? "Downloading..." : "Download Favorites"}
        </button>

      </div>

      {/* Results Section */}
      {downloadResult && (
        <div className="bg-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-200 mb-4">
            Download Results
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-green-900 rounded-lg p-4 border border-green-600">
              <h4 className="text-sm font-medium text-green-200 mb-2">
                Torrent Files Downloaded
              </h4>
              <div className="text-2xl font-bold text-green-400">
                {downloadResult.downloaded.length}
              </div>
            </div>

            <div className="bg-blue-900 rounded-lg p-4 border border-blue-600">
              <h4 className="text-sm font-medium text-blue-200 mb-2">
                Metadata Saved
              </h4>
              <div className="text-2xl font-bold text-blue-400">
                {downloadResult.metadataSaved.length}
              </div>
            </div>

            <div className="bg-yellow-900 rounded-lg p-4 border border-yellow-600">
              <h4 className="text-sm font-medium text-yellow-200 mb-2">
                Skipped
              </h4>
              <div className="text-2xl font-bold text-yellow-400">
                {downloadResult.skipped.length}
              </div>
            </div>

            <div className="bg-red-900 rounded-lg p-4 border border-red-600">
              <h4 className="text-sm font-medium text-red-200 mb-2">
                Failed
              </h4>
              <div className="text-2xl font-bold text-red-400">
                {downloadResult.failed.length}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            <p>Total Processed: {downloadResult.totalProcessed}</p>
            <p>Pages Processed: {downloadResult.pagesProcessed}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen bg-gray-800 text-gray-200 flex-col p-6 rounded-r-2xl fixed top-0 left-0 z-40">
        <Link
          to="/"
          className="hover:text-indigo-400 transition py-1 cursor-pointer"
        >
          <h2 className="text-2xl font-bold mb-6">Ecchi</h2>
        </Link>

        <nav className="flex flex-col gap-4 mb-auto">
          <button
            type="button"
            className="text-left hover:text-indigo-400 transition py-1 cursor-pointer"
            onClick={() => setActiveProvider("")}
          >
            ⚙️ Settings
          </button>
          <button
            type="button"
            className="text-left hover:text-indigo-400 transition py-1 cursor-pointer"
            onClick={() => setActiveProvider("")}
          >
            👤 Account
          </button>
          <button
            type="button"
            className="text-left hover:text-indigo-400 transition py-1 cursor-pointer"
            onClick={() => setActiveProvider("")}
          >
            🔄 Sync
          </button>

          {/* Divider */}
          <div className="border-t border-gray-600 my-4"></div>

          {/* External Providers */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              External Providers
            </h3>
            <button
              type="button"
              className={`text-left transition py-2 px-3 rounded cursor-pointer w-full ${activeProvider === "nhentai"
                ? "bg-indigo-600 text-white"
                : "hover:text-indigo-400 hover:bg-gray-700"
                }`}
              onClick={() => setActiveProvider("nhentai")}
            >
              🌸 nhentai
            </button>
          </div>
        </nav>
      </aside>

      {/* Content Area */}
      <div className="lg:ml-64">
        {/* Mobile Header */}
        <nav className="lg:hidden sticky top-0 z-30 bg-gray-800 text-gray-200 p-3 shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Settings</h1>
            <Link
              to="/"
              className="px-3 py-1 text-sm rounded hover:bg-indigo-600 transition cursor-pointer"
            >
              🏠 Home
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {activeProvider === "nhentai" ? (
              renderNhentaiContent()
            ) : (
              <div className="bg-gray-800 rounded-2xl p-12 text-center">
                <div className="text-gray-400 text-lg">
                  {activeProvider === "" ? (
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-300 mb-4">
                        Welcome to Settings
                      </h2>
                      <p>Select a section from the sidebar to get started.</p>
                    </div>
                  ) : (
                    <p>Coming soon...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
