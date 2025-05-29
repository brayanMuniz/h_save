import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";

const DoujinshiReader = () => {
  const { id, pageNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [pages, setPages] = useState<string[] | null>(location.state?.pages || null);
  const [currentIdx, setCurrentIdx] = useState<number | null>(location.state?.currentIdx ?? null);
  const [loading, setLoading] = useState(!pages);
  const [error, setError] = useState<string | null>(null);

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

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const { width, left } = currentTarget.getBoundingClientRect();
    const x = clientX - left;
    if (x < width / 2) {
      goToPage(currentIdx - 1);
    } else {
      goToPage(currentIdx + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center select-none"
      onClick={handleImageClick}
      style={{ cursor: "pointer" }}
    >
      {/* Back to overview icon */}
      <Link
        to={`/doujinshi/${id}`}
        className="absolute top-6 left-8 bg-black/60 rounded p-2 hover:bg-black/80 transition"
        style={{ zIndex: 10 }}
        aria-label="Back to overview"
        onClick={e => e.stopPropagation()} // Prevents click from triggering page nav
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

