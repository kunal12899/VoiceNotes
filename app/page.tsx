'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import AudioRecorder from './components/AudioRecorder';
import NoteList from './components/NoteList';
import Auth from './components/Auth';
import TodoList from './components/TodoList';
import Link from 'next/link';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Todo {
  id: string;
  title: string;
  is_completed: boolean;
  due_date: string | null;
  priority: string;
}

export default function Dashboard() {
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [upcomingTodos, setUpcomingTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [notesResponse, todosResponse] = await Promise.all([
          supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('todos')
            .select('*')
            .eq('is_completed', false)
            .order('due_date', { ascending: true })
            .limit(5),
        ]);

        if (notesResponse.error) throw notesResponse.error;
        if (todosResponse.error) throw todosResponse.error;

        setRecentNotes(notesResponse.data || []);
        setUpcomingTodos(todosResponse.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Notes
            </h2>
            <Link
              href="/notes"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View All
            </Link>
          </div>
          {recentNotes.length > 0 ? (
            <div className="space-y-4">
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {note.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">No recent notes</p>
          )}
        </div>

        {/* Upcoming Todos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Upcoming Todos
            </h2>
            <Link
              href="/todos"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View All
            </Link>
          </div>
          {upcomingTodos.length > 0 ? (
            <div className="space-y-4">
              {upcomingTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {todo.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                        todo.priority
                      )}`}
                    >
                      {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                    </span>
                  </div>
                  {todo.due_date && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Due: {new Date(todo.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">No upcoming todos</p>
          )}
        </div>
      </div>
    </div>
  );
}
