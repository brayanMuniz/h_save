import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const DoujinshiReader = () => {
  const { galleryId } = useParams();
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!galleryId) return;
    fetch(`/api/doujinshi/${galleryId}/pages`)
      .then((res) => res.json())
      .then((data) => {
        setPages(data.pages || []);
        setLoading(false);
      });
  }, [galleryId]);

  if (loading) return <div className="text-white">Loading pages...</div>;

  return (
    <div className="flex flex-col items-center">

      {pages.map((url, idx) => (
        <img
          key={idx}
          src={url}
          alt={`Page ${idx + 1}`}
          className="mb-4 max-w-full rounded shadow"
        />
      ))}
    </div>
  );
};

export default DoujinshiReader;

