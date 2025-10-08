import React, { useRef, useEffect } from 'react';
import { MicrophoneIcon } from './icons';

interface MicVisualizerProps {
  stream: MediaStream;
}

const MicVisualizer: React.FC<MicVisualizerProps> = ({ stream }) => {
  const iconRef = useRef<SVGSVGElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !iconRef.current) return;

    // Prevent creating multiple contexts
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    
    // Create analyser if it doesn't exist
    if (!analyserRef.current) {
        analyserRef.current = audioContext.createAnalyser();
    }
    const analyser = analyserRef.current;
    analyser.fftSize = 32;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
      // Scale value between 1 and 1.5 for a subtle but noticeable effect.
      // Adjust the divisor to control sensitivity.
      const scale = 1 + (average / 256) * 0.5;
      
      if (iconRef.current) {
        iconRef.current.style.transform = `scale(${scale})`;
      }
    };

    draw();

    return () => {
      // Cleanup on component unmount or stream change
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      source.disconnect();
    };
  }, [stream]);

  return (
    <MicrophoneIcon ref={iconRef} className="w-5 h-5 text-fuchsia-400 transition-transform duration-75" />
  );
};

export default MicVisualizer;
