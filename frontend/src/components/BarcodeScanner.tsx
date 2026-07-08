import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const isCapacitor = typeof window !== "undefined" && "Capacitor" in window;

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const readerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    // Capacitor: native scanner — no video element needed
    if (isCapacitor) return;
    const video = videoRef.current;
    if (!video) return;

    import('@zxing/library').then(({ BrowserMultiFormatReader }) => {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      reader.decodeFromVideoDevice(null, video, (result) => {
        if (result) {
          reader.reset();
          onScanRef.current(result.getText());
          onCloseRef.current();
        }
      });

      const capture = setInterval(() => {
        if (video.srcObject) {
          streamRef.current = video.srcObject as MediaStream;
          clearInterval(capture);
        }
      }, 50);
      setTimeout(() => clearInterval(capture), 3000);
    });

    return () => {
      readerRef.current?.reset();
      readerRef.current = null;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCapacitorScan = async () => {
    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerAndroidScanningLibrary, CapacitorBarcodeScannerTypeHint }
        = await import('@capacitor/barcode-scanner');

      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
        scanInstructions: 'Arahkan barcode ke dalam frame',
        scanButton: true,
        scanText: 'Scan Barcode',
        android: { scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT },
      });

      if (result.ScanResult) {
        onScanRef.current(result.ScanResult);
        onCloseRef.current();
      } else {
        setError('Tidak ada hasil barcode.');
      }
    } catch (err) {
      console.error('Barcode scan error:', err);
      setError('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  const handleClose = () => {
    if (isCapacitor) { onClose(); return; }
    readerRef.current?.reset();
    readerRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.style.display = 'none';
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    onClose();
  };

  // Desktop: show camera immediately
  if (!isCapacitor) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="bg-card w-full max-w-md rounded-2xl p-6 relative">
          <button onClick={handleClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted">
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

  // Android: show button to open native scanner
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-card w-full max-w-md rounded-2xl p-6 relative">
        <button onClick={handleClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold mb-4">Scan Barcode</h2>
        <div className="rounded-xl bg-muted/20 h-[200px] flex items-center justify-center mb-4">
          <p className="text-muted-foreground text-sm">Tekan tombol untuk membuka kamera</p>
        </div>
        {error && <p className="text-destructive text-sm mb-4">{error}</p>}
        <button
          onClick={startCapacitorScan}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium"
        >
          Mulai Scan
        </button>
      </div>
    </div>
  );
}
