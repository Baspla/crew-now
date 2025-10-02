'use client';

import { createPost } from "./actions";
import { useState, useRef, useEffect } from "react";
import { motion, useAnimationControls } from "motion/react";
import PostImage from "../../../components/post/PostImage";
import PageHead from "@/components/layout/PageHead";
import Countdown from "@/components/Countdown";

export default function CreatePage() {
  // State für die verschiedenen Flow-Phasen
  const [currentStep, setCurrentStep] = useState<'preview' | 'captured' | 'error'>('preview');

  // Kamera-States
  const [currentCamera, setCurrentCamera] = useState<'environment' | 'user'>('environment');
  const [backCameraImage, setBackCameraImage] = useState<string | null>(null);
  const [frontCameraImage, setFrontCameraImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [postsRemaining, setPostsRemaining] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [lastVideoHeight, setLastVideoHeight] = useState<number>(360); // Mindesthöhe für Container, aktualisiert nach Kamera-Start

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const flipControls = useAnimationControls();
  const [isFlipping, setIsFlipping] = useState(false);

  // Check if camera is supported
  const checkCameraSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsCameraSupported(false);
      setError('Kamera wird von diesem Browser nicht unterstützt');
      setCurrentStep('error');
      return false;
    }
    return true;
  };

  // Stop current video stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Start camera with specified facing mode
  const startCamera = async (facingMode: 'user' | 'environment') => {
    if (!checkCameraSupport()) return;

    try {
      setError(null);
      stopStream(); // Stop any existing stream

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        // Nach dem Start Höhe merken (nur wenn > 0, sonst alten Wert behalten)
        const tryUpdateHeight = () => {
          const vh = videoRef.current?.videoHeight || 0;
            if (vh > 0) {
              // Maximal 60vh (wie Styling) – Berechnung nur im Client
              const maxDisplay = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.6) : vh;
              setLastVideoHeight(Math.min(vh, maxDisplay));
            }
        };
        // Direkt versuchen und zusätzlich bei loadedmetadata erneut
        tryUpdateHeight();
        videoRef.current.addEventListener('loadedmetadata', tryUpdateHeight, { once: true });
      }
    } catch (err) {
      console.error('Fehler beim Zugriff auf die Kamera:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Kamera-Zugriff wurde verweigert. Bitte erlauben Sie den Kamera-Zugriff.');
        } else if (err.name === 'NotFoundError') {
          setError('Keine Kamera gefunden.');
        } else if (err.name === 'NotReadableError') {
          setError('Kamera ist bereits in Verwendung.');
        } else {
          setError(`Kamera-Fehler: ${err.message}`);
        }
      } else {
        setError('Unbekannter Kamera-Fehler aufgetreten.');
      }
      setCurrentStep('error');
    }
  };

  // Capture image from video
  const captureImageFromVideo = (): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Kamera oder Canvas nicht verfügbar');
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setError('Canvas-Kontext nicht verfügbar');
      return null;
    }

    // Canvas-Dimensionen an Videoframe anpassen
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Horizontale Spiegelung (klassisches Selfie) falls Frontkamera aktiv ist ("user").
    // Vorgehen: erst nach rechts verschieben (translate(canvas.width, 0)), dann scale(-1, 1).
    if (currentCamera === 'user') {
      context.save();
      context.translate(canvas.width, 0); // Ursprung nach rechts verschieben
      context.scale(-1, 1); // Horizontal spiegeln
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.restore();
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Convert to base64 data URL
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Scroll video preview into view
  const scrollPreviewIntoView = () => {
    if (videoRef.current) {
      videoRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  // Switch between cameras
  const switchCamera = async () => {
    if (isFlipping) return; // Verhindert mehrfachen schnellen Klick
    setIsFlipping(true);
    try {
      // Erste Hälfte der Flip-Animation (90°)
      await flipControls.start({ rotateY: 90, transition: { duration: 0.25, ease: 'easeIn' } });

      const newCamera = currentCamera === 'environment' ? 'user' : 'environment';
      setCurrentCamera(newCamera);
      await startCamera(newCamera);

      // Spiegelzustand anwenden (Skalierung) – kein Übergang nötig, direkt setzen
      await flipControls.set({ scaleX: newCamera === 'user' ? -1 : 1 });

      // Zweite Hälfte zurück zu 0°
      await flipControls.start({ rotateY: 0, transition: { duration: 0.25, ease: 'easeOut' } });

      setTimeout(() => {
        scrollPreviewIntoView();
      }, 50);
    } finally {
      setIsFlipping(false);
    }
  };

  // Capture sequence: capture current camera first, then switch and capture other
  const startCaptureSequence = async () => {
    setIsCapturing(true);
    setError(null);

    try {
      // Step 1: Capture with currently selected camera
      const firstImage = captureImageFromVideo();
      if (!firstImage) {
        setError('Fehler beim Aufnehmen des ersten Bildes');
        setIsCapturing(false);
        return;
      }

      // Remember which camera we used for the first image
      const firstCameraType = currentCamera;

      // Step 2: Switch to the other camera and capture
      const otherCamera = currentCamera === 'environment' ? 'user' : 'environment';
      await startCamera(otherCamera);

      // Wait a moment for the camera to initialize
      setTimeout(() => {
        const secondImage = captureImageFromVideo();
        if (!secondImage) {
          setError('Fehler beim Aufnehmen des zweiten Bildes');
          setIsCapturing(false);
          return;
        }

        // Sort out which image belongs to which camera
        if (firstCameraType === 'environment') {
          // First image was back camera, second is front camera
          setBackCameraImage(firstImage);
          setFrontCameraImage(secondImage);
        } else {
          // First image was front camera, second is back camera
          setFrontCameraImage(firstImage);
          setBackCameraImage(secondImage);
        }

        // Stop camera stream
        stopStream();
        setIsCapturing(false);
        setCurrentStep('captured');
      }, 1000);

    } catch (err) {
      console.error('Fehler beim Capture-Sequence:', err);
      setError('Fehler beim Aufnehmen der Bilder');
      setIsCapturing(false);
    }
  };

  // Reset and go back to preview
  const retake = () => {
    setBackCameraImage(null);
    setFrontCameraImage(null);
    setCaptionText('');
    setCurrentStep('preview');
    setCurrentCamera('environment');
    startCamera('environment');
  };

  // Initialize camera on component mount
  useEffect(() => {
    // Load posting status first
    const init = async () => {
      try {
        const res = await fetch('/api/posting-status', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setPostsRemaining(data?.postsRemaining ?? 0);
          setTimeLeft(data?.timeLeftInWindowSeconds ?? null);
          if ((data?.postsRemaining ?? 0) > 0 && currentStep === 'preview') {
            await startCamera('environment');
          }
        }
      } catch {
        // ignore
      }
    };
    init();

    // Cleanup on unmount
    return () => {
      stopStream();
    };
  }, []);

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    if (postsRemaining !== null && postsRemaining <= 0) {
      setError('Du hast keine Posts mehr übrig.');
      return;
    }
    if (backCameraImage) {
      formData.set('imageUrl', backCameraImage);
    }
    if (frontCameraImage) {
      formData.set('frontImageUrl', frontCameraImage);
    }
    formData.set('caption', captionText);

    await createPost(formData);
  };
  return (
    <div>
      <PageHead title="Neuen Post erstellen" backUrl="/feed" subtitle="Es wir Zeit für ein Bild" />

      {/* Posting status banner */}
      <div className="mb-4 flex items-center gap-3 text-sm">
        {postsRemaining !== null && (
          <div className='text-md bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 px-3 py-2 rounded-md'>
            <span className="font-semibold">Hinweis: </span>
            {postsRemaining > 0 ? `Du kannst noch ${postsRemaining} mal heute posten` : 'Limit für heute erreicht'}
          </div>
        )}
      </div>

      {/* Step 1: Camera Preview */}
      {currentStep === 'preview' && (
        <div className="space-y-4">
          <div className="relative">
            <div
              className="relative w-full flex justify-center items-center bg-black/50 rounded-lg"
              style={{
                perspective: '1200px',
                minHeight: lastVideoHeight,
                transition: 'min-height 0.25s ease'
              }}
            >
              <motion.video
                ref={videoRef}
                className="border-2 border-gray-300 rounded-lg aspect-auto max-h-[60vh] w-auto will-change-transform"
                playsInline
                muted
                autoPlay
                initial={{ rotateY: 0, scaleX: 1 }}
                animate={flipControls}
                style={{
                  maxWidth: "100%",
                  backfaceVisibility: 'hidden'
                }}
              />

              {/* Overlay Buttons */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Capture Button - Center Bottom */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
                  <div className="w-10 h-10" />
                  <button
                    type="button"
                    onClick={startCaptureSequence}
                    disabled={!isCameraSupported || isCapturing || (postsRemaining !== null && postsRemaining <= 0)}
                    className="w-14 h-14 bg-black text-white opacity-60 hover:opacity-80 disabled:bg-zinc-900 disabled:cursor-not-allowed rounded-full cursor-pointer transition-colors flex items-center justify-center "
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

            <canvas
              ref={canvasRef}
              className="hidden"
            />
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
      )}

      {/* Step 2: Captured Images Preview */}
      {currentStep === 'captured' && backCameraImage && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Vorschau</h3>

          {/* PostImage Component Display */}
          <div className="flex justify-center">
            <PostImage
              imageUrl={backCameraImage}
              frontImageUrl={frontCameraImage}
              alt="Aufgenommener Post"
              className="max-w-md"
              overlayPosition="top-right"
              overlaySize="medium"
            />
          </div>

          {/* Caption Field */}
          <div>
            <label htmlFor="caption" className="block font-semibold mb-2">
              Bildunterschrift (optional):
            </label>
            <textarea
              id="caption"
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              rows={3}
              placeholder="Beschreiben Sie Ihr Bild..."
              className="w-full p-3 rounded-lg border border-gray-300 text-sm resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <form action={handleSubmit} className="flex-1">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white border-0 rounded-lg cursor-pointer text-base transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={postsRemaining !== null && postsRemaining <= 0}
              >
                Post senden
              </button>
            </form>

            <button
              type="button"
              onClick={retake}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white border-0 rounded-lg cursor-pointer transition-colors font-semibold"
            >
              Neu aufnehmen
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {currentStep === 'error' && (
        <div className="text-center p-6">
          <div className="text-red-300 mb-2">
            <div className="text-3xl mb-2 animate-bounce">🤔</div>
            <p className="text-lg font-semibold">Die Kamera will grade nicht</p>
            {error && <p className="text-sm mt-2">{error}</p>}
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentStep('preview');
              setError(null);
              startCamera('environment');
            }}
            className="px-6 py-3 text-2xl font-bold text-white cursor-pointer transition-colors hover:text-zinc-300"
          >
            Erneut versuchen
          </button>
        </div>
      )}
    </div>
  );
}