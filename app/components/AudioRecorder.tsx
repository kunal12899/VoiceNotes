'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
}

// Polyfill for MediaDevices in non-secure contexts - use only for development
const setupMediaDevicesPolyfill = () => {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    console.warn('Setting up MediaDevices polyfill for non-secure context');
    // This is a development-only approach to bypass secure context requirement
    // This approach won't work in production and should not be used as a permanent solution
    try {
      // @ts-ignore - Override isSecureContext for development
      Object.defineProperty(window, 'isSecureContext', { value: true });
    } catch (e) {
      console.error('Failed to apply MediaDevices polyfill:', e);
    }
  }
};

const AudioRecorder = ({ onTranscription }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState('');
  const [isAPIAvailable, setIsAPIAvailable] = useState(true);
  const [error, setError] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Try to enable mediaDevices API even on non-secure contexts (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setupMediaDevicesPolyfill();
    }
  }, []);

  // Check for API availability on component mount
  useEffect(() => {
    // Small delay to ensure polyfill has been applied
    setTimeout(() => {
      const isSecure = window.isSecureContext;
      const hasMediaDevices = !!(window.navigator?.mediaDevices);
      
      if (!isSecure) {
        console.warn("MediaDevices API requires a secure context (HTTPS or localhost)");
        console.warn("Please access this app via localhost:3000 instead of IP address");
        setError("Please access this app via localhost:3000 instead of IP address");
        setIsAPIAvailable(false);
      } else if (!hasMediaDevices) {
        console.warn("MediaDevices API not available in this browser");
        setError("MediaDevices API not available in this browser");
        setIsAPIAvailable(false);
      } else {
        // Reset any previous API availability errors if everything is fine now
        setIsAPIAvailable(true);
        setError('');
      }
    }, 200);
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const checkBrowserSupport = () => {
    if (typeof window === 'undefined') {
      return 'This feature is only available in the browser.';
    }

    if (!window.isSecureContext) {
      return 'Media recording requires a secure context (HTTPS or localhost).';
    }

    if (!window.navigator?.mediaDevices) {
      return 'Media devices API is not available in your browser.';
    }

    if (!('getUserMedia' in window.navigator.mediaDevices)) {
      return 'Audio recording is not supported in your browser.';
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return 'Speech recognition is not supported in your browser. Try Chrome, Edge or Safari.';
    }

    return null;
  };

  const initializeSpeechRecognition = () => {
    // Support both standard and webkit prefixed versions
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (typeof window === 'undefined' || !SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setTranscription(transcript);
      onTranscription(transcript);
    };

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
      stopRecording();
    };

    recognitionRef.current = recognition;
  };

  const startRecording = async () => {
    try {
      setError('');
      
      // Check browser support before starting
      const supportError = checkBrowserSupport();
      if (supportError) {
        setError(supportError);
        setIsAPIAvailable(false);
        return;
      }

      // Initialize speech recognition if not already initialized
      if (!recognitionRef.current) {
        initializeSpeechRecognition();
      }

      console.log('Requesting media permissions...');
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Media permissions granted');

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Error recording audio.');
        stopRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
      if (recognitionRef.current) {
        recognitionRef.current.start();
      } else {
        setError('Speech recognition could not be initialized');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(error instanceof Error ? error.message : 'Error accessing microphone');
      setIsAPIAvailable(false); // Fall back to text input
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setError('Error stopping recording');
    }
  };

  const handleEdit = () => {
    setEditableText(transcription);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setTranscription(editableText);
    onTranscription(editableText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditableText(transcription);
    setIsEditing(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg shadow-sm">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`
            relative overflow-hidden px-6 py-3 rounded-full font-medium text-white
            transition-all duration-300 transform hover:scale-105 active:scale-95
            ${isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
            }
            flex items-center gap-2 shadow-lg
          `}
          disabled={isEditing}
        >
          <svg
            className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {isRecording ? (
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
            ) : (
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
            )}
          </svg>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            {isRecording ? 'Recording...' : 'Transcription'}
          </h3>
          {transcription && !isEditing && !isRecording && (
            <button
              onClick={handleEdit}
              className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              ref={textareaRef}
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px]"
              placeholder="Edit your transcription..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className={`min-h-[150px] p-3 rounded-lg bg-gray-50 ${isRecording ? 'animate-pulse' : ''}`}>
            <p className="text-gray-700 whitespace-pre-wrap">
              {transcription || 'Your transcription will appear here...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder; 