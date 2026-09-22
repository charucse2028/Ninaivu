import { useState, useEffect, useRef, useCallback } from 'react';
import { Language, VoiceSearchState } from '../types';

interface IWindow extends Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SpeechRecognition?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webkitSpeechRecognition?: any;
}

export function useVoiceSearch(
  language: Language,
  onResult: (transcript: string) => void
) {
  const [state, setState] = useState<VoiceSearchState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    error: null,
  });

  const [processing, setProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      setState(prev => ({ ...prev, isSupported: true }));
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization failed:', err);
      }
    } else {
      setState(prev => ({ ...prev, isSupported: false }));
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setState(prev => ({
        ...prev,
        error: 'Speech recognition is not supported in this browser.',
      }));
      return;
    }

    try {
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onstart = () => {
        setState(prev => ({
          ...prev,
          isListening: true,
          error: null,
          transcript: '',
        }));
        setProcessing(false);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        setState(prev => ({ ...prev, transcript: currentTranscript }));

        if (event.results[0] && event.results[0].isFinal) {
          setProcessing(true);
          onResult(currentTranscript);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        let errMessage = 'Voice recognition error';
        if (event.error === 'not-allowed') {
          errMessage = 'Microphone permission denied. Please allow microphone access.';
        } else if (event.error === 'no-speech') {
          errMessage = 'No speech detected. Please try again.';
        } else if (event.error === 'network') {
          errMessage = 'Network error during voice recognition.';
        }

        setState(prev => ({
          ...prev,
          isListening: false,
          error: errMessage,
        }));
        setProcessing(false);
      };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
        setProcessing(false);
      };

      recognition.start();
    } catch (err: unknown) {
      console.warn('Recognition start failed:', err);
      setState(prev => ({
        ...prev,
        isListening: false,
        error: 'Microphone is currently busy or unavailable.',
      }));
    }
  }, [language, onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  return {
    isListening: state.isListening,
    isSupported: state.isSupported,
    transcript: state.transcript,
    error: state.error,
    processing,
    startListening,
    stopListening,
    clearError: () => setState(prev => ({ ...prev, error: null })),
  };
}
