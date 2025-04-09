'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import AudioRecorder from './components/AudioRecorder';
import NoteList from './components/NoteList';
import Auth from './components/Auth';

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

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('work');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return;
    }

    setNotes(data || []);
  };

  const handleTranscription = async (text: string) => {
    setCurrentTranscription(text);
  };

  const handleSave = async () => {
    if (!currentTranscription.trim()) return;

    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          content: currentTranscription,
          user_id: user.id,
          category: selectedCategory,
          tags: tags,
          formatted_content: currentTranscription, // You can add markdown formatting here
        },
      ])
      .select();

    if (error) {
      console.error('Error saving note:', error);
      return;
    }

    if (data) {
      setNotes([data[0], ...notes]);
      setCurrentTranscription('');
      setTags([]);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting note:', error);
      return;
    }

    setNotes(notes.filter((note) => note.id !== id));
  };

  const handleArchive = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const { error } = await supabase
      .from('notes')
      .update({ is_archived: !note.is_archived })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error archiving note:', error);
      return;
    }

    setNotes(
      notes.map((n) =>
        n.id === id ? { ...n, is_archived: !n.is_archived } : n
      )
    );
  };

  const handleShare = async (id: string) => {
    // Implement sharing functionality
    const shareUrl = `${window.location.origin}/share/${id}`;
    await navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  const handleEdit = async (id: string) => {
    // Implement editing functionality
    const note = notes.find((n) => n.id === id);
    if (note) {
      setCurrentTranscription(note.content);
      setSelectedCategory(note.category || 'work');
      setTags(note.tags || []);
      handleDelete(id);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Voice Notes
          </h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Sign Out
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="ideas">Ideas</option>
              <option value="meetings">Meetings</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <AudioRecorder onTranscription={handleTranscription} />

          {currentTranscription && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                aria-label="Save note"
              >
                Save Note
              </button>
            </div>
          )}
        </div>

        <NoteList
          notes={notes}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onShare={handleShare}
          onEdit={handleEdit}
        />
      </div>
    </main>
  );
}
