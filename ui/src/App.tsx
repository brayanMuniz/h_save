import { Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import DoujinshiReader from "./components/DoujinshiReader";
import DoujinshiOverview from "./components/DoujinshiOverview";

function App() {
  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doujinshi/:galleryId" element={<DoujinshiOverview />} />
          <Route path="/doujinshi/:galleryId/page/:pageNumber" element={<DoujinshiReader />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
