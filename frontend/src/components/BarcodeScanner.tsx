import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    const video = videoRef.current;
    if (!video) return;

    // decodeFromVideoDevice already scans continuously — call once
    reader.decodeFromVideoDevice(null, video, (result) => {
      if (result) {
        // Stop decode loop immediately to prevent console spam
        reader.reset();
        onScanRef.current(result.getText());
        onCloseRef.current();
      }
      // NotFoundException per frame — normal, abaikan
    }).catch(err => {
      if (err?.name !== 'NotFoundException') {
        setError('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
      }
    });

    return () => {
      reader.reset();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-card w-full max-w-md rounded-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold mb-4">Scan Barcode</h2>
        <div className="overflow-hidden rounded-xl">
          <video ref={videoRef} style={{ width: '100%', height: 300, objectFit: 'cover' }} />
        </div>
        {error && <p className="text-destructive text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}
