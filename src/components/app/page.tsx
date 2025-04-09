'use client';

import { useState, useEffect } from 'react';
import AudioRecorder from '../components/AudioRecorder';
import NoteList from '../components/NoteList';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
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
      .insert([{ content: currentTranscription }])
      .select();

    if (error) {
      console.error('Error saving note:', error);
      return;
    }

    if (data) {
      setNotes([data[0], ...notes]);
      setCurrentTranscription('');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      return;
    }

    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Voice Notes</h1>
        
        <div className="max-w-2xl mx-auto">
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

        <NoteList notes={notes} onDelete={handleDelete} />
      </div>
    </main>
  );
} 