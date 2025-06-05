import { Link } from 'react-router-dom';

const MobileNav = () => (
  <nav className="lg:hidden sticky top-0 z-30 bg-gray-800 text-gray-200 p-3 shadow-md">
    <div className="flex flex-wrap justify-center items-center gap-x-3 sm:gap-x-4 gap-y-2">
      <Link to="/" className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition">
        🏠 Home
      </Link>
      <Link to="/browse" className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition">
        🔍 Browse
      </Link>
      <Link to="/artists" className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition">
        🎨 Artists
      </Link>
      <Link to="/groups" className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition">
        👥 Groups
      </Link>
      <button type="button" className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition">
        🏷️ Tags
      </button>
      <button type="button" className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition">
        🧑‍🎤 Characters
      </button>
      <button type="button" className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition">
        🎭 Parodies
      </button>
    </div>
  </nav>
);

export default MobileNav;
