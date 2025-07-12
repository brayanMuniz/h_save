import React from "react";
import { Link } from "react-router-dom";
import type { Bookmark } from "../types";

interface BookmarkCardProps {
  bookmark: Bookmark;
  doujinshiTitle: string;
  thumbnailUrl: string;
  linkUrl: string;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, doujinshiTitle, thumbnailUrl, linkUrl }) => {
  // Use the bookmark's thumbnail if available, otherwise fall back to doujinshi thumbnail
  const imageUrl = bookmark.thumbnailUrl || thumbnailUrl;
  
  return (
    <Link to={linkUrl} className="block group relative rounded-lg overflow-hidden shadow hover:shadow-lg transition">
      <img
        src={imageUrl}
        alt={doujinshiTitle}
        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-black/0 px-3 py-2">
        <div className="text-white text-sm font-semibold truncate" title={doujinshiTitle}>{doujinshiTitle}</div>
        {bookmark.name && (
          <div className="text-indigo-300 text-xs truncate" title={bookmark.name}>{bookmark.name}</div>
        )}
      </div>
    </Link>
  );
};

export default BookmarkCard; 