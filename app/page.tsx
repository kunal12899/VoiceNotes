'use client';

import { useState, useEffect } from 'react';
import AudioRecorder from './components/AudioRecorder';
import NoteList from './components/NoteList';
import Logo from './components/Logo';
import ThemeToggle from './components/ThemeToggle';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with dummy values if not provided
// This allows the app to work without Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Check if Supabase is properly configured
const isSupabaseConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined && 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== undefined &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key';

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [configError, setConfigError] = useState<string>('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConfigError('Supabase is not configured. Notes will not be saved permanently. Check your .env.local file.');
    } else {
      fetchNotes();
    }
  }, []);

  const fetchNotes = async () => {
    if (!isSupabaseConfigured) return;
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setNotes(data || []);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      setConfigError(`Error connecting to database: ${error.message || 'Unknown error'}`);
    }
  };

  const handleTranscription = (text: string) => {
    setCurrentTranscription(text);
  };

  const handleSave = async () => {
    if (!currentTranscription.trim()) return;

    try {
      // If Supabase is not configured, create a local note
      if (!isSupabaseConfigured) {
        const newNote = {
          id: Date.now().toString(),
          content: currentTranscription,
          created_at: new Date().toISOString()
        };
        setNotes([newNote, ...notes]);
        setCurrentTranscription('');
        return;
      }

      // Otherwise save to Supabase
      const { data, error } = await supabase
        .from('notes')
        .insert([{ content: currentTranscription }])
        .select();

      if (error) {
        throw error;
      }

      if (data) {
        setNotes([data[0], ...notes]);
        setCurrentTranscription('');
      }
    } catch (error: any) {
      console.error('Error saving note:', error);
      alert(`Failed to save note: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!isSupabaseConfigured) {
        // Handle local deletion
        setNotes(notes.filter((note) => note.id !== id));
        return;
      }
      
      const { error } = await supabase.from('notes').delete().eq('id', id);

      if (error) {
        throw error;
      }

      setNotes(notes.filter((note) => note.id !== id));
    } catch (error: any) {
      console.error('Error deleting note:', error);
      alert(`Failed to delete note: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 dark:text-white transition-colors duration-200">
      <nav className="bg-white dark:bg-gray-900 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo />
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {configError && (
          <div className="mb-8 p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded-lg transition-colors duration-200">
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {configError}
            </p>
          </div>
        )}

        <div className="space-y-8">
          <section>
            <AudioRecorder onTranscription={handleTranscription} />
            
            {currentTranscription && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleSave}
                  className="
                    px-6 py-3 bg-green-500 text-white rounded-full
                    hover:bg-green-600 transition-colors duration-200
                    flex items-center gap-2 font-medium shadow-lg
                    hover:shadow-xl transform hover:scale-105 active:scale-95
                    dark:bg-green-600 dark:hover:bg-green-700
                  "
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                  </svg>
                  Save Note
                </button>
              </div>
            )}
          </section>

          <section>
            <NoteList notes={notes} onDelete={handleDelete} />
          </section>
        </div>
      </main>
    </div>
  );
}
