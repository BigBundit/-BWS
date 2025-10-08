import React, { useRef } from 'react';
import { AppState, Bookmark, Note } from '../types';

interface HeaderProps {
  bookmarks: Bookmark[];
  notes: Note[];
  onImport: (state: AppState) => void;
  currentUser: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ bookmarks, notes, onImport, currentUser, onLogout }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const state: AppState = { bookmarks, notes };
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bws-backup-${currentUser}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const importedState = JSON.parse(text);
          // Basic validation for new and old formats
          if (Array.isArray(importedState.bookmarks) && (Array.isArray(importedState.notes) || Array.isArray(importedState.todos))) {
            onImport(importedState);
          } else {
            alert('Invalid file format.');
          }
        }
      } catch (error) {
        console.error('Error parsing imported file:', error);
        alert('Could not import file. It may be corrupted.');
      }
    };
    reader.readAsText(file);
    // Reset file input to allow importing the same file again
    event.target.value = '';
  };
  
  return (
    <header className="flex-shrink-0 flex justify-between items-center p-4 bg-black/30 border border-cyan-500/30 rounded-lg shadow-lg backdrop-blur-sm flex-wrap gap-2">
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.7)]">
          BWS: <span className="hidden sm:inline">Bookmark Work Space</span>
        </h1>
        <p className="text-xs text-cyan-500/80 -mt-1 pl-1">by Bigbundit</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="text-fuchsia-300 hidden sm:inline text-sm">
          User: {currentUser}
        </span>
        <div className="flex gap-2">
          <button onClick={handleImportClick} className="px-3 py-2 bg-cyan-900/50 hover:bg-cyan-500/70 border border-cyan-500 rounded-md transition-all text-cyan-300 hover:text-white hover:drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
            Import
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          <button onClick={handleExport} className="px-3 py-2 bg-cyan-900/50 hover:bg-cyan-500/70 border border-cyan-500 rounded-md transition-all text-cyan-300 hover:text-white hover:drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
            Export
          </button>
          <button onClick={onLogout} className="px-3 py-2 bg-fuchsia-900/50 hover:bg-fuchsia-500/70 border border-fuchsia-500 rounded-md transition-all text-fuchsia-300 hover:text-white hover:drop-shadow-[0_0_5px_rgba(232,121,249,0.8)]">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;