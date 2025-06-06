import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import DoujinshiReader from "./pages/DoujinshiReader";
import DoujinshiOverview from "./pages/DoujinshiOverview";
import BrowsePage from "./pages/BrowsePage";
import Settings from "./pages/Settings";

import Artists from "./pages/Artists";
import ArtistPage from "./pages/ArtistPage";

import TagsPage from "./pages/TagsPage";
import TagPage from "./pages/TagPage";

import GroupsPage from "./pages/GroupsPage";
import GroupPage from "./pages/GroupPage";

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
            <BrowsePage />
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
          path="/tags/"
          element={
            <TagsPage />
          }
        />

        <Route
          path="/tag/:tag"
          element={
            <TagPage />
          }
        />

        <Route
          path="/groups"
          element={
            <GroupsPage />
          }
        />

        <Route
          path="/group/:group"
          element={
            <GroupPage />
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
