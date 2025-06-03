import { Link } from "react-router-dom";
import type { Doujinshi, BrowseFilters } from "../types";
import HeaderBar from "./HeaderBar";
import CoverImage from "./CoverImage";
import DoujinshiCard from "./DoujinshiCard";
import { getLanguageFlag } from "../utils/utils";

interface Props {
  doujinshi: Doujinshi[];
  viewMode: "card" | "cover";
  setViewMode: (mode: "card" | "cover") => void;
  filters: BrowseFilters;
  setFilters: (filters: BrowseFilters) => void;
}

const BrowseContent = ({
  doujinshi,
  viewMode,
  setViewMode,
  filters,
  setFilters
}: Props) => {
  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <HeaderBar
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <div className="mb-4 text-gray-400 text-sm">
        Showing {doujinshi.length} results
      </div>

      <div
        className={`grid ${viewMode === "cover"
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2"
          : "grid-cols-1 lg:grid-cols-2 gap-4"
          }`}
      >
        {doujinshi.map((d) =>
          viewMode === "cover" ? (
            <Link
              key={d.id}
              to={`/doujinshi/${d.id}`}
              className="block w-full"
            >
              <CoverImage
                imgUrl={d.thumbnail_url}
                flag={getLanguageFlag(d.languages)}
                title={d.title}
                characters={d.characters ?? []}
                tags={d.tags ?? []}
                parodies={d.parodies ?? []}
                oCount={d.oCount}
                rating={d.progress.rating ?? 0}
              />
            </Link>
          ) : (
            <DoujinshiCard key={d.id} doujinshi={d} />
          )
        )}
      </div>

      {doujinshi.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            No results found
          </div>
          <div className="text-gray-500 text-sm">
            Try adjusting your filters or search terms
          </div>
        </div>
      )}
    </main>
  );
};

export default BrowseContent;
