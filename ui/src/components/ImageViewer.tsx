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
  const hideUITimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastInteractionTime = useRef<number>(Date.now());

  const currentImage = images[currentIndex];

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNavigate, onClose]);

  // Toggle UI visibility
  const toggleUI = useCallback(() => {
    if (showUI) {
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
      setShowUI(false);
    } else {
      resetUITimer();
    }
  }, [showUI]);

  // Reset UI timer and show UI
  const resetUITimer = useCallback(() => {
    if (hideUITimer.current) clearTimeout(hideUITimer.current);
    setShowUI(true);
    lastInteractionTime.current = Date.now();

    const timeout = isTouchDevice ? 8000 : 6000;
    hideUITimer.current = window.setTimeout(() => {
      setShowUI(false);
    }, timeout);
  }, [isTouchDevice]);

  // Handle mouse movement (desktop)
  const handleMouseMove = useCallback(() => {
    if (!isTouchDevice) {
      const now = Date.now();
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

    const leftThird = width / 3;
    const rightThird = (2 * width) / 3;

    if (x < leftThird) {
      resetUITimer();
      onNavigate('prev');
    } else if (x > rightThird) {
      resetUITimer();
      onNavigate('next');
    } else {
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
      {/* Main Image - Better mobile styling */}
      <img
        src={`/api/images/${currentImage.id}/file`}
        alt={currentImage.filename}
        className="max-w-full max-h-full object-contain"
        style={{
          zIndex: 50,
          width: 'auto',
          height: 'auto',
          maxWidth: '100vw',
          maxHeight: '100vh'
        }}
        draggable={false}
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
            className="absolute top-4 left-4 md:top-6 md:left-8 bg-black/60 rounded p-2 md:p-2 hover:bg-black/80 transition touch-manipulation"
            style={{ zIndex: 60 }}
            aria-label="Close viewer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 md:h-6 md:w-6 text-white"
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
              className="absolute top-4 left-16 md:top-6 md:left-24 bg-black/60 rounded p-2 hover:bg-black/80 transition text-white touch-manipulation"
              style={{ zIndex: 60 }}
              aria-label="Enter Fullscreen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 md:h-6 md:w-6"
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
            className="absolute top-4 right-4 md:top-6 md:right-8 text-white bg-black/60 px-3 py-1 md:px-4 md:py-2 rounded text-sm md:text-lg"
            style={{ pointerEvents: "none", zIndex: 60 }}
          >
            {currentIndex + 1} / {images.length}
          </span>

          {/* Navigation Arrows - Responsive sizing */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('prev');
            }}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-black/60 rounded-full hover:bg-black/80 transition text-white touch-manipulation p-3 md:p-3"
            style={{ zIndex: 60 }}
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 md:h-8 md:w-8"
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
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-black/60 rounded-full hover:bg-black/80 transition text-white touch-manipulation p-3 md:p-3"
            style={{ zIndex: 60 }}
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 md:h-8 md:w-8"
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

          {/* Image Controls */}
          <div style={{ zIndex: 65 }}>
            <ImageControls
              image={currentImage}
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
    </div>
  );
};

export default ImageViewer;
