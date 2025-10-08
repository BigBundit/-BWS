
import React, { useState, useCallback } from 'react';
import { useWebBluetooth } from '../hooks/useWebBluetooth';
import { ReceivedFile } from '../types';
import { BluetoothIcon, PhotoIcon, FileIcon, DocumentTextIcon, DocumentArrowDownIcon } from './icons';

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const FileTypeIcon: React.FC<{ mimeType: string }> = ({ mimeType }) => {
    if (mimeType.startsWith('image/')) {
        return <PhotoIcon className="w-8 h-8 text-cyan-400" />;
    }
    if (mimeType.startsWith('text/')) {
        return <DocumentTextIcon className="w-8 h-8 text-fuchsia-400" />;
    }
    return <FileIcon className="w-8 h-8 text-gray-400" />;
};

interface TransferProgress {
    name: string;
    receivedSize: number;
    totalSize: number;
}

const BluetoothPanel: React.FC = () => {
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [transfer, setTransfer] = useState<TransferProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileComplete = useCallback(({ name, type, blob }: { name: string, type: string, blob: Blob }) => {
    const file = {
      id: crypto.randomUUID(),
      name,
      type,
      size: blob.size,
      url: URL.createObjectURL(blob)
    };
    setReceivedFiles(prev => [file, ...prev]);
    setTransfer(null);
  }, []);

  const { connect, disconnect, status, deviceName } = useWebBluetooth({
    onFileStart: (metadata) => {
        setTransfer({ name: metadata.name, receivedSize: 0, totalSize: metadata.size });
        setError(null);
    },
    onFileProgress: ({ receivedSize, totalSize }) => {
        // Use functional update to get the latest state and avoid stale closures.
        // The check on `prev` inside is for robustness, in case progress events
        // arrive out of order, though the `onFileStart` should always come first.
        setTransfer(prev => prev ? { ...prev, receivedSize, totalSize } : null);
    },
    onFileComplete: handleFileComplete,
    onError: (errMessage) => {
        setError(errMessage);
        setTransfer(null);
    }
  });

  const getButtonContent = () => {
    switch (status) {
        case 'connecting': return <><Spinner />Connecting...</>;
        case 'connected': return <><BluetoothIcon className="w-5 h-5 mr-2 text-green-400" />Disconnect</>;
        case 'error': return <>Retry Connect</>;
        default: return <><BluetoothIcon className="w-5 h-5 mr-2" />Connect</>;
    }
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <button
              onClick={status === 'connected' ? disconnect : connect}
              disabled={status === 'connecting'}
              className="w-full flex items-center justify-center px-4 py-2 bg-fuchsia-900/50 hover:bg-fuchsia-500/70 border border-fuchsia-500 rounded-md transition-all text-fuchsia-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {getButtonContent()}
          </button>
          {status === 'connected' && deviceName && (
              <p className="text-green-400 text-xs text-center animate-fade-in-fast">
                  {`Connected to: ${deviceName}`}
              </p>
          )}
          {error && <p className="text-red-400 text-xs text-center">{`Error: ${error}`}</p>}
      </div>
      
      <div className="flex-grow overflow-y-auto pr-2 space-y-3 border-t border-fuchsia-500/20 pt-4 mt-2">
          {transfer && (
              <div className="p-3 bg-gray-800/60 rounded-lg animate-fade-in-fast">
                  <p className="text-sm text-white truncate mb-1">{transfer.name}</p>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${(transfer.receivedSize / transfer.totalSize) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-right text-gray-400 mt-1">{`${formatBytes(transfer.receivedSize)} / ${formatBytes(transfer.totalSize)}`}</p>
              </div>
          )}
          {receivedFiles.length > 0 ? (
              receivedFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-3 p-2 rounded-md bg-gray-800/50">
                      <div className="flex-shrink-0">
                          <FileTypeIcon mimeType={file.type} />
                      </div>
                      <div className="flex-grow overflow-hidden">
                          <p className="text-sm text-gray-200 truncate font-semibold">{file.name}</p>
                          <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                      </div>
                      <a
                          href={file.url}
                          download={file.name}
                          className="flex-shrink-0 p-2 text-cyan-300 hover:text-white hover:bg-cyan-500/30 rounded-full transition-colors"
                          title="Download file"
                      >
                          <DocumentArrowDownIcon className="w-6 h-6" />
                      </a>
                  </div>
              ))
          ) : (
            transfer === null && (
                 <div className="text-center text-gray-500 italic p-4 h-full flex items-center justify-center">
                    {status === 'connected' ? "Ready to receive files..." : "Connect to a device to begin."}
                </div>
            )
          )}
      </div>
    </div>
  );
};

export default BluetoothPanel;