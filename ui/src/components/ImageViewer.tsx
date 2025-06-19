import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Image } from '../types';
import ImageControls from './ImageControls';

interface ImageViewerProps {
  images: Image[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const [showUI, setShowUI] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [imageRatings, setImageRatings] = useState<Record<number, number>>({});
  const hideUITimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastInteractionTime = useRef<number>(Date.now());

  const currentImage = images[currentIndex];
  // Get the current rating from our local state or the original image data
  const currentRating = imageRatings[currentImage.id] ?? currentImage.rating;

  // Detect if device supports touch
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Fullscreen handling
  const enterFullscreen = () => {
    if (containerRef.current && containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle keyboard rating update
  const handleKeyboardRating = async (ratingValue: number) => {
    if (!currentImage) return;

    // If same rating as current, remove it (set to 0), otherwise set new rating
    const newRating = ratingValue === currentRating ? 0 : ratingValue;

    try {
      // Update local state immediately for responsive UI
      setImageRatings(prev => ({
        ...prev,
        [currentImage.id]: newRating
      }));

      // Make API call
      await fetch(`/api/user/images/${currentImage.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating })
      });

      // Trigger UI timer reset
      resetUITimer();
    } catch (error) {
      console.error('Failed to update rating:', error);
      // Revert local state on error
      setImageRatings(prev => ({
        ...prev,
        [currentImage.id]: currentImage.rating
      }));
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show UI on any keyboard interaction
      resetUITimer();

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          onNavigate('prev');
          break;
        case 'ArrowRight':
          event.preventDefault();
          onNavigate('next');
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case ' ': // Spacebar to toggle UI
          event.preventDefault();
          toggleUI();
          break;
        // Quick rating with number keys
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          event.preventDefault();
          const rating = parseInt(event.key);
          handleKeyboardRating(rating);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNavigate, onClose, currentImage, currentRating]);

  // Toggle UI visibility
  const toggleUI = useCallback(() => {
    if (showUI) {
      // Hide UI immediately
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
      setShowUI(false);
    } else {
      // Show UI and start timer
      resetUITimer();
    }
  }, [showUI]);

  // Reset UI timer and show UI
  const resetUITimer = useCallback(() => {
    if (hideUITimer.current) clearTimeout(hideUITimer.current);
    setShowUI(true);
    lastInteractionTime.current = Date.now();

    // Longer timeout for touch devices
    const timeout = isTouchDevice ? 8000 : 6000;
    hideUITimer.current = window.setTimeout(() => {
      setShowUI(false);
    }, timeout);
  }, [isTouchDevice]);

  // Handle mouse movement (desktop)
  const handleMouseMove = useCallback(() => {
    if (!isTouchDevice) {
      const now = Date.now();
      // Throttle mouse movement events to avoid too frequent updates
      if (now - lastInteractionTime.current > 100) {
        resetUITimer();
      }
    }
  }, [resetUITimer, isTouchDevice]);

  // Handle touch events (mobile)
  const handleTouchStart = useCallback(() => {
    resetUITimer();
  }, [resetUITimer]);

  const handleTouchMove = useCallback(() => {
    // Show UI on touch move (scrolling, swiping)
    resetUITimer();
  }, [resetUITimer]);

  // Handle screen tap/click for navigation and UI toggle
  const handleScreenClick = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX: number;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const x = clientX - rect.left;
    const width = rect.width;

    // Define the three zones
    const leftThird = width / 3;
    const rightThird = (2 * width) / 3;

    if (x < leftThird) {
      // Left third - Previous image
      resetUITimer();
      onNavigate('prev');
    } else if (x > rightThird) {
      // Right third - Next image  
      resetUITimer();
      onNavigate('next');
    } else {
      // Middle third - Toggle UI
      toggleUI();
    }
  }, [onNavigate, resetUITimer, toggleUI]);

  // Initialize UI timer
  useEffect(() => {
    resetUITimer();
    return () => {
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
    };
  }, [resetUITimer]);

  // Update timer when image changes
  useEffect(() => {
    resetUITimer();
  }, [currentIndex, resetUITimer]);

  if (!currentImage) return null;

  // Create a modified image object with the current rating
  const imageWithCurrentRating = {
    ...currentImage,
    rating: currentRating
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center select-none z-50"
      onClick={handleScreenClick}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        cursor: showUI ? "pointer" : "none",
        touchAction: "manipulation",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none"
      }}
    >
      {/* Main Image */}
      <img
        src={`/api/images/${currentImage.id}/file`}
        alt={currentImage.filename}
        className="w-screen h-screen object-contain"
        draggable={false}
        style={{ zIndex: 50 }}
      />

      {/* UI Overlay */}
      {showUI && (
        <>
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-6 left-8 bg-black/60 rounded p-2 hover:bg-black/80 transition touch-manipulation"
            style={{ zIndex: 60 }}
            aria-label="Close viewer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Fullscreen Button */}
          {!isFullscreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                enterFullscreen();
              }}
              className="absolute top-6 left-24 bg-black/60 rounded p-2 hover:bg-black/80 transition text-white touch-manipulation"
              style={{ zIndex: 60 }}
              aria-label="Enter Fullscreen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8-16h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3"
                />
              </svg>
            </button>
          )}

          {/* Image Counter */}
          <span
            className="absolute top-6 right-8 text-white bg-black/60 px-4 py-2 rounded text-lg"
            style={{ pointerEvents: "none", zIndex: 60 }}
          >
            {currentIndex + 1} / {images.length}
          </span>

          {/* Navigation Arrows - Larger on mobile */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('prev');
            }}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 rounded-full hover:bg-black/80 transition text-white touch-manipulation ${isTouchDevice ? 'p-4' : 'p-3'
              }`}
            style={{ zIndex: 60 }}
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={isTouchDevice ? 'h-10 w-10' : 'h-8 w-8'}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('next');
            }}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 rounded-full hover:bg-black/80 transition text-white touch-manipulation ${isTouchDevice ? 'p-4' : 'p-3'
              }`}
            style={{ zIndex: 60 }}
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={isTouchDevice ? 'h-10 w-10' : 'h-8 w-8'}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Image Controls with proper z-index */}
          <div style={{ zIndex: 65 }}>
            <ImageControls
              image={imageWithCurrentRating}
              onUpdate={resetUITimer}
            />
          </div>
        </>
      )}

      {/* Touch hint for mobile when UI is hidden */}
      {!showUI && isTouchDevice && (
        <div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-sm animate-pulse"
          style={{ zIndex: 55, pointerEvents: "none" }}
        >
          Tap center to show controls
        </div>
      )}

      {/* Visual click zones indicator (optional - you can remove this) */}
      {showUI && (
        <>
          <div
            className="absolute top-0 left-0 w-1/3 h-full pointer-events-none border-r border-white/10"
            style={{ zIndex: 45 }}
          />
          <div
            className="absolute top-0 right-0 w-1/3 h-full pointer-events-none border-l border-white/10"
            style={{ zIndex: 45 }}
          />
        </>
      )}
    </div>
  );
};

export default ImageViewer;
