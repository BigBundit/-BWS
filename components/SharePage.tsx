import React, { useState, useRef, useEffect, useCallback } from 'react';
import Background from './Background';
import { ComputerDesktopIcon } from './icons';

const SharePage: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const stopSharing = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsSharing(false);
    }, []);

    const startSharing = async () => {
        setError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            setError("Screen sharing is not supported on this browser.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false, // Audio from mobile might not be desired for this use case
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            stream.getVideoTracks()[0].addEventListener('ended', () => {
                stopSharing();
            });

            setIsSharing(true);
        } catch (err: any) {
            console.error("Error starting share:", err);
             if (err.name === 'NotAllowedError') {
                setError("Permission to share screen was denied.");
            } else {
                setError("Could not start screen sharing. Please try again.");
            }
            setIsSharing(false);
        }
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopSharing();
        };
    }, [stopSharing]);

    return (
        <>
            <Background />
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 text-white font-mono p-4">
                {!isSharing && (
                    <div className="text-center p-8 bg-gray-900/80 border border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/20 max-w-md animate-fade-in-fast">
                         <ComputerDesktopIcon className="w-16 h-16 text-fuchsia-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-cyan-300 mb-4">Screen Mirroring</h1>
                        {error ? (
                             <p className="text-red-400 mb-6">{error}</p>
                        ) : (
                            <p className="text-gray-400 mb-6">Tap the button to start mirroring this device's screen.</p>
                        )}
                        <button 
                            onClick={startSharing} 
                            className="w-full px-6 py-3 bg-cyan-900/50 hover:bg-cyan-500/70 border border-cyan-500 rounded-md transition-all text-cyan-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.9)] text-lg font-bold"
                        >
                            {error ? 'Try Again' : 'Start Mirroring'}
                        </button>
                    </div>
                )}
                 <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-contain ${isSharing ? 'block' : 'hidden'}`}
                />
            </div>
        </>
    );
};

export default SharePage;