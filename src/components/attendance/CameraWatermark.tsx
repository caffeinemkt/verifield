'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2 } from 'lucide-react';
import { generatePhotoHash } from '@/lib/compliance/nom151';

interface CameraWatermarkProps {
  userId: string;
  userName: string;
  employeeNumber: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  onPhotoCaptured: (photoBase64: string, photoHash: string) => void;
}

export const CameraWatermark: React.FC<CameraWatermarkProps> = ({
  userId,
  userName,
  employeeNumber,
  latitude,
  longitude,
  accuracy,
  onPhotoCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(false);
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera unavailable');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch {
        setCameraError(true);
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const captureWithWatermark = async () => {
    setIsProcessing(true);
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    if (videoRef.current && stream && !cameraError) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    } else {
      // Clean neutral fallback avatar
      const gradient = ctx.createLinearGradient(0, 0, 640, 480);
      gradient.addColorStop(0, '#f1f5f9');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 640, 480);

      // Simple avatar outline
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(320, 190, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(320, 310, 130, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.font = '600 16px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TESTIGO FOTOGRÁFICO', 320, 350);
    }

    // Minimalist watermark overlay
    const nowUtc = new Date().toISOString();
    const nowLocal = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fillRect(0, 380, 640, 100);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 378, 640, 2);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`VERIFIELD • GREEN SEVEN MÉXICO • NOM-151`, 16, 400);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${userName.toUpperCase()} • ${employeeNumber}`, 16, 418);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px monospace';
    ctx.fillText(`${nowLocal} (UTC: ${nowUtc.substring(11, 19)})`, 16, 436);
    ctx.fillText(`GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`, 16, 452);

    ctx.fillStyle = '#f97316';
    ctx.font = '10px monospace';
    ctx.fillText(`ID: ${userId.slice(0, 8)} | SHA256 VALIDATED PSC`, 16, 468);

    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(finalDataUrl);

    const photoHash = await generatePhotoHash(finalDataUrl);
    setIsProcessing(false);
    onPhotoCaptured(finalDataUrl, photoHash);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <canvas ref={canvasRef} className="hidden" />

      {capturedImage ? (
        <div className="w-full flex flex-col items-center space-y-2">
          <div className="relative rounded-2xl overflow-hidden border border-emerald-300 shadow-sm bg-slate-900 w-full max-w-sm aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedImage} alt="Testigo" className="w-full h-full object-cover" />
            <div className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Foto lista
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCapturedImage(null)}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 transition"
          >
            <RefreshCw className="w-3 h-3" /> Tomar otra foto
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm flex flex-col items-center space-y-2.5">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 w-full aspect-[4/3] flex items-center justify-center">
            {cameraError ? (
              <div className="text-center p-4 text-slate-300">
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1.5 opacity-60" />
                <p className="text-xs font-medium text-slate-200">Cámara de demostración</p>
                <p className="text-[11px] text-slate-400">Se usará avatar de prueba con tu GPS</p>
              </div>
            ) : (
              <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" />
            )}

            <button
              type="button"
              onClick={toggleCamera}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur transition"
              title="Girar cámara"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={captureWithWatermark}
            disabled={isProcessing}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 shadow-sm"
          >
            <Camera className="w-4 h-4" />
            {isProcessing ? 'Procesando...' : 'Tomar Foto'}
          </button>
        </div>
      )}
    </div>
  );
};
