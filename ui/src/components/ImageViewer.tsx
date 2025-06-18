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
  const hideUITimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];

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
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNavigate, onClose]);

  // Auto-hide UI
  const resetUITimer = useCallback(() => {
    if (hideUITimer.current) clearTimeout(hideUITimer.current);
    setShowUI(true);
    hideUITimer.current = window.setTimeout(() => {
      setShowUI(false);
    }, 4000);
  }, []);

  useEffect(() => {
    resetUITimer();
    return () => {
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
    };
  }, [resetUITimer]);

  // Handle screen click for navigation
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const { width, left } = currentTarget.getBoundingClientRect();
    const x = clientX - left;

    if (x < width / 3) {
      onNavigate('prev');
    } else if (x > (2 * width) / 3) {
      onNavigate('next');
    } else {
      resetUITimer();
    }
  };

  if (!currentImage) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center select-none z-50"
      onClick={handleScreenClick}
      style={{ cursor: "pointer", touchAction: "manipulation" }}
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
            className="absolute top-6 left-8 bg-black/60 rounded p-2 hover:bg-black/80 transition"
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
              className="absolute top-6 left-24 bg-black/60 rounded p-2 hover:bg-black/80 transition text-white"
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

          {/* Image Filename */}
          <span
            className="absolute top-20 right-8 text-white bg-black/60 px-4 py-2 rounded text-sm max-w-md truncate"
            style={{ pointerEvents: "none", zIndex: 60 }}
          >
            {currentImage.filename}
          </span>

          {/* Navigation Arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('prev');
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 rounded-full p-3 hover:bg-black/80 transition text-white"
            style={{ zIndex: 60 }}
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
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
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 rounded-full p-3 hover:bg-black/80 transition text-white"
            style={{ zIndex: 60 }}
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
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
          <ImageControls
            image={currentImage}
            onUpdate={resetUITimer}
          />
        </>
      )}
    </div>
  );
};

export default ImageViewer;
