import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useMeetingRecorder } from '../hooks/useMeetingRecorder';
import { MeetingRecording } from '../types';
import { VideoCameraIcon, MicrophoneIcon, DocumentArrowDownIcon, StopCircleIcon, TrashIcon } from './icons';
import MicVisualizer from './MicVisualizer';

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const MeetingRecorderPanel: React.FC = () => {
  const [recordings, setRecordings] = useState<MeetingRecording[]>([]);
  const [recordScreen, setRecordScreen] = useState(true);
  const [recordMic, setRecordMic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleStop = useCallback((blob: Blob, transcript: string, duration: number) => {
    const newRecording: MeetingRecording = {
      id: crypto.randomUUID(),
      videoUrl: URL.createObjectURL(blob),
      transcript,
      duration,
      createdAt: new Date().toISOString(),
    };
    setRecordings(prev => [newRecording, ...prev]);
  }, []);

  const { isRecording, duration, micStream, startRecording, stopRecording } = useMeetingRecorder({
    onStop: handleStop,
    onError: (err) => setError(err),
  });

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleSummarize = async (recordingId: string) => {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording || !recording.transcript) {
        alert("No transcript available to summarize.");
        return;
    }
    
    setRecordings(prev => prev.map(r => r.id === recordingId ? { ...r, isSummarizing: true } : r));
    
    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Summarize the following meeting transcript. Identify key discussion points, decisions made, and any action items. Format the output cleanly with headings for each section (Summary, Decisions, Action Items).\n\nTranscript:\n${recording.transcript}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        const summaryText = response.text;
        setRecordings(prev => prev.map(r => r.id === recordingId ? { ...r, summary: summaryText, isSummarizing: false } : r));

    } catch (err: any) {
        console.error("Error summarizing transcript:", err);
        alert(`Failed to get summary: ${err.message}`);
        setRecordings(prev => prev.map(r => r.id === recordingId ? { ...r, isSummarizing: false } : r));
    }
  };

  const deleteRecording = (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if(recording) {
        URL.revokeObjectURL(recording.videoUrl); // Clean up blob URL
    }
    setRecordings(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="h-full w-full flex flex-col gap-4 text-sm">
      <div className="flex-shrink-0 flex flex-col gap-3 p-3 bg-gray-800/40 rounded-lg border border-fuchsia-500/20">
        <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-900/50 rounded-md hover:bg-gray-700/50">
                <input type="checkbox" checked={recordScreen} onChange={(e) => setRecordScreen(e.target.checked)} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-fuchsia-500 text-fuchsia-500 focus:ring-fuchsia-400" />
                <VideoCameraIcon className="w-5 h-5 text-cyan-400" />
                <span>Screen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-900/50 rounded-md hover:bg-gray-700/50">
                <input type="checkbox" checked={recordMic} onChange={(e) => setRecordMic(e.target.checked)} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-fuchsia-500 text-fuchsia-500 focus:ring-fuchsia-400" />
                {isRecording && micStream ? <MicVisualizer stream={micStream} /> : <MicrophoneIcon className="w-5 h-5 text-fuchsia-400" />}
                <span>Mic</span>
            </label>
        </div>
        {!isRecording ? (
            <button onClick={() => startRecording({ recordScreen, recordMic })} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-900/70 hover:bg-green-700/70 border border-green-500 rounded-md transition-all text-green-300 hover:text-white">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                Start Recording
            </button>
        ) : (
            <button onClick={stopRecording} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900/70 hover:bg-red-700/70 border border-red-500 rounded-md transition-all text-red-300 hover:text-white">
                <StopCircleIcon className="w-5 h-5" />
                <span>Stop Recording ({formatDuration(duration)})</span>
            </button>
        )}
      </div>

      {error && <p className="text-red-400 text-xs text-center">{`Error: ${error}`}</p>}

      <div className="flex-grow overflow-y-auto pr-2 space-y-3 border-t border-fuchsia-500/20 pt-4 mt-2">
        {recordings.length > 0 ? (
          recordings.map(rec => (
            <div key={rec.id} className="p-3 bg-gray-800/60 rounded-lg animate-fade-in-fast flex flex-col gap-3">
              <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-white">Recording - {new Date(rec.createdAt).toLocaleTimeString()}</p>
                    <p className="text-xs text-gray-400">Duration: {formatDuration(rec.duration)}</p>
                  </div>
                  <button onClick={() => deleteRecording(rec.id)} className="p-1 text-red-400 hover:text-red-200 hover:bg-red-500/30 rounded-full transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
              </div>

              <div className="flex gap-2">
                <a href={rec.videoUrl} download={`recording-${rec.id}.webm`} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-900/50 hover:bg-cyan-500/70 border border-cyan-500 rounded-md transition-all text-cyan-300 hover:text-white">
                    <DocumentArrowDownIcon className="w-5 h-5" /> Download
                </a>
                <button 
                  onClick={() => handleSummarize(rec.id)}
                  disabled={!rec.transcript || rec.isSummarizing}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-fuchsia-900/50 hover:bg-fuchsia-500/70 border border-fuchsia-500 rounded-md transition-all text-fuchsia-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                  {rec.isSummarizing ? <Spinner /> : '✨'} Summarize
                </button>
              </div>

              {rec.summary && (
                <div className="mt-2 p-3 bg-gray-900/70 rounded-md border border-gray-700">
                    <h4 className="font-bold text-cyan-400 mb-2">AI Summary:</h4>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{rec.summary}</pre>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 italic p-4 h-full flex items-center justify-center">
            Your recordings will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRecorderPanel;