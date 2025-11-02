import React, { useEffect } from 'react';
import { XIcon } from './Icons';

interface LightboxProps {
  imageUrl: string;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{ animationDuration: '0.2s' }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20"
        aria-label="Close lightbox"
      >
        <XIcon className="w-6 h-6" />
      </button>
      <div 
        className="relative" 
        onClick={(e) => e.stopPropagation()}
        aria-label="Enlarged image view"
      >
        <img
          src={imageUrl}
          alt="Enlarged view"
          className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};

export default Lightbox;