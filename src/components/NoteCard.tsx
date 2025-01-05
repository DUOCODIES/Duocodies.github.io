import React from 'react';
import { Star, MoreVertical } from 'lucide-react';

interface NoteCardProps {
  title: string;
  content: string;
  date: string;
  isFavorite?: boolean;
}

export function NoteCard({ title, content, date, isFavorite = false }: NoteCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex gap-2">
          <button className={`p-1 rounded-full hover:bg-gray-100 ${isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}>
            <Star size={18} />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-100">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
      <p className="text-gray-600 mb-4 line-clamp-3">{content}</p>
      <time className="text-sm text-gray-400">{date}</time>
    </div>
  );
}