import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import React from "react";

// Simple SVG Minus Icon
const MinusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
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
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

// Play Icon
const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
    />
  </svg>
);

// Stop Icon
const StopIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
    />
  </svg>
);

// OCounter Component
interface OCounterProps {
  count: number;
  setCount: (newCount: number) => void;
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

// Interval Counter Component for Autoplay
interface IntervalCounterProps {
  interval: number;
  setInterval: (newInterval: number) => void;
  disabled?: boolean;
}

const IntervalCounter: React.FC<IntervalCounterProps> = ({
  interval,
  setInterval,
  disabled = false,
}) => {
  const handleDecrement = () => {
    setInterval(Math.max(1, interval - 1));
  };

  const handleIncrement = () => {
    setInterval(Math.min(30, interval + 1));
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-gray-800/80 rounded-lg shadow">
      <button
        onClick={handleDecrement}
        disabled={disabled || interval <= 1}
        className="px-2 py-2 bg-gray-700/80 text-white rounded hover:bg-gray-600/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Decrease interval"
        title="Decrease interval"
      >
        <MinusIcon />
      </button>

      <div className="flex items-center gap-1 min-w-[60px] justify-center">
        <span className="text-lg font-medium text-white select-none">
          {interval}
        </span>
        <span className="text-sm text-gray-300 select-none">s</span>
      </div>

      <button
        onClick={handleIncrement}
        disabled={disabled || interval >= 30}
        className="px-2 py-2 bg-gray-700/80 text-white rounded hover:bg-gray-600/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Increase interval"
        title="Increase interval"
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

  // Autoplay state
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(3);
  const autoPlayTimer = useRef<number | null>(null);

  useEffect(() => {
    if (pages && currentIdx !== null) return;
    if (!id || !pageNumber) {
      setError("No page data provided.");
      setLoading(false);
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
          setError(null);
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

  useEffect(() => {
    if (!id || !filename) return;
    fetch(
      `/api/user/doujinshi/${id}/o?filename=${encodeURIComponent(filename)}`
    )
      .then((res) => res.json())
      .then((data) => setOCount(data.oCount ?? 0));
  }, [id, filename]);

  const updateOCount = async (newCount: number) => {
    if (!id || !filename) return;
    setOCount(newCount);
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

  const goToPage = useCallback(
    (idx: number) => {
      if (!pages || idx < 0 || idx >= totalPages) return;
      const nextPageFilename = (() => {
        const match = pages[idx].match(/page\/([^/]+)$/);
        return match ? match[1] : "";
      })();
      if (nextPageFilename) {
        navigate(`/doujinshi/${id}/page/${nextPageFilename}`, {
          state: { pages, currentIdx: idx },
        });
        setCurrentIdx(idx);
      }
    },
    [pages, totalPages, navigate, id]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (currentIdx === null) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goToPage(currentIdx - 1);
          break;
        case "ArrowRight":
          event.preventDefault();
          goToPage(currentIdx + 1);
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIdx, goToPage]);

  // Autoplay logic
  const startAutoPlay = useCallback(() => {
    if (autoPlayTimer.current) {
      clearTimeout(autoPlayTimer.current);
    }

    const nextPage = () => {
      if (currentIdx !== null && currentIdx < totalPages - 1) {
        goToPage(currentIdx + 1);
        // Set timer for next page
        autoPlayTimer.current = window.setTimeout(
          nextPage,
          autoPlayInterval * 1000
        );
      } else {
        // Reached the end, stop autoplay
        setIsAutoPlaying(false);
      }
    };

    autoPlayTimer.current = window.setTimeout(
      nextPage,
      autoPlayInterval * 1000
    );
  }, [currentIdx, totalPages, goToPage, autoPlayInterval]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimer.current) {
      clearTimeout(autoPlayTimer.current);
      autoPlayTimer.current = null;
    }
    setIsAutoPlaying(false);
  }, []);

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      stopAutoPlay();
    } else {
      if (currentIdx !== null && currentIdx < totalPages - 1) {
        setIsAutoPlaying(true);
        startAutoPlay();
      }
    }
  };

  // Stop autoplay when reaching the end or when component unmounts
  useEffect(() => {
    if (isAutoPlaying && currentIdx !== null && currentIdx >= totalPages - 1) {
      stopAutoPlay();
    }
  }, [currentIdx, totalPages, isAutoPlaying, stopAutoPlay]);

  // Restart autoplay timer when interval changes
  useEffect(() => {
    if (isAutoPlaying) {
      stopAutoPlay();
      setIsAutoPlaying(true);
      startAutoPlay();
    }
  }, [autoPlayInterval, isAutoPlaying, startAutoPlay, stopAutoPlay]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimer.current) {
        clearTimeout(autoPlayTimer.current);
      }
    };
  }, []);

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
          hideUITimer.current = window.setTimeout(
            () => setShowUI(false),
            3000
          );
        }
        return newShowUI;
      });
    }
  };

  useEffect(() => {
    if (showUI) {
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
      hideUITimer.current = window.setTimeout(() => {
        setShowUI(false);
      }, 4000);
    }
    return () => {
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
    };
  }, [showUI]);

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
              style={{ zIndex: 60 }}
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

          {/* Page counter */}
          <span
            className="absolute top-6 right-8 text-white bg-black/60 px-4 py-2 rounded text-lg"
            style={{ pointerEvents: "none", zIndex: 60 }}
          >
            Page {currentIdx + 1} / {totalPages}
          </span>

          {/* Autoplay controls - positioned below page counter */}
          <div
            className="absolute top-20 right-8 flex items-center gap-3 bg-black/60 px-4 py-2 rounded-lg"
            style={{ zIndex: 60 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">Autoplay:</span>
              <IntervalCounter
                interval={autoPlayInterval}
                setInterval={setAutoPlayInterval}
                disabled={isAutoPlaying}
              />
            </div>

            <button
              onClick={toggleAutoPlay}
              disabled={currentIdx >= totalPages - 1}
              className={`p-2 rounded-full transition ${isAutoPlaying
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-green-600 hover:bg-green-500 text-white disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              aria-label={isAutoPlaying ? "Stop autoplay" : "Start autoplay"}
              title={isAutoPlaying ? "Stop autoplay" : "Start autoplay"}
            >
              {isAutoPlaying ? <StopIcon /> : <PlayIcon />}
            </button>
          </div>
        </>
      )}

      <img
        src={pages[currentIdx]}
        alt={`Page ${currentIdx + 1}`}
        className="w-screen h-screen object-contain"
        draggable={false}
        style={{ zIndex: 50 }}
      />

      {showUI && (
        <>
          {/* OCounter in bottom right */}
          <div
            className="absolute bottom-8 right-8 z-60"
            onClick={(e) => e.stopPropagation()}
          >
            <OCounter count={oCount} setCount={updateOCount} minCount={0} />
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
            aria-label={
              isBookmarked ? "Remove Bookmark" : "Bookmark this page"
            }
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
                ${bookmarkStatus === "saving"
                    ? "bg-blue-500/70 text-white"
                    : ""
                  }
                ${bookmarkStatus === "saved"
                    ? "bg-green-500/70 text-white"
                    : ""
                  }
                ${bookmarkStatus === "error" ? "bg-red-500/70 text-white" : ""
                  }`}
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
