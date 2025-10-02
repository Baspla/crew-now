"use client";

import { motion, useAnimationControls } from "motion/react";
import { RefObject } from "react";

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  flipControls: ReturnType<typeof useAnimationControls>;
  lastVideoHeight: number;
  isCameraSupported: boolean;
  isCapturing: boolean;
  postsRemaining: number | null;
  isFlipping: boolean;
  startCaptureSequence: () => void;
  switchCamera: () => void;
}

export default function CameraPreview({
  videoRef,
  canvasRef,
  flipControls,
  lastVideoHeight,
  isCameraSupported,
  isCapturing,
  postsRemaining,
  isFlipping,
  startCaptureSequence,
  switchCamera,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          className="relative w-full flex justify-center items-center bg-black/50 rounded-lg"
          style={{ perspective: '1200px', minHeight: lastVideoHeight, transition: 'min-height 0.25s ease' }}
        >
          <motion.video
            ref={videoRef}
            className="border-2 border-gray-300 rounded-lg aspect-auto max-h-[60vh] w-auto will-change-transform"
            playsInline
            muted
            autoPlay
            initial={{ rotateY: 0, scaleX: 1 }}
            animate={flipControls}
            style={{ maxWidth: '100%', backfaceVisibility: 'hidden' }}
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
              <div className="w-10 h-10" />
              <button
                type="button"
                onClick={startCaptureSequence}
                disabled={!isCameraSupported || isCapturing || (postsRemaining !== null && postsRemaining <= 0)}
                className="w-14 h-14 bg-black text-white opacity-60 hover:opacity-80 disabled:bg-zinc-900 disabled:cursor-not-allowed rounded-full cursor-pointer transition-colors flex items-center justify-center"
                title={isCapturing ? 'Aufnahme läuft...' : 'Beide Kameras aufnehmen (aktuelle zuerst)'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={switchCamera}
                disabled={!isCameraSupported || isCapturing || isFlipping}
                className="w-10 h-10 bg-black opacity-60 hover:opacity-80 disabled:bg-opacity-30 disabled:cursor-not-allowed text-white rounded-full cursor-pointer transition-all flex items-center justify-center font-bold text-lg"
                title="Kamera wechseln"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {isCapturing && (
        <div className="text-center p-4">
          <p className="font-semibold">Bitte lächeln!</p>
          <p className="text-sm text-gray-600">Aktuelle Kamera zuerst, dann wird gewechselt...</p>
        </div>
      )}
      {postsRemaining !== null && postsRemaining <= 0 && (
        <div className="text-center p-4">
          <p className="font-semibold text-red-600">Du hast dein Posting-Limit erreicht.</p>
          <p className="text-sm text-gray-600">Warte auf das nächste Moment-Fenster.</p>
        </div>
      )}
    </div>
  );
}
