import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { Image, ImageBrowseFilters, SavedImageFilter, ImageCollection } from "../types";

import HeaderBar from "../components/HeaderBar";
import ImageFilterSidebar from "../components/ImageFilterSidebar";
import MobileNav from "../components/MobileNav";
import ImageViewer from "../components/ImageViewer";
import BatchTaggingMode from "../components/BatchTaggingMode";

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

  // Batch tagging mode state
  const [isBatchTaggingMode, setIsBatchTaggingMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedParodies, setSelectedParodies] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());

  // Global entity lists
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allArtists, setAllArtists] = useState<string[]>([]);
  const [allCharacters, setAllCharacters] = useState<string[]>([]);
  const [allParodies, setAllParodies] = useState<string[]>([]);
  const [allGroups, setAllGroups] = useState<string[]>([]);

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
      const response = await fetch("/api/user/saved-filters");
      if (!response.ok) throw new Error("Failed to fetch saved filters.");
      const data = await response.json();
      setSavedFilters(data.savedFilters || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCollections = async () => {
    try {
      setCollections([]);
    } catch (error) {
      console.error("Failed to fetch collections:", error);
      setCollections([]);
    }
  };

  // Fetch all entities once on mount
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const [tagsRes, artistsRes, charactersRes, parodiesRes, groupsRes] = await Promise.all([
          fetch('/api/tags'),
          fetch('/api/artists'),
          fetch('/api/characters'),
          fetch('/api/parodies'),
          fetch('/api/groups'),
        ]);
        const [tagsData, artistsData, charactersData, parodiesData, groupsData] = await Promise.all([
          tagsRes.json(),
          artistsRes.json(),
          charactersRes.json(),
          parodiesRes.json(),
          groupsRes.json(),
        ]);
        setAllTags((tagsData.tags || tagsData).map((t: any) => t.name || t.Name || t).filter(Boolean).sort());
        setAllArtists((artistsData.artists || artistsData).map((a: any) => a.name || a.Name || a).filter(Boolean).sort());
        setAllCharacters((charactersData.characters || charactersData).map((c: any) => c.name || c.Name || c).filter(Boolean).sort());
        setAllParodies((parodiesData.parodies || parodiesData).map((p: any) => p.name || p.Name || p).filter(Boolean).sort());
        setAllGroups((groupsData.groups || groupsData).map((g: any) => g.name || g.Name || g).filter(Boolean).sort());
      } catch (err) {
        setAllTags([]);
        setAllArtists([]);
        setAllCharacters([]);
        setAllParodies([]);
        setAllGroups([]);
      }
    };
    fetchEntities();
  }, []);

  useEffect(() => {
    fetchImages();
    fetchSavedFilters();
    fetchCollections();
  }, []);

  // Clean up observer when viewer opens/closes
  useEffect(() => {
    if (isViewerOpen && observer.current) {
      observer.current.disconnect();
      observer.current = null;
    }
  }, [isViewerOpen]);

  // Prevent scrolling when viewer is open
  useEffect(() => {
    if (isViewerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isViewerOpen]);

  // Filter and sort images
  const filteredAndSortedImages = useMemo(() => {
    console.log("Filtering images. Total images:", images.length);
    console.log("Current filters:", filters);

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

        // Skip if no filters are set for this type
        if (filterGroup.excluded.length === 0 && filterGroup.included.length === 0) {
          continue;
        }

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

    console.log("Filtered images count:", filtered.length);

    let sorted;
    if (sortBy === "random") {
      sorted = [...filtered].sort(() => Math.random() - 0.5);
    } else {
      sorted = [...filtered].sort((a, b) => {
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
    }

    console.log("Final sorted images count:", sorted.length);
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

  // Reset page when filters or sorting changes
  useEffect(() => {
    console.log("Filters or sorting changed, resetting page to 1");
    setPage(1);
  }, [filters, sortBy]);

  // Update displayed images when filtered images change
  useEffect(() => {
    console.log("Updating displayed images. Filtered count:", filteredAndSortedImages.length, "Page:", page);

    const startIndex = 0;
    const endIndex = page * IMAGES_PER_PAGE;
    const newDisplayed = filteredAndSortedImages.slice(startIndex, endIndex);
    const newDisplayedWithLayout = imagesWithLayout.slice(startIndex, endIndex);

    console.log("Setting displayed images count:", newDisplayed.length);

    setDisplayedImages(newDisplayed);
    setLayoutRows(packImagesIntoRows(newDisplayedWithLayout));
    setHasMore(endIndex < filteredAndSortedImages.length);
  }, [filteredAndSortedImages, imagesWithLayout, page, packImagesIntoRows]);

  const lastRowElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || isViewerOpen) return; // Disable infinite scroll when viewer is open
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
  }, [loading, hasMore, isViewerOpen]);

  const handleImageClick = (imageId: number) => {
    if (isViewerOpen) return;
    
    if (isBatchTaggingMode) {
      // In batch tagging mode, handle selection differently
      return;
    }
    
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

  const handleImageUpdate = () => {
    // Only refresh if we're not in the viewer to avoid unnecessary re-fetching
    if (!isViewerOpen) {
      fetchImages();
    }
  };

  // Filter management functions
  const handleSaveFilter = async () => {
    const name = prompt("Enter a name for this filter set:");
    if (!name || !name.trim()) return;
    try {
      const response = await fetch("/api/user/saved-filters", {
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
      const response = await fetch(`/api/user/saved-filters/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete filter.");
      fetchSavedFilters();
    } catch (error) {
      console.error(error);
      alert("Error: Could not delete the filter.");
    }
  };

  // Collection functions (need backend endpoints)
  const handleCreateCollection = async (name: string, description?: string) => {
    try {
      alert("Collection feature not implemented yet - backend endpoint needed");
      return;
    } catch (error) {
      console.error("Failed to create collection:", error);
      alert("Error: Could not create collection.");
    }
  };

  const handleAddToCollection = async (collectionId: number, imageIds: number[]) => {
    try {
      alert("Add to collection feature not implemented yet - backend endpoint needed");
      return;
    } catch (error) {
      console.error("Failed to add to collection:", error);
      alert("Error: Could not add images to collection.");
    }
  };

  // Custom setFilters wrapper that ensures page reset
  const handleSetFilters = useCallback((newFilters: ImageBrowseFilters) => {
    console.log("Setting new filters:", newFilters);
    setFilters(newFilters);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Fixed Sidebar */}
      <div className={`hidden md:block fixed top-0 left-0 h-full z-30 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-80'}`}>
        <ImageFilterSidebar
          filters={filters}
          setFilters={handleSetFilters}
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
          availableTags={allTags}
          availableArtists={allArtists}
          availableCharacters={allCharacters}
          availableParodies={allParodies}
          availableGroups={allGroups}
        />
      </div>

      {/* Main Gallery Area */}
      <div
        ref={mainContentRef}
        className={`min-h-screen flex-1 transition-all duration-300 relative ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-80'}`}
      >
        <MobileNav />
        <main className="p-6">
          {/* View Mode Toggle Overlay */}
          <div className="absolute top-6 right-6 z-20 flex items-center rounded-lg border border-gray-600 p-0.5 bg-gray-900/80 backdrop-blur">
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === "card"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:bg-gray-800"
                }`}
            >
              Card
            </button>
            <button
              onClick={() => setViewMode("cover")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === "cover"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:bg-gray-800"
                }`}
            >
              Cover
            </button>
          </div>
          <HeaderBar viewMode={viewMode} setViewMode={setViewMode} />

          <BatchTaggingMode
            isActive={isBatchTaggingMode}
            onToggle={() => setIsBatchTaggingMode(!isBatchTaggingMode)}
            onImagesUpdated={fetchImages}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            selectedArtists={selectedArtists}
            onArtistsChange={setSelectedArtists}
            selectedCharacters={selectedCharacters}
            onCharactersChange={setSelectedCharacters}
            selectedParodies={selectedParodies}
            onParodiesChange={setSelectedParodies}
            selectedGroups={selectedGroups}
            onGroupsChange={setSelectedGroups}
            availableTags={allTags}
            availableArtists={allArtists}
            availableCharacters={allCharacters}
            availableParodies={allParodies}
            availableGroups={allGroups}
            selectedImages={selectedImages}
            onSelectedImagesChange={setSelectedImages}
          />

          <div className="mb-4 text-gray-400 text-sm">
            Showing {(isBatchTaggingMode && (selectedTags.length > 0 || selectedArtists.length > 0 || selectedCharacters.length > 0 || selectedParodies.length > 0 || selectedGroups.length > 0)
              ? layoutRows.reduce((acc, row) => acc + row.images.filter(img => {
                  // Check if image already has all selected entities
                  const hasAllTags = selectedTags.length === 0 || selectedTags.every(tag => (img.tags ?? []).includes(tag));
                  const hasAllArtists = selectedArtists.length === 0 || selectedArtists.every(artist => (img.artists ?? []).includes(artist));
                  const hasAllCharacters = selectedCharacters.length === 0 || selectedCharacters.every(character => (img.characters ?? []).includes(character));
                  const hasAllParodies = selectedParodies.length === 0 || selectedParodies.every(parody => (img.parodies ?? []).includes(parody));
                  const hasAllGroups = selectedGroups.length === 0 || selectedGroups.every(group => (img.groups ?? []).includes(group));
                  
                  // Show image if it doesn't have all selected entities
                  return !(hasAllTags && hasAllArtists && hasAllCharacters && hasAllParodies && hasAllGroups);
                }).length, 0)
              : displayedImages.length)} of {filteredAndSortedImages.length} images
          </div>

          {/* Debug info */}
          {import.meta.env.DEV && (
            <div className="mb-4 text-xs text-gray-500 bg-gray-800 p-2 rounded">
              Debug: Total: {images.length}, Filtered: {filteredAndSortedImages.length},
              Displayed: {displayedImages.length}, Page: {page}, Layout Rows: {layoutRows.length}
            </div>
          )}

          {filteredAndSortedImages.length === 0 && !loading ? (
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
                {(isBatchTaggingMode && (selectedTags.length > 0 || selectedArtists.length > 0 || selectedCharacters.length > 0 || selectedParodies.length > 0 || selectedGroups.length > 0) && layoutRows.reduce((acc, row) => acc + row.images.filter(img => {
                    // Check if image already has all selected entities
                    const hasAllTags = selectedTags.length === 0 || selectedTags.every(tag => (img.tags ?? []).includes(tag));
                    const hasAllArtists = selectedArtists.length === 0 || selectedArtists.every(artist => (img.artists ?? []).includes(artist));
                    const hasAllCharacters = selectedCharacters.length === 0 || selectedCharacters.every(character => (img.characters ?? []).includes(character));
                    const hasAllParodies = selectedParodies.length === 0 || selectedParodies.every(parody => (img.parodies ?? []).includes(parody));
                    const hasAllGroups = selectedGroups.length === 0 || selectedGroups.every(group => (img.groups ?? []).includes(group));
                    
                    // Show image if it doesn't have all selected entities
                    return !(hasAllTags && hasAllArtists && hasAllCharacters && hasAllParodies && hasAllGroups);
                  }).length, 0) === 0) ? (
                  <div className="text-center py-10 text-gray-400">All images already have the selected entities.</div>
                ) : (
                  layoutRows.map((row, rowIndex) => {
                    // Filter images in this row for batch mode
                    const rowImages = isBatchTaggingMode && (selectedTags.length > 0 || selectedArtists.length > 0 || selectedCharacters.length > 0 || selectedParodies.length > 0 || selectedGroups.length > 0)
                      ? row.images.filter(img => {
                          // Check if image already has all selected entities
                          const hasAllTags = selectedTags.length === 0 || selectedTags.every(tag => (img.tags ?? []).includes(tag));
                          const hasAllArtists = selectedArtists.length === 0 || selectedArtists.every(artist => (img.artists ?? []).includes(artist));
                          const hasAllCharacters = selectedCharacters.length === 0 || selectedCharacters.every(character => (img.characters ?? []).includes(character));
                          const hasAllParodies = selectedParodies.length === 0 || selectedParodies.every(parody => (img.parodies ?? []).includes(parody));
                          const hasAllGroups = selectedGroups.length === 0 || selectedGroups.every(group => (img.groups ?? []).includes(group));
                          
                          // Show image if it doesn't have all selected entities
                          return !(hasAllTags && hasAllArtists && hasAllCharacters && hasAllParodies && hasAllGroups);
                        })
                      : row.images;
                    if (rowImages.length === 0) return null;
                    return (
                      <div
                        key={rowIndex}
                        ref={rowIndex === layoutRows.length - 1 && !isViewerOpen ? lastRowElementRef : null}
                        className="flex mb-1 justify-start"
                        style={{ height: `${row.maxHeight}px` }}
                      >
                        {rowImages.map((image, imageIndex) => {
                          const isSelected = selectedImages.has(image.id);
                          return (
                            <button
                              key={image.id}
                              onClick={() => {
                                if (isBatchTaggingMode) {
                                  const newSelected = new Set(selectedImages);
                                  if (newSelected.has(image.id)) {
                                    newSelected.delete(image.id);
                                  } else {
                                    newSelected.add(image.id);
                                  }
                                  setSelectedImages(newSelected);
                                } else {
                                  handleImageClick(image.id);
                                }
                              }}
                              className={`block hover:opacity-75 transition-all cursor-pointer relative ${
                                isBatchTaggingMode && isSelected
                                  ? 'ring-4 ring-blue-500 ring-opacity-75 opacity-90'
                                  : ''
                              }`}
                              style={{
                                width: `${image.displayWidth}px`,
                                height: `${image.displayHeight}px`,
                                marginRight: imageIndex < rowImages.length - 1 ? '4px' : '0',
                              }}
                            >
                              <img
                                src={image.thumbnail_url}
                                alt={image.filename}
                                className="w-full h-full object-cover rounded-sm"
                                loading="lazy"
                                decoding="async"
                              />
                              {isBatchTaggingMode && isSelected && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                  ✓
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
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
          onImageUpdate={handleImageUpdate}
        />
      )}
    </div>
  );
};

export default GalleryPage;
