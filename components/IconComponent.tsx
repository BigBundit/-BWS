
import React, { useState } from 'react';
import { Bookmark } from '../types';
import { ICONS } from './icons';
import { PencilIcon, TrashIcon } from './icons';

interface IconComponentProps {
  bookmark: Bookmark;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const IconComponent: React.FC<IconComponentProps> = ({ bookmark, onDragStart, onEdit, onDelete }) => {
  const Icon = ICONS[bookmark.icon] || ICONS.GlobeAlt;
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStartInternal = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    onDragStart(e);
  };

  const handleDragEndInternal = () => {
    // Use a timeout to ensure the click event can check this state
    // before it's reset.
    setTimeout(() => {
      setIsDragging(false);
    }, 50);
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  return (
    <div className="group relative aspect-square flex flex-col items-center justify-center p-2 rounded-lg bg-cyan-900/20 border border-cyan-500/20 hover:bg-cyan-500/30 transition-all duration-300 cursor-grab"
      draggable
      onDragStart={handleDragStartInternal}
      onDragEnd={handleDragEndInternal}
    >
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2" onClick={handleLinkClick}>
        <Icon className="w-10 h-10 text-cyan-300 group-hover:drop-shadow-[0_0_10px_rgba(0,255,255,0.9)] transition-all" />
        <span className="text-xs text-center text-gray-300 group-hover:text-white break-all">{bookmark.name}</span>
      </a>
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1 rounded bg-gray-800/70 hover:bg-yellow-500/80 text-yellow-300 hover:text-white">
          <PencilIcon className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1 rounded bg-gray-800/70 hover:bg-red-500/80 text-red-400 hover:text-white">
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default IconComponent;
