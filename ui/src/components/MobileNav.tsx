import React from "react";
import { Link } from "react-router-dom";
import SettingsButton from "./SettingsButton";

interface MobileNavProps { }

const MobileNav: React.FC<MobileNavProps> = () => (
  <nav className="lg:hidden sticky top-0 z-30 bg-gray-800 text-gray-200 p-3 shadow-md">
    <div className="flex flex-wrap justify-center items-center gap-x-3 sm:gap-x-4 gap-y-2">
      <Link
        to="/"
        className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition"
      >
        🏠 Home
      </Link>

      <Link
        to="/gallery"
        className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition"
      >
        🖼️ Gallery
      </Link>

      <Link to="/tags" className="hover:text-indigo-400 transition py-1">
        🏷️ Tags
      </Link>

      <Link
        to="/browse"
        className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition"
      >
        🔍 Browse
      </Link>

      <Link
        to="/artists"
        className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition"
      >
        🎨 Artists
      </Link>

      <Link
        to="/groups"
        className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition"
      >
        👥 Groups
      </Link>

      <Link to="/characters" className="hover:text-indigo-400 transition py-1">
        🧑‍🎤 Characters
      </Link>

      <Link to="/parodies" className="hover:text-indigo-400 transition py-1">
        🎭 Parodies
      </Link>

      <div className="ml-auto">
        <SettingsButton />
      </div>
    </div>
  </nav>
);

export default MobileNav;
