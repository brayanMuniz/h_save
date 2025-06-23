import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { Image, ImageBrowseFilters, SavedImageFilter, ImageCollection } from "../types";

import HeaderBar from "../components/HeaderBar";
import ImageFilterSidebar from "../components/ImageFilterSidebar";
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

const initialFilters: ImageBrowseFilters = {
  artists: { included: [], excluded: [] },
  groups: { included: [], excluded: [] },
  tags: { included: [], excluded: [] },
  characters: { included: [], excluded: [] },
  parodies: { included: [], excluded: [] },
  categories: { included: [], excluded: [] },
  search: "",
  rating: { min: 0, max: 5 },
  oCount: { min: 0, max: 100 },
  formats: [],
};

const GalleryPage = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "cover">("cover");
  const [sortBy, setSortBy] = useState("random");
  const [filters, setFilters] = useState<ImageBrowseFilters>(initialFilters);
  const [savedFilters, setSavedFilters] = useState<SavedImageFilter[]>([]);
  const [collections, setCollections] = useState<ImageCollection[]>([]);
  const [displayedImages, setDisplayedImages] = useState<Image[]>([]);
  const [layoutRows, setLayoutRows] = useState<LayoutRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Image viewer state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const IMAGES_PER_PAGE = 200;
  const TARGET_ROW_HEIGHT = 250;

  // Update container width with better calculation
  const updateWidth = useCallback(() => {
    if (mainContentRef.current) {
      // Get the actual available width of the main content area
      const rect = mainContentRef.current.getBoundingClientRect();
      const availableWidth = rect.width - 48; // Account for padding (24px on each side)
      const newWidth = Math.max(300, availableWidth);

      // Only update if the width has actually changed significantly (avoid constant re-renders)
      if (Math.abs(newWidth - containerWidth) > 10) {
        setContainerWidth(newWidth);
      }
    }
  }, [containerWidth]);

  // Handle resize and sidebar changes with proper timing
  useEffect(() => {
    const handleResize = () => {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(updateWidth);
    };

    // Initial width calculation
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateWidth]);


  useEffect(() => {
    // Force immediate recalculation
    const recalculate = () => {
      if (mainContentRef.current) {
        const rect = mainContentRef.current.getBoundingClientRect();
        const availableWidth = rect.width - 48;
        const newWidth = Math.max(300, availableWidth);
        setContainerWidth(newWidth);
      }
    };

    // Multiple recalculations to ensure it catches the layout change
    const timeouts = [
      setTimeout(recalculate, 50),   // Immediate
      setTimeout(recalculate, 150),  // Early
      setTimeout(recalculate, 350),  // After transition
      setTimeout(recalculate, 500),  // Safety net
    ];

    // Also trigger on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(recalculate);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isSidebarCollapsed]);


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

  const fetchSavedFilters = async () => {
    try {
      const response = await fetch("/api/user/image-saved-filters");
      if (!response.ok) throw new Error("Failed to fetch saved filters.");
      const data = await response.json();
      setSavedFilters(data.savedFilters || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/user/collections");
      if (!response.ok) throw new Error("Failed to fetch collections");
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    }
  };

  useEffect(() => {
    fetchImages();
    fetchSavedFilters();
    fetchCollections();
  }, []);

  // Filter and sort images
  const filteredAndSortedImages = useMemo(() => {
    const filtered = images.filter((image) => {
      // Search filter
      if (filters.search && !image.filename.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Format filter
      if (filters.formats.length > 0 && !filters.formats.includes(image.format.toLowerCase())) {
        return false;
      }

      // Range filters
      if (
        image.rating < filters.rating.min ||
        image.rating > filters.rating.max ||
        image.o_count < filters.oCount.min ||
        image.o_count > filters.oCount.max
      ) {
        return false;
      }

      // Tag-based filters
      const filterTypes = ["tags", "artists", "characters", "parodies", "groups", "categories"] as const;
      for (const filterType of filterTypes) {
        const imageValues = image[filterType] || [];
        const filterGroup = filters[filterType];

        if (filterGroup.excluded.length > 0) {
          const hasExcluded = filterGroup.excluded.some((excludedValue) =>
            imageValues.some((imageValue) =>
              imageValue?.toLowerCase().includes(excludedValue.toLowerCase()),
            ),
          );
          if (hasExcluded) return false;
        }

        if (filterGroup.included.length > 0) {
          const hasAllIncluded = filterGroup.included.every((includedValue) =>
            imageValues.some((imageValue) =>
              imageValue?.toLowerCase().includes(includedValue.toLowerCase()),
            ),
          );
          if (!hasAllIncluded) return false;
        }
      }

      return true;
    });

    if (sortBy === "random") {
      return [...filtered].sort(() => Math.random() - 0.5);
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "filename":
          return a.filename.localeCompare(b.filename);
        case "rating":
          return b.rating - a.rating;
        case "ocount":
          return b.o_count - a.o_count;
        case "filesize":
          return b.file_size - a.file_size;
        case "uploaded":
        default:
          return new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime();
      }
    });

    return sorted;
  }, [images, filters, sortBy]);

  const imagesWithLayout = useMemo(() => {
    return filteredAndSortedImages.map(image => {
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
  }, [filteredAndSortedImages]);

  // Improved packing algorithm that better fills available space
  const packImagesIntoRows = useCallback((images: ImageWithLayout[]): LayoutRow[] => {
    const rows: LayoutRow[] = [];
    let currentRow: ImageWithLayout[] = [];
    let currentRowWidth = 0;
    const GAP_SIZE = 4; // Account for gap between images

    for (const image of images) {
      const imageWidthWithGap = image.displayWidth + (currentRow.length > 0 ? GAP_SIZE : 0);

      // Check if adding this image would exceed container width
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
      const scaleFactor = Math.min(1.2, availableWidth / currentRowWidth); // Allow slight upscaling

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

  useEffect(() => {
    if (imagesWithLayout.length > 0) {
      const startIndex = 0;
      const endIndex = page * IMAGES_PER_PAGE;
      const newDisplayed = filteredAndSortedImages.slice(startIndex, endIndex);
      const newDisplayedWithLayout = imagesWithLayout.slice(startIndex, endIndex);

      setDisplayedImages(newDisplayed);
      setLayoutRows(packImagesIntoRows(newDisplayedWithLayout));
      setHasMore(endIndex < filteredAndSortedImages.length);
    }
  }, [imagesWithLayout, page, packImagesIntoRows, filteredAndSortedImages]);

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
    const index = filteredAndSortedImages.findIndex(img => img.id === imageId);
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
      newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : filteredAndSortedImages.length - 1;
    } else {
      newIndex = selectedImageIndex < filteredAndSortedImages.length - 1 ? selectedImageIndex + 1 : 0;
    }

    setSelectedImageIndex(newIndex);
  };

  // Filter management functions (unchanged)
  const handleSaveFilter = async () => {
    const name = prompt("Enter a name for this filter set:");
    if (!name || !name.trim()) return;
    try {
      const response = await fetch("/api/user/image-saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), filters }),
      });
      if (!response.ok) throw new Error("Failed to save filter.");
      fetchSavedFilters();
    } catch (error) {
      console.error(error);
      alert("Error: Could not save the filter.");
    }
  };

  const handleLoadFilter = (filtersToLoad: ImageBrowseFilters) => {
    setFilters(filtersToLoad);
    setPage(1);
  };

  const handleDeleteFilter = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this saved filter?"))
      return;
    try {
      const response = await fetch(`/api/user/image-saved-filters/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete filter.");
      fetchSavedFilters();
    } catch (error) {
      console.error(error);
      alert("Error: Could not delete the filter.");
    }
  };

  const handleCreateCollection = async (name: string, description?: string) => {
    try {
      const response = await fetch("/api/user/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) throw new Error("Failed to create collection");
      await fetchCollections();
      alert("Collection created successfully!");
    } catch (error) {
      console.error("Failed to create collection:", error);
      alert("Error: Could not create collection.");
    }
  };

  const handleAddToCollection = async (collectionId: number, imageIds: number[]) => {
    try {
      const response = await fetch(`/api/user/collections/${collectionId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds }),
      });
      if (!response.ok) throw new Error("Failed to add images to collection");
      alert(`Successfully added ${imageIds.length} images to collection!`);
    } catch (error) {
      console.error("Failed to add to collection:", error);
      alert("Error: Could not add images to collection.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <div className="hidden md:block">
        <ImageFilterSidebar
          filters={filters}
          setFilters={setFilters}
          images={images}
          sortBy={sortBy}
          setSortBy={setSortBy}
          savedFilters={savedFilters}
          collections={collections}
          onSaveFilter={handleSaveFilter}
          onLoadFilter={handleLoadFilter}
          onDeleteFilter={handleDeleteFilter}
          onCreateCollection={handleCreateCollection}
          onAddToCollection={handleAddToCollection}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div
        ref={mainContentRef}
        className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-80'}`}
      >
        <MobileNav />
        <main className="p-6">
          <HeaderBar viewMode={viewMode} setViewMode={setViewMode} />

          <div className="mb-4 text-gray-400 text-sm">
            Showing {displayedImages.length} of {filteredAndSortedImages.length} images
          </div>

          {displayedImages.length === 0 && !loading ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-lg">
                No images found matching your filters.
              </p>
              <p className="text-gray-500 mt-2">
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <>
              <div ref={containerRef} className="w-full">
                {layoutRows.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    ref={rowIndex === layoutRows.length - 1 ? lastRowElementRef : null}
                    className="flex mb-1 justify-start"
                    style={{ height: `${row.maxHeight}px` }}
                  >
                    {row.images.map((image, imageIndex) => (
                      <button
                        key={image.id}
                        onClick={() => handleImageClick(image.id)}
                        className="block hover:opacity-75 transition-opacity cursor-pointer"
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
          images={filteredAndSortedImages}
          currentIndex={selectedImageIndex}
          onClose={handleCloseViewer}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default GalleryPage;
