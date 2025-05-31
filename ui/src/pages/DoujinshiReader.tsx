import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import React from "react"; // Ensure React is imported for JSX

// Simple SVG Minus Icon
const MinusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5" // Adjust size as needed
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
  </svg>
);

// Simple SVG Plus Icon
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5" // Adjust size as needed
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

// OCounter Component
interface OCounterProps {
  count: number;
  setCount: (newCount: number) => void; // Expects a function that takes the new count
  minCount?: number;
  maxCount?: number;
}

const OCounter: React.FC<OCounterProps> = ({
  count,
  setCount,
  minCount = 0,
  maxCount = Infinity,
}) => {
  const handleDecrement = () => {
    setCount(Math.max(minCount, count - 1));
  };

  const handleIncrement = () => {
    setCount(Math.min(maxCount, count + 1));
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-gray-800/80 rounded-lg shadow">
      {/* Adjusted background to bg-gray-800/80 for better blend with overlays */}
      <button
        onClick={handleDecrement}
        disabled={count <= minCount}
        className="px-2 py-2 bg-gray-700/80 text-white rounded hover:bg-gray-600/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Decrement count"
        title="Decrement"
      >
        <MinusIcon />
      </button>

      <span className="text-xl font-medium text-white w-10 text-center select-none">
        {count}
      </span>

      <button
        onClick={handleIncrement}
        disabled={count >= maxCount}
        className="px-2 py-2 bg-gray-700/80 text-white rounded hover:bg-gray-600/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Increment count"
        title="Increment"
      >
        <PlusIcon />
      </button>
    </div>
  );
};

// --- End of Helper Components ---

const DoujinshiReader = () => {
  const { id, pageNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = () => {
    if (containerRef.current && containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const [pages, setPages] = useState<string[] | null>(
    location.state?.pages || null
  );
  const [currentIdx, setCurrentIdx] = useState<number | null>(
    location.state?.currentIdx ?? null
  );
  const [loading, setLoading] = useState(!pages);
  const [error, setError] = useState<string | null>(null);

  const [showUI, setShowUI] = useState(true);
  const hideUITimer = useRef<number | null>(null);

  const [bookmarks, setBookmarks] = useState<
    { filename: string; name: string }[]
  >([]);
  const [bookmarkStatus, setBookmarkStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    if (pages && currentIdx !== null) return;
    if (!id || !pageNumber) {
      setError("No page data provided.");
      setLoading(false); // Ensure loading is set to false
      return;
    }
    setLoading(true);
    fetch(`/api/doujinshi/${id}/pages`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        const pageList: string[] = data.pages || [];
        setPages(pageList);
        const idx = pageList.findIndex((url) =>
          url.endsWith(`/page/${pageNumber}`)
        );
        if (idx === -1) {
          setError("Page not found.");
        } else {
          setCurrentIdx(idx);
          setError(null); // Clear previous errors
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load page data.");
        setLoading(false);
      });
  }, [id, pageNumber, pages, currentIdx]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/user/doujinshi/${id}/bookmarks`)
      .then((res) => res.json())
      .then((data) => setBookmarks(data.bookmarks || []));
  }, [id]);

  const filename =
    pages && currentIdx !== null
      ? (() => {
        const match = pages[currentIdx].match(/page\/([^/]+)$/);
        return match ? match[1] : "";
      })()
      : "";

  const isBookmarked = bookmarks.some((bm) => bm.filename === filename);

  const handleAddBookmark = async () => {
    if (!id || !filename) return;
    setBookmarkStatus("saving");
    try {
      const res = await fetch(`/api/user/doujinshi/${id}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          name: "",
        }),
      });
      if (res.ok) {
        setBookmarkStatus("saved");
        setTimeout(() => setBookmarkStatus("idle"), 1500);
        fetch(`/api/user/doujinshi/${id}/bookmarks`) // Refetch bookmarks
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

  useEffect(() => {
    if (!id || !filename) return;
    fetch(`/api/user/doujinshi/${id}/o?filename=${encodeURIComponent(filename)}`)
      .then((res) => res.json())
      .then((data) => setOCount(data.oCount ?? 0));
  }, [id, filename]);

  // This function will be passed to OCounter
  const updateOCount = async (newCount: number) => {
    if (!id || !filename) return;
    setOCount(newCount); // Optimistic update
    try {
      await fetch(`/api/user/doujinshi/${id}/o`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, oCount: newCount }),
      });
    } catch (apiError) {
      console.error("Failed to update O count:", apiError);
    }
  };

  const totalPages = pages ? pages.length : 0;
  const goToPage = (idx: number) => {
    if (!pages || idx < 0 || idx >= totalPages) return;
    const nextPageFilename = (() => {
      const match = pages[idx].match(/page\/([^/]+)$/);
      return match ? match[1] : "";
    })();
    if (nextPageFilename) {
      navigate(`/doujinshi/${id}/page/${nextPageFilename}`, {
        state: { pages, currentIdx: idx },
      });
      setCurrentIdx(idx); // Update currentIdx immediately for current session
    }
  };

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
      setShowUI((prev) => {
        const newShowUI = !prev;
        if (hideUITimer.current) clearTimeout(hideUITimer.current);
        if (newShowUI) {
          // If UI is now shown, set a timer to hide it
          hideUITimer.current = window.setTimeout(() => setShowUI(false), 3000);
        }
        return newShowUI;
      });
    }
  };

  // Auto-hide UI after a delay when it's shown
  useEffect(() => {
    if (showUI) {
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
      hideUITimer.current = window.setTimeout(() => {
        setShowUI(false);
      }, 3000); // Hide after 3 seconds
    }
    // Cleanup timer on unmount or if showUI becomes false
    return () => {
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
    };
  }, [showUI]); // Rerun when showUI changes

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white text-xl">
        Loading page...
      </div>
    );
  }
  if (error || !pages || currentIdx === null) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white text-xl p-8 text-center">
        <p>{error || "No page data provided or page not found."}</p>
        <Link
          to="/"
          className="mt-4 px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 transition"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center select-none z-50"
      onClick={handleScreenClick}
      style={{ cursor: "pointer", touchAction: "manipulation" }}
    >
      {showUI && (
        <>
          {!isFullscreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                enterFullscreen();
              }}
              className="absolute top-6 left-24 bg-black/60 rounded p-2 hover:bg-black/80 transition text-white"
              style={{ zIndex: 60 }} // Ensure UI elements are above image
              aria-label="Enter Fullscreen"
              title="Enter Fullscreen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8-16h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3"
                />
              </svg>
            </button>
          )}
          <Link
            to={`/doujinshi/${id}`}
            className="absolute top-6 left-8 bg-black/60 rounded p-2 hover:bg-black/80 transition"
            style={{ zIndex: 60 }}
            aria-label="Back to overview"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <span
            className="absolute top-6 right-8 text-white bg-black/60 px-4 py-2 rounded text-lg"
            style={{ pointerEvents: "none", zIndex: 60 }}
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
        style={{ zIndex: 50 }} // Ensure image is below UI overlays
      />

      {showUI && (
        <>
          {/* OCounter in bottom right */}
          <div
            className="absolute bottom-8 right-8 z-60" // Ensure UI elements are above image
            onClick={(e) => e.stopPropagation()} // Prevent main screen click
          >
            <OCounter
              count={oCount}
              setCount={updateOCount}
              minCount={0}
            // maxCount={/* Optional: some upper limit */}
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddBookmark();
            }}
            className={`absolute bottom-8 left-8 rounded-full p-3 flex items-center justify-center transition
              ${isBookmarked
                ? "bg-green-500 hover:bg-green-400 text-white"
                : "bg-black/60 text-white hover:bg-indigo-600"
              }`}
            style={{ zIndex: 60 }}
            aria-label={isBookmarked ? "Remove Bookmark" : "Bookmark this page"}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark this page"}
          >
            {isBookmarked ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            )}
          </button>

          {(bookmarkStatus === "saving" ||
            bookmarkStatus === "saved" ||
            bookmarkStatus === "error") && (
              <span
                className={`absolute bottom-20 left-8 text-xs px-2 py-1 rounded
                ${bookmarkStatus === "saving" ? "bg-blue-500/70 text-white" : ""}
                ${bookmarkStatus === "saved" ? "bg-green-500/70 text-white" : ""}
                ${bookmarkStatus === "error" ? "bg-red-500/70 text-white" : ""}`}
                style={{ zIndex: 60 }}
              >
                {bookmarkStatus === "saving" && "Saving bookmark..."}
                {bookmarkStatus === "saved" && "Bookmarked!"}
                {bookmarkStatus === "error" && "Bookmark error."}
              </span>
            )}
        </>
      )}
    </div>
  );
};

export default DoujinshiReader;
