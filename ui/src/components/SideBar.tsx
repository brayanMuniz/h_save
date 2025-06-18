import React from "react";
import { Link } from "react-router-dom";
import SettingsButton from "./SettingsButton";

interface SidebarProps { }

const Sidebar: React.FC<SidebarProps> = () => (
  <aside
    className="hidden lg:flex w-64 h-screen bg-gray-800 text-gray-200 
    flex-col p-6 rounded-r-2xl fixed top-0 left-0 z-40"
  >
    <Link to="/" className="hover:text-indigo-400 transition py-1">

      <h2 className="text-2xl font-bold mb-6">Ecchi</h2>
    </Link>

    <nav className="flex flex-col gap-4 mb-auto">
      <Link to="/browse" className="hover:text-indigo-400 transition py-1">
        🔍 Browse
      </Link>

      <Link to="/tags" className="hover:text-indigo-400 transition py-1">
        🏷️ Tags
      </Link>

      <Link to="/artists" className="hover:text-indigo-400 transition py-1">
        🎨 Artists
      </Link>

      <Link to="/groups" className="hover:text-indigo-400 transition py-1">
        👥 Groups
      </Link>

      <Link to="/characters" className="hover:text-indigo-400 transition py-1">
        🧑‍🎤 Characters
      </Link>

      <Link to="/parodies" className="hover:text-indigo-400 transition py-1">
        🎭 Parodies
      </Link>

      <Link to="/gallery" className="hover:text-indigo-400 transition py-1">
        Gallery
      </Link>

    </nav>

    {/* Bottom Actions */}
    <div className="flex flex-row justify-between items-center gap-2 pt-4 border-t border-gray-700">
      <SettingsButton />
    </div>
  </aside>
);

export default Sidebar;
