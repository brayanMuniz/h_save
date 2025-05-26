import { useEffect, useState } from "react";
import DoujinshiCard from "./components/DoujinshiCard";
import type { Doujinshi } from "./types";
import "./App.css";

function App() {
  const [doujinshi, setDoujinshi] = useState<Doujinshi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/doujinshi")
      .then((res) => res.json())
      .then((data) => {
        console.log(data.doujinshi)
        setDoujinshi(data.doujinshi || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-white">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {doujinshi.map((d) => (
              <DoujinshiCard key={d.GalleryID} doujinshi={d} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
