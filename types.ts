

export const CATEGORIES = ['MainWork', 'Subwork', 'AppSupport', 'Report'] as const;
export type Category = typeof CATEGORIES[number];

export interface Bookmark {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: Category;
}

export type NoteType = 'text' | 'code';

export interface Note {
  id:string;
  title: string;
  type: NoteType;
  content: string;
  lang?: string; // For code blocks
  bookmarkId?: string; 
}

export interface AppState {
  bookmarks: Bookmark[];
  notes: Note[];
}

export interface ReceivedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface MeetingRecording {
  id: string;
  videoUrl: string;
  transcript: string;
  duration: number;
  createdAt: string;
  summary?: string;
  isSummarizing?: boolean;
}