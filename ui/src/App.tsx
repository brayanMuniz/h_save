import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import DoujinshiReader from "./components/DoujinshiReader";

function App() {
  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doujinshi/:galleryId" element={<DoujinshiReader />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
