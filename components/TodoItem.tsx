
import React, { useState } from 'react';
import { Note } from '../types';
import { TrashIcon, CodeBracketIcon, DocumentTextIcon, DocumentDuplicateIcon, ClipboardDocumentCheckIcon } from './icons';

interface NoteItemProps {
  note: Note;
  onDelete: (id: string) => void;
  onClick: () => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, onClick }) => {
  const [copied, setCopied] = useState(false);

  const TypeIcon = () => {
    switch (note.type) {
      case 'code':
        return <CodeBracketIcon className="w-5 h-5 text-fuchsia-400 flex-shrink-0" />;
      case 'text':
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    }
  };
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(note.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  return (
    <div
      className="flex items-center gap-3 p-2 pr-1 rounded-md bg-gray-800/50 group relative transition-all duration-300 hover:bg-gray-700/50 animate-fade-in-fast"
    >
      <button onClick={onClick} className="flex-grow flex items-center gap-3 text-left min-w-0 cursor-pointer w-full" aria-label={`View note: ${note.title}`}>
        <TypeIcon />
        <span className="text-gray-200 truncate flex-grow">{note.title}</span>
      </button>
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={handleCopy} 
            className={`p-1.5 rounded transition-colors ${copied ? 'bg-green-600/80 text-white' : 'bg-gray-900/70 hover:bg-blue-500/80 text-blue-300 hover:text-white'}`}
            title={copied ? "Copied!" : "Copy content"}
            aria-label={`Copy content of note: ${note.title}`}
        >
          {copied ? <ClipboardDocumentCheckIcon className="w-4 h-4" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
        </button>
        <button 
            onClick={handleDelete} 
            className="p-1.5 rounded bg-gray-900/70 hover:bg-red-500/80 text-red-400 hover:text-white transition-colors" 
            title="Delete note"
            aria-label={`Delete note: ${note.title}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NoteItem;
