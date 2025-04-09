'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface Note {
  id: string;
  content: string;
  created_at: string;
  category?: string;
  tags?: string[];
  is_archived?: boolean;
  audio_url?: string;
  formatted_content?: string;
}

interface NoteListProps {
  notes: Note[];
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onShare?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function NoteList({
  notes,
  onDelete,
  onArchive,
  onShare,
  onEdit,
}: NoteListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const categories = ['all', 'work', 'personal', 'ideas', 'meetings', 'other'];
  const filteredNotes = notes
    .filter((note) => (showArchived ? note.is_archived : !note.is_archived))
    .filter((note) => {
      if (selectedCategory === 'all') return true;
      return note.category === selectedCategory;
    })
    .filter((note) => {
      if (!searchQuery) return true;
      return (
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    });

  const handlePlayAudio = async (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  return (
    <div className="mt-8">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search notes..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              {note.category && (
                <span className="px-2 py-1 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full">
                  {note.category}
                </span>
              )}
              <div className="flex gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(note.id)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Edit note"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                )}
                {onShare && (
                  <button
                    onClick={() => onShare(note.id)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Share note"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>
                )}
                {onArchive && (
                  <button
                    onClick={() => onArchive(note.id)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={note.is_archived ? 'Unarchive note' : 'Archive note'}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => onDelete(note.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label="Delete note"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              {note.formatted_content ? (
                <div
                  dangerouslySetInnerHTML={{ __html: note.formatted_content }}
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  {note.content}
                </p>
              )}
            </div>

            {note.tags && note.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {note.audio_url && (
              <button
                onClick={() => handlePlayAudio(note.audio_url!)}
                className="mt-2 flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
                Play Recording
              </button>
            )}

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {new Date(note.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No notes found. {showArchived ? 'No archived notes.' : 'Create a new note to get started!'}
          </p>
        </div>
      )}
    </div>
  );
} 