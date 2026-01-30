
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ScanEye, X, RefreshCw, Zap, ShieldCheck, Crosshair } from 'lucide-react';
import { analyzeProductImage } from '../services/geminiService';

interface ScannerProps {
  onScanResult: (result: any) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanResult, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCameraAccess(true);
        }
      } catch (err) {
        setHasCameraAccess(false);
      }
    };
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const capture = useCallback(async () => {
    if (!videoRef.current || isAnalyzing) return;
    setIsAnalyzing(true);
    const canvas = canvasRef.current!;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    try {
      const result = await analyzeProductImage(base64);
      onScanResult(result);
    } catch {
      alert("Neural sync failure. Retry scan.");
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, onScanResult]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      <div className="relative w-full max-w-2xl glass rounded-[2rem] overflow-hidden neon-border">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <ScanEye className="text-cyan-400 w-6 h-6 animate-pulse-fast" />
            <span className="font-orbitron text-[10px] tracking-[0.4em] text-cyan-400 uppercase">Neural Matrix v4.0</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X /></button>
        </div>

        <div className="relative aspect-video bg-black">
          <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover transition-all duration-700 ${isAnalyzing ? 'grayscale contrast-125 opacity-40' : ''}`} />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute inset-0 pointer-events-none p-8">
            <div className="w-full h-full relative">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-400/40" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-400/40" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-cyan-400/40" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-400/40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"><Crosshair size={120} strokeWidth={0.5} /></div>
              {isAnalyzing && <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_cyan] animate-scan" />}
            </div>
          </div>
        </div>

        <div className="p-8 text-center bg-slate-900/80">
          <p className="text-slate-500 font-orbitron text-[9px] tracking-[0.3em] uppercase mb-8">
            {isAnalyzing ? "Decoding Biometric Signatures..." : "Align Asset Barcode within Matrix"}
          </p>
          <button 
            onClick={capture} 
            disabled={isAnalyzing}
            className="flex items-center gap-4 mx-auto px-16 py-5 bg-cyan-600 rounded-full font-orbitron font-bold tracking-[0.3em] text-white hover:bg-cyan-500 transition-all active:scale-95 disabled:opacity-50"
          >
            {isAnalyzing ? <RefreshCw className="animate-spin" /> : <Zap />}
            {isAnalyzing ? "SYNCING" : "INITIALIZE"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
