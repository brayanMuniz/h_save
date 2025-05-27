import { Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import DoujinshiReader from "./components/DoujinshiReader";
import DoujinshiOverview from "./components/DoujinshiOverview";

function App() {
  return (
    <div className="min-h-screen">

      <Routes>
        <Route
          path="/doujinshi/:galleryId/page/:pageNumber"
          element={<DoujinshiReader />}
        />

        <Route
          path="/"
          element={
            <main className="max-w-7xl mx-auto px-4 py-10">
              <Home />
            </main>
          }
        />

        <Route
          path="/doujinshi/:galleryId"
          element={
            <main className="max-w-7xl mx-auto px-4 py-10">
              <DoujinshiOverview />
            </main>
          }
        />

      </Routes>
    </div>
  );
}

export default App;
