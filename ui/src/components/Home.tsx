import { useEffect, useState } from "react";
import DoujinshiCard from "./DoujinshiCard";
import type { Doujinshi } from "../types";

const Home = () => {
  const [doujinshi, setDoujinshi] = useState<Doujinshi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/doujinshi")
      .then((res) => res.json())
      .then((data) => {
        setDoujinshi(data.doujinshi || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {doujinshi.map((d) => (
        <DoujinshiCard key={d.GalleryID} doujinshi={d} />
      ))}
    </div>
  );
};

export default Home;
