import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ComputerDesktopIcon } from './icons';

const ScreenMirrorPanel: React.FC = () => {
    const shareUrl = `${window.location.origin}/share`;

    // The App.tsx now handles routing, but we need to ensure it exists for QR code.
    const SharePageComponent = React.lazy(() => import('./SharePage'));
    if (window.location.pathname === '/share') {
        return (
            <React.Suspense fallback={<div>Loading...</div>}>
                <SharePageComponent />
            </React.Suspense>
        );
    }


    return (
        <div className="h-full w-full flex flex-col items-center justify-center gap-6 p-4 text-center animate-fade-in-fast">
            <div className="p-4 bg-white rounded-lg border-4 border-cyan-400 shadow-lg shadow-cyan-500/30">
                <QRCodeSVG
                    value={shareUrl}
                    size={192}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="Q"
                    includeMargin={false}
                />
            </div>
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-cyan-300">Mirror Your Mobile Screen</h3>
                <p className="text-gray-400 max-w-xs">
                    1. Scan this QR code with your mobile device.
                </p>
                <p className="text-gray-400 max-w-xs">
                    2. Follow the prompt to share its screen. The stream will appear on your device.
                </p>
            </div>
        </div>
    );
};

export default ScreenMirrorPanel;