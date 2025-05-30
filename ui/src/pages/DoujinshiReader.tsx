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

  const [pages, setPages] = useState<string[] | null>(location.state?.pages || null);
  const [currentIdx, setCurrentIdx] = useState<number | null>(location.state?.currentIdx ?? null);
  const [loading, setLoading] = useState(!pages);
  const [error, setError] = useState<string | null>(null);

  // UI overlay state
  const [showUI, setShowUI] = useState(true);
  const hideUITimer = useRef<number | null>(null);

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

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }
  if (error || !pages || currentIdx === null) {
    return <div className="text-white">{error || "No page data provided."}</div>;
  }

  const totalPages = pages.length;

  const goToPage = (idx: number) => {
    if (idx < 0 || idx >= totalPages) return;
    const match = pages[idx].match(/page\/([^/]+)$/);
    const filename = match ? match[1] : "";
    navigate(`/doujinshi/${id}/page/${filename}`, {
      state: { pages, currentIdx: idx },
    });
    setCurrentIdx(idx);
  };

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const { width, left } = currentTarget.getBoundingClientRect();
    const x = clientX - left;

    // Divide into thirds
    if (x < width / 3) {
      goToPage(currentIdx - 1);
    } else if (x > (2 * width) / 3) {
      goToPage(currentIdx + 1);
    } else {
      // Center third: toggle UI overlays
      setShowUI((prev) => !prev);
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
      if (!showUI) {
        // If showing UI, auto-hide after 3 seconds
        hideUITimer.current = setTimeout(() => setShowUI(false), 3000);
      }
    }
  };

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
    </div>
  );

};

export default DoujinshiReader;

