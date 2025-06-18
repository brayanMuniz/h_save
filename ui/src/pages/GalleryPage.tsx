import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { Image } from "../types";

import HeaderBar from "../components/HeaderBar";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import ImageViewer from "../components/ImageViewer";

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

const GalleryPage = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "cover">("cover");
  const [displayedImages, setDisplayedImages] = useState<Image[]>([]);
  const [layoutRows, setLayoutRows] = useState<LayoutRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [containerWidth, setContainerWidth] = useState(1200);
  const observer = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Image viewer state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const IMAGES_PER_PAGE = 200;
  const TARGET_ROW_HEIGHT = 250;

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth - 48; // Account for padding
        setContainerWidth(Math.max(300, width)); // Minimum width of 300px
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch("/api/images");
      const data = await response.json();
      setImages(data.images || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const shuffledImages = useMemo(() => {
    return [...images].sort(() => Math.random() - 0.5);
  }, [images]);

  const imagesWithLayout = useMemo(() => {
    return shuffledImages.map(image => {
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
  }, [shuffledImages]);

  const packImagesIntoRows = useCallback((images: ImageWithLayout[]): LayoutRow[] => {
    const rows: LayoutRow[] = [];
    let currentRow: ImageWithLayout[] = [];
    let currentRowWidth = 0;

    for (const image of images) {
      if (currentRowWidth + image.displayWidth > containerWidth && currentRow.length > 0) {
        const scaleFactor = containerWidth / currentRowWidth;
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

        currentRow = [image];
        currentRowWidth = image.displayWidth;
      } else {
        currentRow.push(image);
        currentRowWidth += image.displayWidth;
      }
    }

    if (currentRow.length > 0) {
      const scaleFactor = Math.min(1, containerWidth / currentRowWidth);
      const scaledImages = currentRow.map(img => ({
        ...img,
        displayWidth: img.displayWidth * scaleFactor,
        displayHeight: img.displayHeight * scaleFactor
      }));

      rows.push({
        images: scaledImages,
        totalWidth: currentRowWidth * scaleFactor,
        maxHeight: Math.max(...scaledImages.map(img => img.displayHeight))
      });
    }

    return rows;
  }, [containerWidth]);

  useEffect(() => {
    if (imagesWithLayout.length > 0) {
      const startIndex = 0;
      const endIndex = page * IMAGES_PER_PAGE;
      const newDisplayed = shuffledImages.slice(startIndex, endIndex);
      const newDisplayedWithLayout = imagesWithLayout.slice(startIndex, endIndex);

      setDisplayedImages(newDisplayed);
      setLayoutRows(packImagesIntoRows(newDisplayedWithLayout));
      setHasMore(endIndex < shuffledImages.length);
    }
  }, [imagesWithLayout, page, packImagesIntoRows, shuffledImages]);

  const lastRowElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prevPage => prevPage + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handleImageClick = (imageId: number) => {
    const index = shuffledImages.findIndex(img => img.id === imageId);
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
      newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : shuffledImages.length - 1;
    } else {
      newIndex = selectedImageIndex < shuffledImages.length - 1 ? selectedImageIndex + 1 : 0;
    }

    setSelectedImageIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className="lg:ml-64">
        <MobileNav />
        <main className="flex-1 p-6">
          <HeaderBar viewMode={viewMode} setViewMode={setViewMode} />

          {displayedImages.length === 0 && !loading ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-lg">
                No images found in your gallery.
              </p>
              <p className="text-gray-500 mt-2">
                Try scanning for new images or adding some to your images folder.
              </p>
            </div>
          ) : (
            <>
              <div ref={containerRef} className="w-full max-w-7xl mx-auto">
                {layoutRows.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    ref={rowIndex === layoutRows.length - 1 ? lastRowElementRef : null}
                    className="flex mb-1"
                    style={{ height: `${row.maxHeight}px` }}
                  >
                    {row.images.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => handleImageClick(image.id)}
                        className="block hover:opacity-75 transition-opacity mr-1 last:mr-0 cursor-pointer"
                        style={{
                          width: `${image.displayWidth}px`,
                          height: `${image.displayHeight}px`,
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

              {hasMore && (
                <div className="text-center py-4">
                  <div className="text-gray-400">Loading more images...</div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Image Viewer Modal */}
      {isViewerOpen && selectedImageIndex !== null && (
        <ImageViewer
          images={shuffledImages}
          currentIndex={selectedImageIndex}
          onClose={handleCloseViewer}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default GalleryPage;
