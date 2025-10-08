import { useState, useRef, useCallback, useEffect } from 'react';

// HACK: Add SpeechRecognition types to global scope if they don't exist
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface RecorderOptions {
  recordScreen: boolean;
  recordMic: boolean;
}

interface UseMeetingRecorderProps {
  onStop: (blob: Blob, transcript: string, duration: number) => void;
  onError: (error: string) => void;
}

export const useMeetingRecorder = ({ onStop, onError }: UseMeetingRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any | null>(null); // SpeechRecognition instance
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    // Stop all tracks
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    
    // Stop recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Stop speech recognition
    if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setDuration(0);
    setMicStream(null); // Clean up mic stream state
    recordedChunksRef.current = [];
    transcriptRef.current = '';
  }, []);

  const startRecording = async ({ recordScreen, recordMic }: RecorderOptions) => {
    if (isRecording) return;
    if (!recordScreen && !recordMic) {
        onError("Please select at least one source to record.");
        return;
    }

    try {
      const mediaStream = new MediaStream();
      
      // Get screen stream if requested
      if (recordScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true // Capture system audio
        });
        screenStream.getTracks().forEach(track => mediaStream.addTrack(track));
      }

      // Get mic stream if requested
      if (recordMic) {
        const userMicStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        setMicStream(userMicStream); // Set stream for visualizer
        userMicStream.getTracks().forEach(track => mediaStream.addTrack(track));

        // Setup Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    transcriptRef.current += finalTranscript + ' ';
                }
            };
            recognition.start();
            speechRecognitionRef.current = recognition;
        } else {
            console.warn("Speech Recognition API not supported in this browser.");
        }
      }

      streamRef.current = mediaStream;
      mediaRecorderRef.current = new MediaRecorder(mediaStream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        onStop(blob, transcriptRef.current, duration);
        cleanup();
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Failed to start recording:", err);
      onError(err.message || 'Could not start recording.');
      cleanup();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop(); // onstop will handle cleanup
    } else {
      cleanup();
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { isRecording, duration, micStream, startRecording, stopRecording };
};