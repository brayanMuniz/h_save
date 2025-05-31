import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

const DoujinshiReader = () => {
  const { id, pageNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Request fullscreen
  const enterFullscreen = () => {
    if (containerRef.current && containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Pages and current index
  const [pages, setPages] = useState<string[] | null>(location.state?.pages || null);
  const [currentIdx, setCurrentIdx] = useState<number | null>(location.state?.currentIdx ?? null);
  const [loading, setLoading] = useState(!pages);
  const [error, setError] = useState<string | null>(null);

  // UI overlay state
  const [showUI, setShowUI] = useState(true);
  const hideUITimer = useRef<number | null>(null);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<{ filename: string; name: string }[]>([]);
  const [bookmarkStatus, setBookmarkStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Fetch pages and set current index if not provided
  useEffect(() => {
    if (pages && currentIdx !== null) return;
    if (!id || !pageNumber) {
      setError("No page data provided.");
      return;
    }
    setLoading(true);
    fetch(`/api/doujinshi/${id}/pages`)
      .then((res) => res.json())
      .then((data) => {
        const pageList: string[] = data.pages || [];
        setPages(pageList);
        const idx = pageList.findIndex((url) => url.endsWith(`/page/${pageNumber}`));
        if (idx === -1) {
          setError("Page not found.");
        } else {
          setCurrentIdx(idx);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load page data.");
        setLoading(false);
      });
  }, [id, pageNumber, pages, currentIdx]);

  // Fetch bookmarks for this doujinshi
  useEffect(() => {
    if (!id) return;
    fetch(`/api/user/doujinshi/${id}/bookmarks`)
      .then((res) => res.json())
      .then((data) => setBookmarks(data.bookmarks || []));
  }, [id]);

  // Get current filename
  const filename =
    pages && currentIdx !== null
      ? (() => {
        const match = pages[currentIdx].match(/page\/([^/]+)$/);
        return match ? match[1] : "";
      })()
      : "";

  // Is current page bookmarked?
  const isBookmarked = bookmarks.some((bm) => bm.filename === filename);

  // Add bookmark for current page
  const handleAddBookmark = async () => {
    if (!id || !filename) return;
    setBookmarkStatus("saving");
    try {
      const res = await fetch(`/api/user/doujinshi/${id}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          name: "", // Empty name for now
        }),
      });
      if (res.ok) {
        setBookmarkStatus("saved");
        setTimeout(() => setBookmarkStatus("idle"), 1500);
        // Optionally refetch bookmarks
        fetch(`/api/user/doujinshi/${id}/bookmarks`)
          .then((res) => res.json())
          .then((data) => setBookmarks(data.bookmarks || []));
      } else {
        setBookmarkStatus("error");
        setTimeout(() => setBookmarkStatus("idle"), 1500);
      }
    } catch {
      setBookmarkStatus("error");
      setTimeout(() => setBookmarkStatus("idle"), 1500);
    }
  };

  const [oCount, setOCount] = useState<number>(0);

  // Fetch O count for the current page
  useEffect(() => {
    if (!id || !filename) return;
    fetch(`/api/user/doujinshi/${id}/o?filename=${encodeURIComponent(filename)}`)
      .then((res) => res.json())
      .then((data) => setOCount(data.oCount ?? 0));
  }, [id, filename]);

  const updateOCount = async (newCount: number) => {
    if (!id || !filename) return;
    setOCount(newCount); // Optimistic update
    await fetch(`/api/user/doujinshi/${id}/o`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, oCount: newCount }),
    });
  };

  const handleIncreaseO = () => updateOCount(oCount + 1);
  const handleDecreaseO = () => {
    if (oCount > 0) updateOCount(oCount - 1);
  };



  // Navigation logic
  const totalPages = pages ? pages.length : 0;
  const goToPage = (idx: number) => {
    if (!pages || idx < 0 || idx >= totalPages) return;
    const match = pages[idx].match(/page\/([^/]+)$/);
    const filename = match ? match[1] : "";
    navigate(`/doujinshi/${id}/page/${filename}`, {
      state: { pages, currentIdx: idx },
    });
    setCurrentIdx(idx);
  };

  // Show UI overlays on center click, navigate on left/right
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pages || currentIdx === null) return;
    const { clientX, currentTarget } = e;
    const { width, left } = currentTarget.getBoundingClientRect();
    const x = clientX - left;

    if (x < width / 3) {
      goToPage(currentIdx - 1);
    } else if (x > (2 * width) / 3) {
      goToPage(currentIdx + 1);
    } else {
      setShowUI((prev) => !prev);
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
      if (!showUI) {
        hideUITimer.current = setTimeout(() => setShowUI(false), 3000);
      }
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }
  if (error || !pages || currentIdx === null) {
    return <div className="text-white">{error || "No page data provided."}</div>;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center select-none z-50"
      onClick={handleScreenClick}
      style={{ cursor: "pointer", touchAction: "manipulation" }}
    >
      {/* UI overlays, shown only if showUI is true */}
      {showUI && (
        <>
          {/* Fullscreen button (show only if not already in fullscreen) */}
          {!isFullscreen && (
            <button
              onClick={e => {
                e.stopPropagation();
                enterFullscreen();
              }}
              className="absolute top-6 left-24 bg-black/60 rounded p-2 hover:bg-black/80 transition text-white"
              style={{ zIndex: 10 }}
              aria-label="Enter Fullscreen"
              title="Enter Fullscreen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8-16h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3" />
              </svg>
            </button>
          )}

          {/* Back to overview icon */}
          <Link
            to={`/doujinshi/${id}`}
            className="absolute top-6 left-8 bg-black/60 rounded p-2 hover:bg-black/80 transition"
            style={{ zIndex: 10 }}
            aria-label="Back to overview"
            onClick={e => e.stopPropagation()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Page counter in top right */}
          <span
            className="absolute top-6 right-8 text-white bg-black/60 px-4 py-2 rounded text-lg"
            style={{ pointerEvents: "none" }}
          >
            Page {currentIdx + 1} / {totalPages}
          </span>
        </>
      )}

      <img
        src={pages[currentIdx]}
        alt={`Page ${currentIdx + 1}`}
        className="w-screen h-screen object-contain"
        draggable={false}
      />

      {showUI && (
        <>
          {/* O count button in bottom right */}
          <div className="absolute bottom-8 right-8 flex flex-col items-end z-20">
            <button
              onClick={e => {
                e.stopPropagation();
                handleIncreaseO();
              }}
              className="rounded-full p-4 bg-black/60 text-white text-2xl flex items-center justify-center hover:bg-indigo-600 transition mb-2"
              aria-label="Increase O count"
              title="Increase O count"
            >
              <span className="mr-2">O</span>
              <span className="text-lg font-bold">+</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="bg-black/60 px-3 py-1 rounded text-lg text-white">{oCount}</span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleDecreaseO();
                }}
                className="rounded-full p-2 bg-black/60 text-white text-lg flex items-center justify-center hover:bg-red-600 transition"
                aria-label="Decrease O count"
                title="Decrease O count"
                disabled={oCount === 0}
              >
                <span>-</span>
              </button>
            </div>
          </div>

          {/* Bookmark button in bottom left */}
          <button
            onClick={e => {
              e.stopPropagation();
              handleAddBookmark();
            }}
            className={`absolute bottom-8 left-8 rounded-full p-4 flex items-center justify-center transition
        ${isBookmarked ? "bg-green-600 text-white" : "bg-black/60 text-white hover:bg-indigo-600"}`}
            style={{ zIndex: 20 }}
            aria-label="Bookmark this page"
            title="Bookmark this page"
          >
            {isBookmarked ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <polygon points="12 2 22 12 12 22 2 12" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <polygon points="12 2 22 12 12 22 2 12" />
              </svg>
            )}
          </button>

          {bookmarkStatus === "saving" && (
            <span className="absolute bottom-20 left-8 text-xs text-indigo-300">Saving...</span>
          )}
          {bookmarkStatus === "saved" && (
            <span className="absolute bottom-20 left-8 text-xs text-green-400">Bookmarked!</span>
          )}
          {bookmarkStatus === "error" && (
            <span className="absolute bottom-20 left-8 text-xs text-red-400">Error</span>
          )}
        </>
      )}

    </div>
  );

};

export default DoujinshiReader;

