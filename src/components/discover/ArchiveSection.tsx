/**
 * ArchiveSection Component
 *
 * Displays photo grid with lazy loading, shimmer placeholders, and fullscreen viewer.
 * Features:
 * - H3 Semibold heading and 3-column grid layout
 * - Photo thumbnails with 1:1 aspect ratio and 8px gap
 * - Lazy loading with intersection observer (200px root margin)
 * - Shimmer placeholder during image loading
 * - Tap handler to open fullscreen photo viewer
 * - "No photos yet" fallback when archive is empty
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ArchivePhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
}

export interface ArchiveSectionProps {
  playerId: string;
  photos?: ArchivePhoto[];
}

export function ArchiveSection({ photos = [] }: ArchiveSectionProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <section
        style={{
          background: 'var(--color-surf)',
          padding: '16px 24px',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
        }}
      >
        <h3 className="text-[20px] font-semibold mb-2" style={{ color: 'var(--color-t1)' }}>Archive</h3>
        <p style={{ color: 'var(--color-t3)', fontSize: '0.875rem' }}>No photos yet</p>
      </section>
    );
  }

  const handlePhotoTap = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleCloseViewer = () => {
    setSelectedPhotoIndex(null);
  };

  return (
    <>
      <section
        style={{
          background: 'var(--color-surf)',
          padding: '16px 24px',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
        }}
      >
        <h3 className="text-[20px] font-semibold mb-3" style={{ color: 'var(--color-t1)' }}>Archive</h3>
        <div className="grid grid-cols-3" style={{ gap: '8px' }}>
          {photos.map((photo, index) => (
            <LazyPhoto
              key={photo.id}
              photo={photo}
              index={index}
              onTap={() => handlePhotoTap(index)}
            />
          ))}
        </div>
      </section>

      <AnimatePresence>
        {selectedPhotoIndex !== null && (
          <FullscreenPhotoViewer
            photos={photos}
            initialIndex={selectedPhotoIndex}
            onClose={handleCloseViewer}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface LazyPhotoProps {
  photo: ArchivePhoto;
  index: number;
  onTap: () => void;
}

function LazyPhoto({ photo, index, onTap }: LazyPhotoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );
    observer.observe(imgRef.current);
    return () => { observer.disconnect(); };
  }, []);

  return (
    <motion.div
      ref={imgRef}
      className="overflow-hidden cursor-pointer relative"
      style={{
        aspectRatio: '1 / 1',
        borderRadius: '8px',
        background: 'var(--color-surf-2)',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onTap}
    >
      {isLoading && <ShimmerPlaceholder />}
      {isVisible && !hasError && (
        <img
          src={photo.thumbnailUrl || photo.url}
          alt={`Archive photo ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => { setIsLoading(false); setHasError(true); }}
          style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.2s ease-in' }}
        />
      )}
      {hasError && (
        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-surf-2)' }}>
          <span style={{ color: 'var(--color-t3)', fontSize: '0.75rem' }}>Failed to load</span>
        </div>
      )}
    </motion.div>
  );
}

function ShimmerPlaceholder() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'var(--color-surf-2)' }}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
          width: '100%',
          height: '100%',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

interface FullscreenPhotoViewerProps {
  photos: ArchivePhoto[];
  initialIndex: number;
  onClose: () => void;
}

function FullscreenPhotoViewer({ photos, initialIndex, onClose }: FullscreenPhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : prev));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); }
      else if (e.key === 'ArrowLeft') { handlePrevious(); }
      else if (e.key === 'ArrowRight') { handleNext(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors"
        style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
        aria-label="Close photo viewer"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full text-white text-sm"
        style={{ background: 'rgba(0,0,0,0.5)' }}>
        {currentIndex + 1} / {photos.length}
      </div>

      <motion.div
        key={currentIndex}
        className="w-full h-full flex items-center justify-center p-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <img
          src={photos[currentIndex].url}
          alt={`Archive photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </motion.div>

      {currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white transition-colors"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          aria-label="Previous photo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white transition-colors"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          aria-label="Next photo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Swipe area for mobile */}
      <div
        className="absolute inset-0"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const startX = touch.clientX;
          const handleTouchEnd = (endEvent: TouchEvent) => {
            const endTouch = endEvent.changedTouches[0];
            const deltaX = endTouch.clientX - startX;
            if (Math.abs(deltaX) > 50) {
              if (deltaX > 0) { handlePrevious(); } else { handleNext(); }
            }
            document.removeEventListener('touchend', handleTouchEnd);
          };
          document.addEventListener('touchend', handleTouchEnd);
        }}
      />
    </motion.div>
  );
}
