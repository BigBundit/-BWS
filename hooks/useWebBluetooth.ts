
// HACK: Add minimal TypeScript definitions for the Web Bluetooth API to fix compilation errors.
// A proper solution would be to install @types/web-bluetooth and configure it in tsconfig.json.
declare global {
    // Type aliases for UUIDs
    type BluetoothServiceUUID = number | string;
    type BluetoothCharacteristicUUID = number | string;

    // Filter for device scanning
    interface BluetoothLEScanFilter {
        services?: BluetoothServiceUUID[];
    }

    // Options for requesting a device
    interface BluetoothRequestDeviceOptions {
        filters: BluetoothLEScanFilter[];
        optionalServices?: BluetoothServiceUUID[];
    }

    // Web Bluetooth API on Navigator
    interface Navigator {
        readonly bluetooth: Bluetooth;
    }

    interface Bluetooth extends EventTarget {
        requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
    }

    interface BluetoothDevice extends EventTarget {
        readonly name?: string;
        readonly gatt?: BluetoothRemoteGATTServer;
        addEventListener(type: 'gattserverdisconnected', listener: (this: this, ev: Event) => any, useCapture?: boolean): void;
        removeEventListener(type: 'gattserverdisconnected', listener: (this: this, ev: Event) => any, useCapture?: boolean): void;
    }

    interface BluetoothRemoteGATTServer {
        readonly connected: boolean;
        connect(): Promise<BluetoothRemoteGATTServer>;
        disconnect(): void;
        getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    }

    interface BluetoothRemoteGATTService {
        getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
    }

    interface BluetoothRemoteGATTCharacteristic extends EventTarget {
        readonly value?: DataView;
        startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
        addEventListener(type: 'characteristicvaluechanged', listener: (this: this, ev: Event) => any, useCapture?: boolean): void;
        removeEventListener(type: 'characteristicvaluechanged', listener: (this: this, ev: Event) => any, useCapture?: boolean): void;
    }
}

import { useState, useCallback, useRef, useEffect } from 'react';

// This hook uses the Nordic UART Service, a common service for BLE serial communication.
const UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_TX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// Protocol definition for file transfer
// 1. Device sends a JSON string with metadata: `{"type":"start", "payload":{"name":"file.txt", "size":123, "mime":"text/plain"}}`
// 2. Device sends raw binary chunks of the file data.
// 3. Device sends a JSON string to signal completion: `{"type":"end"}`

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type FileTransferStatus = 'idle' | 'receiving';

interface FileMetadata {
  name: string;
  size: number;
  mime: string;
}

interface UseWebBluetoothOptions {
  onFileStart: (metadata: FileMetadata) => void;
  onFileProgress: (progress: { receivedSize: number, totalSize: number }) => void;
  onFileComplete: (file: { name: string, type: string, blob: Blob }) => void;
  onError: (errorMessage: string) => void;
}

export const useWebBluetooth = ({ onFileStart, onFileProgress, onFileComplete, onError }: UseWebBluetoothOptions) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);

  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const fileTransferState = useRef({
      status: 'idle' as FileTransferStatus,
      metadata: null as FileMetadata | null,
      chunks: [] as Uint8Array[],
      receivedSize: 0,
  }).current;

  const resetFileState = () => {
      fileTransferState.status = 'idle';
      fileTransferState.metadata = null;
      fileTransferState.chunks = [];
      fileTransferState.receivedSize = 0;
  };

  const handleCharacteristicValueChanged = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    let isCommand = false;
    // First, try to parse as a command (JSON)
    try {
        const text = new TextDecoder().decode(value);
        // Only attempt to parse if it looks like a JSON object
        if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
            const command = JSON.parse(text);
            
            if (command.type === 'start' && command.payload) {
                isCommand = true;
                resetFileState();
                fileTransferState.status = 'receiving';
                fileTransferState.metadata = command.payload;
                onFileStart(command.payload);
            } else if (command.type === 'end') {
                isCommand = true;
                if (fileTransferState.status === 'receiving' && fileTransferState.metadata) {
                    const blob = new Blob(fileTransferState.chunks, { type: fileTransferState.metadata.mime });
                    onFileComplete({ name: fileTransferState.metadata.name, type: fileTransferState.metadata.mime, blob });
                }
                resetFileState();
            }
        }
    } catch (e) {
        // Not a valid JSON command, will be treated as a chunk below
    }

    // If it was not a command and we are in 'receiving' state, treat it as a file chunk.
    if (!isCommand && fileTransferState.status === 'receiving' && fileTransferState.metadata) {
        const chunk = new Uint8Array(value.buffer);
        fileTransferState.chunks.push(chunk);
        fileTransferState.receivedSize += chunk.byteLength;
        onFileProgress({
            receivedSize: fileTransferState.receivedSize,
            totalSize: fileTransferState.metadata.size,
        });
    }
  };
  
  const handleDisconnected = useCallback(() => {
    setStatus('disconnected');
    setDevice(null);
    setDeviceName(null);
    resetFileState();
    if(characteristicRef.current) {
        characteristicRef.current.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
        characteristicRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      onError('Web Bluetooth API is not available in this browser.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    resetFileState();
    
    let bleDevice: BluetoothDevice | null = null;
    try {
      bleDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [UART_SERVICE_UUID] }],
      });
      
      bleDevice.addEventListener('gattserverdisconnected', handleDisconnected);
      
      const server = await bleDevice.gatt?.connect();
      if (!server) throw new Error('Could not connect to GATT server.');
      
      const service = await server.getPrimaryService(UART_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(UART_TX_CHARACTERISTIC_UUID);
      characteristicRef.current = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
      
      setDevice(bleDevice);
      setDeviceName(bleDevice.name || 'Unknown Device');
      setStatus('connected');
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setStatus('disconnected');
      } else {
        console.error('Bluetooth connection failed:', err);
        onError(err.message || 'Failed to connect.');
        setStatus('error');
      }

      if (bleDevice) {
        bleDevice.removeEventListener('gattserverdisconnected', handleDisconnected);
        if (bleDevice.gatt?.connected) bleDevice.gatt.disconnect();
      }
      setDevice(null);
      setDeviceName(null);
      if (characteristicRef.current) {
        characteristicRef.current.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
        characteristicRef.current = null;
      }
    }
  }, [onError, handleDisconnected]);

  const disconnect = useCallback(() => {
    device?.gatt?.disconnect();
  }, [device]);
  
  useEffect(() => {
      return () => {
          device?.gatt?.disconnect();
      };
  }, [device]);

  return { connect, disconnect, status, deviceName };
};
