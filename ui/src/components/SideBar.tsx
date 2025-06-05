import { Link } from 'react-router-dom';

const Sidebar = () => (
  <aside className="hidden lg:flex w-64 h-screen bg-gray-800 text-gray-200 flex-col p-6 
    rounded-r-2xl fixed top-0 left-0 z-40">
    <h2 className="text-2xl font-bold mb-6">Library</h2>
    <nav className="flex flex-col gap-4 mb-auto">
      <Link to="/" className="hover:text-indigo-400 transition py-1">
        🏠 Home
      </Link>
      <Link to="/browse" className="hover:text-indigo-400 transition py-1">
        🔍 Browse
      </Link>
      <Link to="/artists" className="hover:text-indigo-400 transition py-1">
        🎨 Artists
      </Link>
      <Link to="/groups" className="hover:text-indigo-400 transition py-1">
        👥 Groups
      </Link>
      <button type="button" className="text-left hover:text-indigo-400 transition py-1">
        🏷️ Tags
      </button>
      <button type="button" className="text-left hover:text-indigo-400 transition py-1">
        🧑‍🎤 Characters
      </button>
      <button type="button" className="text-left hover:text-indigo-400 transition py-1">
        🎭 Parodies
      </button>
    </nav>
  </aside>
);

export default Sidebar;
