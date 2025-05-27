import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const DoujinshiReader = () => {
  const { galleryId, pageNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // State for pages and current index
  const [pages, setPages] = useState<string[] | null>(
    location.state?.pages || null
  );
  const [currentIdx, setCurrentIdx] = useState<number | null>(
    location.state?.currentIdx ?? null
  );
  const [loading, setLoading] = useState(!pages);
  const [error, setError] = useState<string | null>(null);

  // Fetch pages if not provided
  useEffect(() => {
    if (pages && currentIdx !== null) return;

    if (!galleryId || !pageNumber) {
      setError("No page data provided.");
      return;
    }

    setLoading(true);
    fetch(`/api/doujinshi/${galleryId}/pages`)
      .then((res) => res.json())
      .then((data) => {
        const pageList: string[] = data.pages || [];
        setPages(pageList);

        // Find the index of the current pageNumber in the filenames
        const idx = pageList.findIndex((url) =>
          url.endsWith(`/page/${pageNumber}`)
        );
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
  }, [galleryId, pageNumber, pages, currentIdx]);

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }
  if (error || !pages || currentIdx === null) {
    return <div className="text-white">{error || "No page data provided."}</div>;
  }

  const totalPages = pages.length;

  // Navigation handlers
  const goToPage = (idx: number) => {
    if (idx < 0 || idx >= totalPages) return;
    const match = pages[idx].match(/page\/([^/]+)$/);
    const filename = match ? match[1] : "";
    navigate(`/doujinshi/${galleryId}/page/${filename}`, {
      state: { pages, currentIdx: idx },
    });
    setCurrentIdx(idx);
  };

  return (
    <div className="w-screen h-screen bg-black flex flex-col items-center justify-center overflow-auto">
      <div className="flex items-center justify-between w-full px-8 py-4">
        <button
          onClick={() => goToPage(currentIdx - 1)}
          disabled={currentIdx === 0}
          className="text-white px-4 py-2 rounded bg-gray-700 disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-gray-300">
          Page {currentIdx + 1} / {totalPages}
        </span>
        <button
          onClick={() => goToPage(currentIdx + 1)}
          disabled={currentIdx === totalPages - 1}
          className="text-white px-4 py-2 rounded bg-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <img
        src={pages[currentIdx]}
        alt={`Page ${currentIdx + 1}`}
        className="w-screen h-screen object-contain"
      />
    </div>
  );
};

export default DoujinshiReader;

