import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";

import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import HeaderBar from "../components/HeaderBar";
import CoverImage from "../components/CoverImage";
import DoujinshiCard from "../components/DoujinshiCard";
import ImageViewer from "../components/ImageViewer";

import type {
  Doujinshi,
  EntityPageResponse,
  SortState,
  Image,
} from "../types";

interface ImageWithLayout extends Image {
  displayWidth: number;
  displayHeight: number;
  aspectRatio: number;
}

interface LayoutRow {
  images: ImageWithLayout[];
  totalWidth: number;
  maxHeight: number;
}

interface EntityDetailPageProps {
  entityTypeSingular: string;
  entityTypePlural: string;
  paramName: string;
  apiEndpointPrefix: string;
  favoriteApiEndpointPrefix: string;
  detailsResponseKey: string;
  backLink: string;
  icon: string;
}

const EntityDetailPage: React.FC<EntityDetailPageProps> = ({
  entityTypeSingular,
  entityTypePlural,
  paramName,
  apiEndpointPrefix,
  favoriteApiEndpointPrefix,
  detailsResponseKey,
  backLink,
  icon,
}) => {
  const params = useParams<{ [key: string]: string }>();
  const entityName = params[paramName];

  const [data, setData] = useState<EntityPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"card" | "cover">("cover");
  const [sort, setSort] = useState<SortState>({
    key: "uploaded",
    order: "desc",
  });

  // Separate state for images
  const [images, setImages] = useState<Image[]>([]);
  const [imageViewMode, setImageViewMode] = useState<"card" | "cover">("cover");
  const [imageSort, setImageSort] = useState<SortState>({
    key: "uploaded",
    order: "desc",
  });

  // Masonry layout state
  const [containerWidth, setContainerWidth] = useState(1200);
  const [layoutRows, setLayoutRows] = useState<LayoutRow[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const TARGET_ROW_HEIGHT = 250;

  const [isLinkUnlocked, setIsLinkUnlocked] = useState(false);

  // Image viewer state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Update container width
  const updateWidth = useCallback(() => {
    if (mainContentRef.current) {
      const rect = mainContentRef.current.getBoundingClientRect();
      const availableWidth = rect.width - 48; // Account for padding
      const newWidth = Math.max(300, availableWidth);

      if (Math.abs(newWidth - containerWidth) > 10) {
        setContainerWidth(newWidth);
      }
    }
  }, [containerWidth]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(updateWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateWidth]);

  useEffect(() => {
    if (!entityName) {
      setError(`No ${entityTypeSingular.toLowerCase()} name provided`);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsLinkUnlocked(false); // Reset lock on new page load
        const url = `${apiEndpointPrefix}/0?name=${encodeURIComponent(
          entityName,
        )}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `HTTP ${response.status}`);
        }

        const responseData = await response.json();
        const normalizedData: EntityPageResponse = {
          details: responseData[detailsResponseKey],
          doujinshiList: responseData.doujinshiList,
          imagesList: responseData.imagesList || [],
        };
        setData(normalizedData);
        setImages(responseData.imagesList || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [entityName, apiEndpointPrefix, detailsResponseKey, entityTypeSingular]);

  const handleToggleFavorite = async () => {
    if (!data) return;
    const originalData = data;
    const { id, isFavorite } = data.details;

    setData((prev) =>
      prev ? { ...prev, details: { ...prev.details, isFavorite: !isFavorite } } : null,
    );

    try {
      const method = isFavorite ? "DELETE" : "POST";
      const response = await fetch(`${favoriteApiEndpointPrefix}/${id}`, {
        method,
      });
      if (!response.ok) throw new Error("Failed to update favorite status");
    } catch (err) {
      setData(originalData);
      alert(`Error: Could not update favorite status.`);
    }
  };

  const externalLinkUrl = useMemo(() => {
    if (!data?.details.name || !entityTypeSingular) return "#";
    const formattedName = data.details.name.toLowerCase().replace(/ /g, "-");
    const type = entityTypeSingular.toLowerCase();
    return `https://nhentai.net/${type}/${formattedName}`;
  }, [data?.details.name, entityTypeSingular]);

  const sortedDoujinshi = useMemo(() => {
    if (!data?.doujinshiList) return [];
    const sorted = [...data.doujinshiList];

    if (sort.key === "random") {
      // Fisher-Yates shuffle for true randomness
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
    } else {
      // Regular sorting logic
      sorted.sort((a, b) => {
        const order = sort.order === "asc" ? 1 : -1;
        switch (sort.key) {
          case "title":
            return a.title.localeCompare(b.title) * order;
          case "uploaded":
            return (
              (new Date(a.uploaded).getTime() -
                new Date(b.uploaded).getTime()) *
              order
            );
          case "rating":
            return ((a.progress?.rating ?? 0) - (b.progress?.rating ?? 0)) * order;
          case "oCount":
            return (a.oCount - b.oCount) * order;
          default:
            return 0;
        }
      });
    }

    return sorted;
  }, [data?.doujinshiList, sort]);

  const sortedImages = useMemo(() => {
    if (!images) return [];
    const sorted = [...images];

    if (imageSort.key === "random") {
      // Fisher-Yates shuffle for true randomness
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
    } else {
      // Regular sorting logic
      sorted.sort((a, b) => {
        const order = imageSort.order === "asc" ? 1 : -1;
        switch (imageSort.key) {
          case "title":
            return a.filename.localeCompare(b.filename) * order;
          case "uploaded":
            return (
              (new Date(a.uploaded).getTime() -
                new Date(b.uploaded).getTime()) *
              order
            );
          case "rating":
            return (a.rating - b.rating) * order;
          case "oCount":
            return (a.o_count - b.o_count) * order;
          default:
            return 0;
        }
      });
    }

    return sorted;
  }, [images, imageSort]);

  const imagesWithLayout = useMemo(() => {
    return sortedImages.map(image => {
      const aspectRatio = image.width / image.height;
      const displayHeight = TARGET_ROW_HEIGHT;
      const displayWidth = displayHeight * aspectRatio;

      return {
        ...image,
        aspectRatio,
        displayWidth,
        displayHeight
      } as ImageWithLayout;
    });
  }, [sortedImages]);

  // Pack images into rows
  const packImagesIntoRows = useCallback((images: ImageWithLayout[]): LayoutRow[] => {
    const rows: LayoutRow[] = [];
    let currentRow: ImageWithLayout[] = [];
    let currentRowWidth = 0;
    const GAP_SIZE = 4;

    for (const image of images) {
      const imageWidthWithGap = image.displayWidth + (currentRow.length > 0 ? GAP_SIZE : 0);

      if (currentRowWidth + imageWidthWithGap > containerWidth && currentRow.length > 0) {
        // Scale current row to fit exactly
        const availableWidth = containerWidth - (currentRow.length - 1) * GAP_SIZE;
        const scaleFactor = availableWidth / currentRowWidth;

        const scaledImages = currentRow.map(img => ({
          ...img,
          displayWidth: img.displayWidth * scaleFactor,
          displayHeight: img.displayHeight * scaleFactor
        }));

        rows.push({
          images: scaledImages,
          totalWidth: containerWidth,
          maxHeight: Math.max(...scaledImages.map(img => img.displayHeight))
        });

        // Start new row
        currentRow = [image];
        currentRowWidth = image.displayWidth;
      } else {
        currentRow.push(image);
        currentRowWidth += imageWidthWithGap;
      }
    }

    // Handle last row
    if (currentRow.length > 0) {
      const availableWidth = containerWidth - (currentRow.length - 1) * GAP_SIZE;
      const scaleFactor = Math.min(1.2, availableWidth / currentRowWidth);

      const scaledImages = currentRow.map(img => ({
        ...img,
        displayWidth: img.displayWidth * scaleFactor,
        displayHeight: img.displayHeight * scaleFactor
      }));

      rows.push({
        images: scaledImages,
        totalWidth: Math.min(containerWidth, currentRowWidth * scaleFactor + (currentRow.length - 1) * GAP_SIZE),
        maxHeight: Math.max(...scaledImages.map(img => img.displayHeight))
      });
    }

    return rows;
  }, [containerWidth]);

  // Update layout when images change
  useEffect(() => {
    setLayoutRows(packImagesIntoRows(imagesWithLayout));
  }, [imagesWithLayout, packImagesIntoRows]);

  const handleImageClick = (imageId: number) => {
    const index = sortedImages.findIndex(img => img.id === imageId);
    if (index !== -1) {
      setSelectedImageIndex(index);
      setIsViewerOpen(true);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedImageIndex(null);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;

    let newIndex;
    if (direction === 'prev') {
      newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : sortedImages.length - 1;
    } else {
      newIndex = selectedImageIndex < sortedImages.length - 1 ? selectedImageIndex + 1 : 0;
    }

    setSelectedImageIndex(newIndex);
  };

  const handleImageUpdate = () => {
    // Refresh the page data
    window.location.reload();
  };

  const getLanguageFlag = (languages: string[]): React.ReactNode => {
    if (!languages || languages.length === 0) return <span>🌐</span>;
    const lang = languages[0].toLowerCase();
    const flags: Record<string, string> = {
      english: "🇺🇸",
      japanese: "🇯🇵",
      chinese: "🇨🇳",
    };
    return <span>{flags[lang] || "🌐"}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-gray-300">
                Loading {entityTypeSingular.toLowerCase()} data...
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {entityTypeSingular}: {entityName}
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">
                  Error Loading {entityTypeSingular}
                </h2>
                <p className="text-gray-400 mb-2">
                  {entityTypeSingular}: {entityName}
                </p>
                <p className="text-red-400 mb-6">{error}</p>
                <Link
                  to={backLink}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
                >
                  ← Back to All {entityTypePlural}
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">
                  {entityTypeSingular} Not Found
                </h2>
                <p className="text-gray-400 mb-6">
                  No data found for {entityTypeSingular.toLowerCase()}:{" "}
                  {entityName}
                </p>
                <Link
                  to={backLink}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
                >
                  ← Back to All {entityTypePlural}
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { details } = data;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="lg:ml-64 flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-4">
            <Link
              to={backLink}
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition mb-6"
            >
              ← Back to All {entityTypePlural}
            </Link>
            <div className="bg-gray-800 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-4 lg:mb-0">
                  <h1 className="text-4xl font-bold text-gray-100 mb-2">
                    {icon} {details.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full font-semibold">
                      {sortedDoujinshi.length} work
                      {sortedDoujinshi.length !== 1 ? "s" : ""}
                    </span>
                    <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                      ID: {details.id}
                    </span>
                    <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                      Total ♥: {details.totalOCount}
                    </span>
                    {details.averageRating && (
                      <span className="bg-yellow-600 text-white px-3 py-1 rounded-full">
                        Avg ★: {details.averageRating.toFixed(1)}
                      </span>
                    )}
                    <button
                      onClick={handleToggleFavorite}
                      className={`px-3 py-1 rounded-full font-semibold transition-colors flex items-center gap-1.5 ${details.isFavorite
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white"
                        }`}
                      title={
                        details.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <span>{details.isFavorite ? "❤️" : "♡"}</span>
                      <span>
                        {details.isFavorite ? "Favorited" : "Favorite"}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 bg-gray-700 rounded-full p-0.5">
                      <button
                        onClick={() => setIsLinkUnlocked(!isLinkUnlocked)}
                        className="px-2 py-1 text-xs rounded-full hover:bg-gray-600 transition"
                        title={isLinkUnlocked ? "Lock link" : "Unlock link"}
                      >
                        {isLinkUnlocked ? "🔓" : "🔒"}
                      </button>
                      <a
                        href={isLinkUnlocked ? externalLinkUrl : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => !isLinkUnlocked && e.preventDefault()}
                        className={`px-2 py-1 text-xs rounded-full transition flex items-center gap-1 ${isLinkUnlocked
                          ? "text-indigo-400 hover:bg-gray-600"
                          : "text-gray-500 cursor-not-allowed"
                          }`}
                        title={
                          isLinkUnlocked
                            ? `View on nhentai.net`
                            : "Unlock to view on external site"
                        }
                      >
                        🌸
                      </a>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sticky top-0 z-10 bg-gray-900 py-4 -mx-6 px-6 mb-4 shadow-md">
            <HeaderBar
              viewMode={viewMode}
              setViewMode={setViewMode}
              sort={sort}
              setSort={setSort}
              itemCount={sortedDoujinshi.length}
            />
          </div>
          {sortedDoujinshi.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              No works found for this {entityTypeSingular.toLowerCase()}.
            </div>
          ) : (
            <div
              className={`grid ${viewMode === "cover"
                ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2"
                : "grid-cols-1 md:grid-cols-2 gap-4"
                }`}
            >
              {sortedDoujinshi.map((d: Doujinshi) =>
                viewMode === "cover" ? (
                  <Link key={d.id} to={`/doujinshi/${d.id}`} className="block">
                    <CoverImage
                      imgUrl={d.thumbnail_url}
                      flag={getLanguageFlag(d.languages)}
                      title={d.title}
                      characters={d.characters ?? []}
                      tags={d.tags ?? []}
                      parodies={d.parodies ?? []}
                      oCount={d.oCount}
                      rating={d.progress?.rating ?? 0}
                    />
                  </Link>
                ) : (
                  <DoujinshiCard key={d.id} doujinshi={d} />
                ),
              )}
            </div>
          )}
          
          {/* Images Section */}
          {sortedImages.length > 0 && (
            <>
              <div className="mt-12 mb-6">
                <h2 className="text-2xl font-bold text-gray-100 mb-4">
                  Images ({sortedImages.length})
                </h2>
                <div className="sticky top-0 z-10 bg-gray-900 py-4 -mx-6 px-6 mb-4 shadow-md">
                  <HeaderBar
                    viewMode={imageViewMode}
                    setViewMode={setImageViewMode}
                    sort={imageSort}
                    setSort={setImageSort}
                    itemCount={sortedImages.length}
                  />
                </div>
              </div>
              <div ref={containerRef} className="w-full">
                {layoutRows.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex mb-1 justify-start"
                    style={{ height: `${row.maxHeight}px` }}
                  >
                    {row.images.map((image, imageIndex) => (
                      <button
                        key={image.id}
                        onClick={() => handleImageClick(image.id)}
                        className="block hover:opacity-75 transition-all cursor-pointer relative"
                        style={{
                          width: `${image.displayWidth}px`,
                          height: `${image.displayHeight}px`,
                          marginRight: imageIndex < row.images.length - 1 ? '4px' : '0',
                        }}
                      >
                        <img
                          src={image.thumbnail_url}
                          alt={image.filename}
                          className="w-full h-full object-cover rounded-sm"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
      
      {/* Image Viewer Modal */}
      {isViewerOpen && selectedImageIndex !== null && (
        <ImageViewer
          images={sortedImages}
          currentIndex={selectedImageIndex}
          onClose={handleCloseViewer}
          onNavigate={handleNavigate}
          onImageUpdate={handleImageUpdate}
          availableTags={[]}
          availableArtists={[]}
          availableCharacters={[]}
          availableParodies={[]}
          availableGroups={[]}
        />
      )}
    </div>
  );
};

export default EntityDetailPage;
