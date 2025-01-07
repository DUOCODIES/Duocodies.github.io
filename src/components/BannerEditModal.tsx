import React, { useState } from 'react';
import { Modal } from './Modal';

interface BannerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bannerData: {
    text: string;
    backgroundColor: string;
    textColor: string;
  }) => void;
  currentText: string;
  currentBackgroundColor: string;
  currentTextColor: string;
}

export function BannerEditModal({
  isOpen,
  onClose,
  onSave,
  currentText,
  currentBackgroundColor,
  currentTextColor,
}: BannerEditModalProps) {
  const [text, setText] = useState(currentText);
  const [backgroundColor, setBackgroundColor] = useState(currentBackgroundColor);
  const [textColor, setTextColor] = useState(currentTextColor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      text,
      backgroundColor,
      textColor,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Banner">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Edit Banner</h2>
        
        <div>
          <label htmlFor="banner-text" className="block text-sm font-medium text-gray-700">
            Banner Text
          </label>
          <textarea
            id="banner-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            rows={3}
            placeholder="Enter banner text..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="background-color" className="block text-sm font-medium text-gray-700">
              Background Color
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                id="background-color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-8 w-8 rounded-md border border-gray-300"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <label htmlFor="text-color" className="block text-sm font-medium text-gray-700">
              Text Color
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                id="text-color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-8 w-8 rounded-md border border-gray-300"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="#FFFFFF"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
} 