import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import DoujinshiReader from "./pages/DoujinshiReader";
import DoujinshiOverview from "./pages/DoujinshiOverview";
import BrowsePage from "./pages/BrowsePage";
import Settings from "./pages/Settings";

import AllArtistsPage from "./pages/AllArtistPage";
import ArtistPage from "./pages/ArtistPage";

import AllTagsPage from "./pages/AllTagsPage";
import TagPage from "./pages/TagPage";

import AllGroupsPage from "./pages/AllGroupsPage";
import GroupPage from "./pages/GroupPage";

import AllCharactersPage from "./pages/AllCharactersPage";
import CharacterPage from "./pages/CharacterPage";

import AllParodiesPage from "./pages/AllParodiesPage";
import ParodyPage from "./pages/ParodyPage";

import GalleryPage from "./pages/GalleryPage";

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

        <Route path="/artists" element={<AllArtistsPage />} />
        <Route path="/artist/:artist" element={<ArtistPage />} />

        <Route
          path="/tags/"
          element={
            <AllTagsPage />
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
            <AllGroupsPage />
          }
        />

        <Route
          path="/group/:group"
          element={
            <GroupPage />
          }
        />

        <Route
          path="/characters"
          element={
            <AllCharactersPage />
          }
        />

        <Route
          path="/character/:character"
          element={
            <CharacterPage />
          }
        />


        <Route
          path="/parodies"
          element={
            <AllParodiesPage />
          }
        />

        <Route
          path="/parody/:parody"
          element={
            <ParodyPage />
          }
        />

        <Route path="/gallery" element={<GalleryPage />} />

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
