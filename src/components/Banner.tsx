import React from 'react';
import { X } from 'lucide-react';

interface BannerProps {
  isVisible: boolean;
  onClose: () => void;
  backgroundColor?: string;
  textColor?: string;
  children: React.ReactNode;
}

export function Banner({ 
  isVisible, 
  onClose, 
  backgroundColor = '#4F46E5',
  textColor = 'white',
  children 
}: BannerProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="relative"
      style={{ backgroundColor }}
    >
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center pr-16">
          <div className="text-center" style={{ color: textColor }}>
            {children}
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={onClose}
              className="flex p-1.5 rounded-lg hover:bg-opacity-20 hover:bg-gray-700 transition-colors"
              style={{ color: textColor }}
            >
              <span className="sr-only">Dismiss</span>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 