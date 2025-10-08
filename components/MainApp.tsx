
import React, { useState, useEffect } from 'react';
import { Bookmark, Note, AppState, CATEGORIES, NoteType } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import Header from './Header';
import IconGrid from './IconGrid';
import Workspace from './Workspace';
import GoogleCalendarPanel from './GoogleCalendarPanel';
import { ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, DocumentTextIcon, CalendarIcon } from './icons';

// Define initial values outside component to ensure they are stable references
const INITIAL_BOOKMARKS: Bookmark[] = [];
const INITIAL_NOTES: Note[] = [];

interface MainAppProps {
  currentUser: string;
  onLogout: () => void;
}

type ActivePanel = 'todos' | 'calendar';

const MainApp: React.FC<MainAppProps> = ({ currentUser, onLogout }) => {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>(`bws-bookmarks-${currentUser}`, INITIAL_BOOKMARKS);
  const [notes, setNotes] = useLocalStorage<Note[]>(`bws-notes-${currentUser}`, INITIAL_NOTES);
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>('todos');
  const [draggedBookmark, setDraggedBookmark] = useState<Bookmark | null>(null);
  const [isPanelMaximized, setIsPanelMaximized] = useState<boolean>(false);

  useEffect(() => {
    // Data migration for notes without a title or of the old 'image' type
    const notesNeedMigration = notes.some(n => !('title' in n) || (n as any).type === 'image');
    if (notesNeedMigration) {
      const migratedNotes = notes.map(note => {
        const newNote: any = { ...note };
        
        // Migrate old todo-like notes that don't have a title
        if (!('title' in newNote) || newNote.title === undefined) {
          const lines = (newNote.content || '').split('\n');
          newNote.title = lines[0] || 'Untitled Note';
          newNote.content = lines.slice(1).join('\n');
        }

        // Migrate old image notes to be text notes with markdown
        if (newNote.type === 'image') {
          newNote.content = `![${newNote.title}](${newNote.content})`;
          newNote.type = 'text';
        }
        
        return newNote as Note;
      });
      setNotes(migratedNotes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleImport = (state: AppState & { todos?: any[] }) => {
    if (state.bookmarks) setBookmarks(state.bookmarks);

    let finalNotes: Note[] = [];
    const importedNotes = state.notes || [];

    if (importedNotes.length > 0) {
        finalNotes = importedNotes.map((n: any) => {
            let type: NoteType = n.type;
            let content = n.content || '';

            if (type === ('image' as any)) {
                type = 'text';
                content = `![${n.title || 'Imported Image'}](${content})`;
            } else if (type !== 'text' && type !== 'code') {
                type = 'text';
            }

            return {
                id: n.id || crypto.randomUUID(),
                title: n.title || (content || 'Untitled').split('\n')[0],
                content: n.title ? content : (content || '').split('\n').slice(1).join('\n'),
                type: type,
                lang: n.lang,
                bookmarkId: n.bookmarkId
            };
        });
    } else if (state.todos) {
      // Backward compatibility: convert todos to notes
      finalNotes = state.todos.map(todo => ({
        id: todo.id || crypto.randomUUID(),
        type: 'text',
        title: todo.text,
        content: '',
        bookmarkId: todo.bookmarkId,
      }));
    }
    setNotes(finalNotes);
  };

  const addBookmark = (bookmark: Omit<Bookmark, 'id'>) => {
    setBookmarks(prev => [...prev, { ...bookmark, id: crypto.randomUUID() }]);
  };

  const updateBookmark = (updatedBookmark: Bookmark) => {
    setBookmarks(prev => prev.map(b => b.id === updatedBookmark.id ? updatedBookmark : b));
  };

  const deleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const addNote = (note: Omit<Note, 'id'>) => {
    setNotes(prev => [{ ...note, id: crypto.randomUUID() }, ...prev]);
  };

  const addMultipleNotes = (noteContents: string[]) => {
    const newNotes: Note[] = noteContents
      .map(content => content.trim())
      .filter(content => content !== '')
      .map(title => ({ title, content: '', type: 'text', id: crypto.randomUUID() }));
    
    if (newNotes.length > 0) {
      setNotes(prev => [...newNotes, ...prev]);
    }
  };

  const updateNote = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const deleteAllNotes = () => {
    setNotes([]);
  };

  const handleDragStart = (e: React.DragEvent, bookmark: Bookmark) => {
    e.dataTransfer.setData('text/uri-list', bookmark.url);
    e.dataTransfer.setData('text/plain', bookmark.url);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedBookmark(bookmark);
  };

  const handleDropOnWorkspace = (e: React.DragEvent) => {
    if (draggedBookmark) {
      addNote({ type: 'text', title: draggedBookmark.name, content: `URL: ${draggedBookmark.url}`, bookmarkId: draggedBookmark.id });
    }
  };
  
  const handleDragEnd = () => {
    setDraggedBookmark(null);
  };

  const TabButton: React.FC<{
    label: string;
    panel: ActivePanel;
    icon: React.ReactNode;
  }> = ({ label, panel, icon }) => {
      const isActive = activePanel === panel;
      return (
          <button
              onClick={() => setActivePanel(panel)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold rounded-t-lg transition-all duration-300 ${
                isActive
                    ? 'bg-fuchsia-800/20 text-fuchsia-300 shadow-[inset_0_2px_0_rgba(232,121,249,0.5)]'
                    : 'text-gray-400 hover:bg-fuchsia-500/10 hover:text-fuchsia-400'
              }`}
          >
              {icon}
              <span className="hidden sm:inline">{label}</span>
          </button>
      );
  };

  return (
    <div className="relative z-10 flex flex-col h-screen font-mono p-4 gap-4 bg-black/30" onDragEnd={handleDragEnd}>
      <Header 
        bookmarks={bookmarks} 
        notes={notes} 
        onImport={handleImport}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      <main className="flex-grow flex gap-4 overflow-hidden">
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isPanelMaximized ? 'w-0' : (isPanelVisible ? 'w-full md:w-[70%]' : 'w-full')
          }`}
        >
          <IconGrid
            bookmarks={bookmarks}
            onAdd={addBookmark}
            onUpdate={updateBookmark}
            onDelete={deleteBookmark}
            onDragStart={handleDragStart}
            categories={CATEGORIES}
          />
        </div>
        <div
          className={`relative transition-all duration-500 ease-in-out flex flex-col ${
            isPanelMaximized ? 'w-full' : (isPanelVisible ? 'w-full md:w-[30%]' : 'w-0')
          }`}
        >
          {!isPanelMaximized && (
            <button
              onClick={() => setIsPanelVisible(!isPanelVisible)}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-1 bg-cyan-900/50 hover:bg-cyan-500/70 border border-cyan-500 rounded-full backdrop-blur-sm transition-all text-cyan-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.9)]"
              title={isPanelVisible ? 'Collapse Panel' : 'Expand Panel'}
            >
              {isPanelVisible ? <ChevronRightIcon className="w-6 h-6" /> : <ChevronLeftIcon className="w-6 h-6" />}
            </button>
          )}
          
          {isPanelVisible && (
            <div className="h-full w-full flex flex-col gap-2 bg-black/30 border border-fuchsia-500/30 rounded-lg p-4 backdrop-blur-sm shadow-lg">
                <div className="flex-shrink-0 flex justify-between items-end border-b-2 border-fuchsia-800/50">
                    <div className="flex-grow flex">
                        <TabButton label="Notes" panel="todos" icon={<DocumentTextIcon className="w-5 h-5" />} />
                        <TabButton label="Calendar" panel="calendar" icon={<CalendarIcon className="w-5 h-5" />} />
                    </div>
                    <button
                        onClick={() => setIsPanelMaximized(!isPanelMaximized)}
                        className="p-1 mb-1 text-cyan-300 hover:text-white hover:bg-cyan-500/50 rounded-full"
                        title={isPanelMaximized ? 'Minimize Panel' : 'Maximize Panel'}
                    >
                        {isPanelMaximized ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
                    </button>
                </div>
                <div className="flex-grow overflow-hidden pt-2">
                    {activePanel === 'todos' && (
                        <Workspace
                            notes={notes}
                            onAdd={addNote}
                            addMultipleNotes={addMultipleNotes}
                            onUpdate={updateNote}
                            onDelete={deleteNote}
                            onDeleteAll={deleteAllNotes}
                            onDrop={handleDropOnWorkspace}
                        />
                    )}
                    {activePanel === 'calendar' && <GoogleCalendarPanel currentUser={currentUser} />}
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MainApp;