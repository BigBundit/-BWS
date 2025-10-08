import React, { useState, DragEvent } from 'react';
import { Bookmark, Category } from '../types';
import IconComponent from './IconComponent';
import Modal from './Modal';
import { ICONS, ICON_KEYS } from './icons';
import { PlusIcon } from './icons';

interface IconGridProps {
  bookmarks: Bookmark[];
  categories: readonly Category[];
  onAdd: (bookmark: Omit<Bookmark, 'id'>) => void;
  onUpdate: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, bookmark: Bookmark) => void;
}

const IconGrid: React.FC<IconGridProps> = ({ bookmarks, categories, onAdd, onUpdate, onDelete, onDragStart }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [initialBookmarkData, setInitialBookmarkData] = useState<Partial<Omit<Bookmark, 'id' | 'category'>> | null>(null);
  const [newBookmarkCategory, setNewBookmarkCategory] = useState<Category>('MainWork');
  const [isDraggingOver, setIsDraggingOver] = useState<Category | null>(null);

  const openAddModal = (category: Category) => {
    setNewBookmarkCategory(category);
    setEditingBookmark(null);
    setInitialBookmarkData(null);
    setIsModalOpen(true);
  };

  const openEditModal = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setInitialBookmarkData(null);
    setNewBookmarkCategory(bookmark.category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBookmark(null);
    setInitialBookmarkData(null);
  };

  const handleSave = (formData: Omit<Bookmark, 'id' | 'category'>) => {
    if (editingBookmark) {
      onUpdate({ ...editingBookmark, ...formData, category: newBookmarkCategory });
    } else {
      onAdd({ ...formData, category: newBookmarkCategory });
    }
    closeModal();
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>, category: Category) => {
    e.preventDefault();
    setIsDraggingOver(category);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, category: Category) => {
    e.preventDefault();
    setIsDraggingOver(null);
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url) {
      try {
        const urlObj = new URL(url);
        const name = urlObj.hostname.replace('www.', '');
        setNewBookmarkCategory(category);
        setEditingBookmark(null); // Ensure we are not in edit mode
        setInitialBookmarkData({ url, name, icon: 'GlobeAlt' }); // Set initial data for a NEW bookmark
        setIsModalOpen(true);
      } catch (err) {
        console.error("Invalid URL dropped:", url);
      }
    }
  };

  return (
    <div className="h-full bg-black/30 border border-cyan-500/30 rounded-lg p-4 overflow-y-auto backdrop-blur-sm shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-6">
      {categories.map(category => (
        <div 
          key={category}
          onDragOver={(e) => handleDragOver(e, category)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, category)}
          className={`p-4 border border-cyan-800/50 rounded-lg transition-all duration-300 flex flex-col h-full ${isDraggingOver === category ? 'bg-cyan-500/20 shadow-cyan-400/50 shadow-inner' : ''}`}
        >
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-semibold text-fuchsia-300 drop-shadow-[0_0_5px_rgba(232,121,249,0.7)]">{category}</h2>
            <button onClick={() => openAddModal(category)} className="p-1 rounded-full text-cyan-300 hover:bg-cyan-500/50 hover:text-white transition-colors">
              <PlusIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 flex-grow">
            {bookmarks.filter(b => b.category === category).map(bookmark => (
              <IconComponent
                key={bookmark.id}
                bookmark={bookmark}
                onDragStart={(e) => onDragStart(e, bookmark)}
                onEdit={() => openEditModal(bookmark)}
                onDelete={() => onDelete(bookmark.id)}
              />
            ))}
             <div className="text-center text-gray-500 italic p-4 col-span-full">
                {isDraggingOver === category ? 'Drop link to create bookmark' : bookmarks.filter(b => b.category === category).length === 0 ? 'Add a bookmark or drag a link here.' : ''}
            </div>
          </div>
        </div>
      ))}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <BookmarkForm
          key={editingBookmark?.id || (initialBookmarkData ? 'new-dropped' : 'new')}
          bookmark={editingBookmark}
          initialData={initialBookmarkData}
          onSave={handleSave}
          onClose={closeModal}
        />
      </Modal>
    </div>
  );
};

interface BookmarkFormProps {
  bookmark: Omit<Bookmark, 'category'> | null;
  initialData?: Partial<Omit<Bookmark, 'id' | 'category'>> | null;
  onSave: (formData: Omit<Bookmark, 'id' | 'category'>) => void;
  onClose: () => void;
}

const BookmarkForm: React.FC<BookmarkFormProps> = ({ bookmark, initialData, onSave, onClose }) => {
  const [name, setName] = useState(bookmark?.name || initialData?.name || '');
  const [url, setUrl] = useState(bookmark?.url || initialData?.url || '');
  const [selectedIcon, setSelectedIcon] = useState(bookmark?.icon || initialData?.icon || 'GlobeAlt');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && url) {
      onSave({ name, url, icon: selectedIcon });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <h3 className="text-2xl text-center font-bold text-cyan-300 drop-shadow-[0_0_5px_rgba(0,255,255,0.7)]">
        {bookmark ? 'Edit Bookmark' : 'New Bookmark'}
      </h3>
      <div>
        <label htmlFor="name" className="block text-fuchsia-300 mb-1">Name</label>
        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 bg-gray-900/70 border border-cyan-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
      </div>
      <div>
        <label htmlFor="url" className="block text-fuchsia-300 mb-1">URL</label>
        <input id="url" type="url" value={url} onChange={e => setUrl(e.target.value)} required className="w-full p-2 bg-gray-900/70 border border-cyan-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
      </div>
      <div>
        <label className="block text-fuchsia-300 mb-1">Icon</label>
        <div className="grid grid-cols-6 gap-2 p-2 bg-gray-900/70 border border-cyan-700 rounded-md max-h-48 overflow-y-auto">
          {ICON_KEYS.map(iconKey => {
            const Icon = ICONS[iconKey];
            return (
              <button
                type="button"
                key={iconKey}
                onClick={() => setSelectedIcon(iconKey)}
                className={`p-2 rounded-md transition-all ${selectedIcon === iconKey ? 'bg-cyan-500 ring-2 ring-cyan-300' : 'bg-gray-800 hover:bg-cyan-800'}`}
              >
                <Icon className={`w-8 h-8 mx-auto ${selectedIcon === iconKey ? 'text-white' : 'text-cyan-300'}`} />
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/70 border border-gray-500 rounded-md transition-all text-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-cyan-900/50 hover:bg-cyan-500/70 border border-cyan-500 rounded-md transition-all text-cyan-300 hover:text-white hover:drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">Save</button>
      </div>
    </form>
  );
};


export default IconGrid;