import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import DoujinshiReader from "./pages/DoujinshiReader";
import DoujinshiOverview from "./pages/DoujinshiOverview";
import Browse from "./pages/Browse";
import Settings from "./pages/Settings";
import Artists from "./pages/Artists";
import ArtistPage from "./pages/ArtistPage";

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>

        <Route
          path="/"
          element={
            <Home />
          }
        />

        <Route
          path="/browse"
          element={
            <Browse />
          }
        />

        <Route
          path="/artists"
          element={
            <Artists />
          }
        />

        <Route
          path="/artist/:artist"
          element={
            <ArtistPage />
          }
        />

        <Route
          path="/settings"
          element={
            <Settings />
          }
        />

        <Route
          path="/doujinshi/:id"
          element={
            <DoujinshiOverview />
          }
        />

        <Route
          path="/doujinshi/:id/page/:pageNumber"
          element={<DoujinshiReader />}
        />

      </Routes>
    </div>
  );
}

export default App;
