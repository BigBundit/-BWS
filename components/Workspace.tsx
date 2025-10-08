

import React, { useState, DragEvent, useRef } from 'react';
import { Note } from '../types';
import NoteItem from './TodoItem';
import Modal from './Modal';
import { PlusIcon, FolderOpenIcon, DocumentDuplicateIcon, TrashIcon, PhotoIcon, CodeBracketIcon, PencilIcon, ClipboardDocumentCheckIcon } from './icons';

interface NotePanelProps {
  notes: Note[];
  onAdd: (note: Omit<Note, 'id'>) => void;
  addMultipleNotes: (noteContents: string[]) => void;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDeleteAll: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


const PasteTextModal: React.FC<{ onSave: (text: string) => void; onClose: () => void }> = ({ onSave, onClose }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <h3 className="text-2xl text-center font-bold text-cyan-300 drop-shadow-[0_0_5px_rgba(0,255,255,0.7)]">
        Paste Text as Note Titles
      </h3>
      <p className="text-center text-sm text-gray-400 -mt-2">Each new line will be a separate note title.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="- Note one...&#10;- Another note..."
        rows={8}
        className="w-full p-2 bg-gray-900/70 border border-fuchsia-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
        autoFocus
      />
      <div className="flex justify-end gap-4 mt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/70 border border-gray-500 rounded-md transition-all text-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-fuchsia-900/50 hover:bg-fuchsia-500/70 border border-fuchsia-500 rounded-md transition-all text-fuchsia-300 hover:text-white hover:drop-shadow-[0_0_5px_rgba(232,121,249,0.8)]">Add Notes</button>
      </div>
    </form>
  );
};

const NoteModal: React.FC<{
    onSave: (title: string, content: string) => void;
    onClose: () => void;
    initialContent?: string;
    initialTitle?: string;
    isEditing?: boolean;
}> = ({ onSave, onClose, initialContent = '', initialTitle = '', isEditing = false }) => {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onSave(title, content);
        } else {
            alert("Title cannot be empty.");
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const base64 = await fileToBase64(file);
            const markdown = `\n![${file.name}](${base64})\n`;
            setContent(prev => prev + markdown);
            contentTextareaRef.current?.focus();
        }
        event.target.value = '';
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 max-h-[80vh]">
             <h3 className="text-2xl text-center font-bold text-cyan-300 drop-shadow-[0_0_5px_rgba(0,255,255,0.7)]">
                {isEditing ? 'Edit Note' : 'Add New Note'}
            </h3>
            <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Note title"
                required
                className="w-full p-2 bg-gray-900/70 border border-fuchsia-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                autoFocus
            />
            <div className="flex-grow flex flex-col gap-2 min-h-0">
                <textarea
                    ref={contentTextareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Note content... You can add images!"
                    rows={10}
                    className="w-full p-2 bg-gray-900/70 border border-fuchsia-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 flex-grow"
                />
                 <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 bg-cyan-900/50 hover:bg-cyan-500/70 border border-cyan-500 rounded-md transition-all text-cyan-300 hover:text-white flex items-center justify-center gap-2">
                    <PhotoIcon className="w-5 h-5" /> Add Image
                </button>
            </div>
            <div className="flex justify-end gap-4 mt-2 flex-shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/70 border border-gray-500 rounded-md transition-all text-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-fuchsia-900/50 hover:bg-fuchsia-500/70 border border-fuchsia-500 rounded-md transition-all text-fuchsia-300 hover:text-white hover:drop-shadow-[0_0_5px_rgba(232,121,249,0.8)]">Save Note</button>
            </div>
        </form>
    );
};


const CodeModal: React.FC<{ onSave: (title: string, code: string, lang: string) => void; onClose: () => void }> = ({ onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [lang, setLang] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && code.trim()) {
            onSave(title, code, lang);
        } else {
            alert("Title and code cannot be empty.")
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
            <h3 className="text-2xl text-center font-bold text-cyan-300 drop-shadow-[0_0_5px_rgba(0,255,255,0.7)]">
                Add Code Snippet
            </h3>
            <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Snippet title"
                required
                className="w-full p-2 bg-gray-900/70 border border-fuchsia-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                autoFocus
            />
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                rows={10}
                required
                className="w-full p-2 bg-gray-900/70 border border-fuchsia-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 font-mono text-sm"
            />
             <div>
                <label htmlFor="lang" className="block text-fuchsia-300 mb-1 text-sm">Language (optional)</label>
                <input id="lang" type="text" value={lang} onChange={e => setLang(e.target.value)} placeholder="e.g., javascript, python" className="w-full p-2 bg-gray-900/70 border border-fuchsia-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400" />
            </div>
            <div className="flex justify-end gap-4 mt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/70 border border-gray-500 rounded-md transition-all text-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-fuchsia-900/50 hover:bg-fuchsia-500/70 border border-fuchsia-500 rounded-md transition-all text-fuchsia-300 hover:text-white hover:drop-shadow-[0_0_5px_rgba(232,121,249,0.8)]">Add Snippet</button>
            </div>
        </form>
    );
};

const NoteDetailView: React.FC<{ note: Note; onUpdate: (note: Note) => void; onClose: () => void; }> = ({ note, onUpdate, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = (title: string, content: string) => {
    onUpdate({ ...note, title, content });
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderContent = (contentString: string) => {
      if (!contentString) {
          return <span className="text-gray-500 italic">No content.</span>;
      }
      const parts = contentString.split(/(!\[.*?\]\(data:image\/.*?\))/g);
      return parts.map((part, index) => {
          if (part.match(/(!\[.*?\]\(data:image\/.*?\))/)) {
              const imageUrl = part.match(/\((.*?)\)/)?.[1];
              const altText = part.match(/!\[(.*?)\]/)?.[1];
              if (imageUrl) {
                 return <img key={index} src={imageUrl} alt={altText} className="max-w-full rounded-md my-2" />;
              }
          }
          return <span key={index}>{part}</span>;
      });
  };

  if (isEditing) {
    return (
        <NoteModal 
            onSave={handleSave}
            onClose={() => setIsEditing(false)}
            initialTitle={note.title}
            initialContent={note.content}
            isEditing={true}
        />
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4 max-h-[80vh]">
      <div className="flex justify-between items-start gap-4 flex-shrink-0">
        <h3 className="text-xl font-bold text-cyan-300 break-words flex-grow drop-shadow-[0_0_5px_rgba(0,255,255,0.7)]">{note.title}</h3>
        <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="p-1.5 rounded-full bg-gray-800/70 hover:bg-blue-500/80 text-blue-300 hover:text-white transition-colors" title="Copy content">
                 <ClipboardDocumentCheckIcon className="w-5 h-5" />
            </button>
             <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-full bg-gray-800/70 hover:bg-yellow-500/80 text-yellow-300 hover:text-white transition-colors" title="Edit note">
                <PencilIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      {copied && <p className="text-center text-blue-400 text-xs animate-fade-in-fast -mt-2">Copied to clipboard!</p>}
      <div className="overflow-y-auto pr-2 flex-grow min-h-0 whitespace-pre-wrap">
        {note.type === 'text' && <div>{renderContent(note.content)}</div>}
        {note.type === 'code' && (
          <div className="bg-gray-900/80 p-3 rounded-md relative">
            <pre className="text-sm text-cyan-300 whitespace-pre-wrap font-mono"><code>{note.content}</code></pre>
            {note.lang && <span className="absolute top-1 right-1 text-xs text-fuchsia-500 bg-gray-800 px-1.5 py-0.5 rounded opacity-50">{note.lang}</span>}
          </div>
        )}
      </div>
      <div className="flex justify-end mt-2 flex-shrink-0">
        <button onClick={onClose} className="px-4 py-2 bg-fuchsia-900/50 hover:bg-fuchsia-500/70 border border-fuchsia-500 rounded-md transition-all text-fuchsia-300 hover:text-white">Close</button>
      </div>
    </div>
  );
};


const NotePanel: React.FC<NotePanelProps> = ({ notes, onAdd, addMultipleNotes, onUpdate, onDelete, onDrop, onDeleteAll }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [newNoteInitialContent, setNewNoteInitialContent] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);

  const handleAddNote = (title: string, content: string) => {
    onAdd({ type: 'text', title, content });
    setIsNewNoteModalOpen(false);
    setNewNoteInitialContent('');
  };
  
  const handleCodeSave = (title: string, code: string, lang: string) => {
    onAdd({ type: 'code', title, content: code, lang: lang.trim() });
    setIsCodeModalOpen(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
            const base64 = await fileToBase64(file);
            const markdown = `![${file.name}](${base64})`;
            setNewNoteInitialContent(markdown);
            setIsNewNoteModalOpen(true);
            return;
        }
    }
    onDrop(e);
  };

  const handleFileImportClick = () => {
    textFileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        addMultipleNotes(text.split('\n'));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handlePasteSave = (text: string) => {
    addMultipleNotes(text.split('\n'));
  };

  const handleClearAll = () => {
    if (notes.length > 0 && window.confirm('Are you sure you want to delete all notes? This action cannot be undone.')) {
        onDeleteAll();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`h-full w-full flex flex-col gap-4 bg-black/30 backdrop-blur-sm transition-all duration-300 ${isDraggingOver ? 'bg-fuchsia-500/20 shadow-fuchsia-400/50 shadow-inner' : ''}`}
    >
      <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setIsNewNoteModalOpen(true)} className="p-2 bg-fuchsia-900/50 hover:bg-fuchsia-500/70 border border-fuchsia-500 rounded-md transition-all text-fuchsia-300 hover:text-white flex items-center justify-center gap-2">
                <PlusIcon className="w-5 h-5" /> Add Note
            </button>
            <button type="button" onClick={() => setIsCodeModalOpen(true)} className="p-2 bg-cyan-900/50 hover:bg-cyan-500/70 border border-cyan-500 rounded-md transition-all text-cyan-300 hover:text-white flex items-center justify-center gap-2">
                <CodeBracketIcon className="w-5 h-5" /> Add Code
            </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <button onClick={handleFileImportClick} title="Import notes from a .txt file" className="flex items-center justify-center gap-2 px-2 py-2 bg-gray-800/50 hover:bg-gray-700/70 border border-fuchsia-500/30 rounded-md transition-all text-fuchsia-300 hover:text-white">
            <FolderOpenIcon className="w-5 h-5" /> From File
          </button>
          <input type="file" ref={textFileInputRef} onChange={handleFileChange} accept=".txt" className="hidden" />

          <button onClick={() => setIsPasteModalOpen(true)} title="Paste a block of text as notes" className="flex items-center justify-center gap-2 px-2 py-2 bg-gray-800/50 hover:bg-gray-700/70 border border-fuchsia-500/30 rounded-md transition-all text-fuchsia-300 hover:text-white">
            <DocumentDuplicateIcon className="w-5 h-5" /> From Text
          </button>
          
          <button 
            onClick={handleClearAll}
            disabled={notes.length === 0}
            title="Delete all notes" 
            className="flex items-center justify-center gap-2 px-2 py-2 bg-red-900/50 hover:bg-red-500/70 border border-red-500/50 rounded-md transition-all text-red-300 hover:text-white disabled:bg-gray-800/30 disabled:border-gray-600/30 disabled:text-gray-500 disabled:cursor-not-allowed sm:col-span-1 col-span-2"
          >
            <TrashIcon className="w-5 h-5" /> Clear All
          </button>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 space-y-2 border-t border-fuchsia-500/20 pt-4 mt-2">
        {notes.length > 0 ? (
          notes.map(note => (
            <NoteItem key={note.id} note={note} onDelete={onDelete} onClick={() => setSelectedNote(note)} />
          ))
        ) : (
          <div className="text-center text-gray-500 italic p-4 h-full flex items-center justify-center">
            {isDraggingOver ? "Drop bookmark or image to create note" : "No notes yet. Add one above!"}
          </div>
        )}
      </div>
      <Modal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)}>
        <PasteTextModal onSave={handlePasteSave} onClose={() => setIsPasteModalOpen(false)} />
      </Modal>
      <Modal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)}>
        <CodeModal onSave={handleCodeSave} onClose={() => setIsCodeModalOpen(false)} />
      </Modal>
        <Modal isOpen={isNewNoteModalOpen} onClose={() => { setIsNewNoteModalOpen(false); setNewNoteInitialContent(''); }}>
            <NoteModal 
                onSave={handleAddNote} 
                onClose={() => { setIsNewNoteModalOpen(false); setNewNoteInitialContent(''); }}
                initialContent={newNoteInitialContent}
            />
        </Modal>
      <Modal isOpen={!!selectedNote} onClose={() => setSelectedNote(null)}>
        {selectedNote && <NoteDetailView note={selectedNote} onUpdate={onUpdate} onClose={() => setSelectedNote(null)} />}
      </Modal>
    </div>
  );
};

export default NotePanel;