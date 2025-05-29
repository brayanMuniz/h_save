import { Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import DoujinshiReader from "./components/DoujinshiReader";
import DoujinshiOverview from "./components/DoujinshiOverview";

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
