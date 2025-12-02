"use client";

import { useAnimationControls } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

export type CaptureStep = "inactive" | "preview" | "captured" | "error";
export type CameraType = "environment" | "user";
export type MirrorContext = "preview" | "capture";

interface PostingStatusResponse {
  postsRemaining?: number;
  timeLeftInWindowSeconds?: number | null;
}

export function useCaptureFlow() {
  // Flow / UI
  const [currentStep, setCurrentStep] = useState<CaptureStep>("inactive");
  const [error, setError] = useState<string | null>(null);

  // Kamera / Media
  const [currentCamera, setCurrentCamera] = useState<CameraType>("environment");
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastVideoHeight, setLastVideoHeight] = useState<number>(360);

  // Bilder
  const [backCameraImage, setBackCameraImage] = useState<string | null>(null);
  const [frontCameraImage, setFrontCameraImage] = useState<string | null>(null);

  // Meta
  const [captionText, setCaptionText] = useState("");
  const [postsRemaining, setPostsRemaining] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Refs & Animation
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const flipControls = useAnimationControls();

  // --- Spiegelungs-Regel ----------------------------------------------------
  // Entscheidet an einer bestimmten Code-Stelle (Kontext), ob für Kamera X gespiegelt werden soll.
  // Derzeit gilt: Nur die User-/Front-Kamera wird gespiegelt – im Preview und beim Capture.
  const shouldMirrorAt = useCallback((cameraType: CameraType, _where: MirrorContext) => {
    return cameraType === "user";
  }, []);

  // --- Kamera Utility ------------------------------------------------------
  const checkCameraSupport = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsCameraSupported(false);
      setError("Kamera wird von diesem Browser nicht unterstützt");
      setCurrentStep("error");
      return false;
    }
    return true;
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(
    async (facingMode: CameraType) => {
      if (!checkCameraSupport()) return;
      try {
        setError(null);
        stopStream();
        // Halte den aktuellen Kamera-Typ synchron zum tatsächlich gestarteten Stream
        setCurrentCamera(facingMode);
        
        let constraints: MediaStreamConstraints = {
          video: {
            facingMode,
            aspectRatio: 3 / 4,
            width: { min: 1000 },
            height: { min: 1500 },
          },
          audio: false,
        };

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === "videoinput" && d.label);

          if (videoDevices.length > 0) {
            const excludedKeywords = ["Ultra", "Dual"];
            const isUser = facingMode === "user";
            const targetKeywords = isUser
              ? ["front", "user", "selfie", "vorder"]
              : ["back", "environment", "rear", "rück"];

            const candidates = videoDevices.filter((device) => {
              const label = device.label.toLowerCase();
              const matchesFacing = targetKeywords.some((k) => label.includes(k.toLowerCase()));
              if (!matchesFacing) return false;
              const hasExcluded = excludedKeywords.some((k) => label.includes(k.toLowerCase()));
              return !hasExcluded;
            });

            if (candidates.length > 0) {
              console.log("Possible camera candidates:", candidates);
              constraints = {
                video: {
                  deviceId: { exact: candidates[0].deviceId },
                  aspectRatio: 3 / 4,
                  width: { min: 1000 },
                  height: { min: 1500 },
                },
                audio: false,
              };
            }
          }
        } catch (err) {
          console.warn("Smart camera selection failed", err);
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          // Spiegele die Vorschau unmittelbar passend zum aktiven Kamera-Typ
          await flipControls.set({ scaleX: shouldMirrorAt(facingMode, "preview") ? -1 : 1 });
          const tryUpdateHeight = () => {
            const vh = videoRef.current?.videoHeight || 0;
            if (vh > 0) {
              const maxDisplay = typeof window !== "undefined" ? Math.round(window.innerHeight * 0.6) : vh;
              setLastVideoHeight(Math.min(vh, maxDisplay));
            }
          };
          tryUpdateHeight();
          videoRef.current.addEventListener("loadedmetadata", tryUpdateHeight, { once: true });
        }
      } catch (err) {
        console.error("Fehler beim Zugriff auf die Kamera:", err);
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") setError("Kamera-Zugriff wurde verweigert. Bitte erlauben.");
          else if (err.name === "NotFoundError") setError("Keine Kamera gefunden.");
          else if (err.name === "NotReadableError") setError("Kamera ist bereits in Verwendung.");
          else setError(`Kamera-Fehler: ${err.message}`);
        } else setError("Unbekannter Kamera-Fehler aufgetreten.");
        setCurrentStep("error");
      }
    },
    [checkCameraSupport, stopStream]
  );

  const captureImageFromVideo = useCallback((cameraType: CameraType, where: MirrorContext): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Kamera oder Canvas nicht verfügbar");
      return null;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Canvas-Kontext nicht verfügbar");
      return null;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (shouldMirrorAt(cameraType, where)) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    return canvas.toDataURL("image/jpeg", 0.8);
  }, [shouldMirrorAt]);

  const scrollPreviewIntoView = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (isFlipping) return;
    setIsFlipping(true);
    try {
      await flipControls.start({ rotateY: 90, transition: { duration: 0.25, ease: "easeIn" } });
      const newCamera = currentCamera === "environment" ? "user" : "environment";
      setCurrentCamera(newCamera);
      await startCamera(newCamera);
      await flipControls.set({ scaleX: shouldMirrorAt(newCamera, "preview") ? -1 : 1 });
      await flipControls.start({ rotateY: 0, transition: { duration: 0.25, ease: "easeOut" } });
      setTimeout(scrollPreviewIntoView, 50);
    } finally {
      setIsFlipping(false);
    }
  }, [currentCamera, flipControls, isFlipping, scrollPreviewIntoView, startCamera, shouldMirrorAt]);

  const startCaptureSequence = useCallback(async () => {
    setIsCapturing(true);
    setError(null);
    try {
      const firstCameraType = currentCamera;
      const firstImage = captureImageFromVideo(firstCameraType, "capture");
      if (!firstImage) {
        setError("Fehler beim Aufnehmen des ersten Bildes");
        setIsCapturing(false);
        return;
      }
      const otherCamera = firstCameraType === "environment" ? "user" : "environment";
      await startCamera(otherCamera);
      setTimeout(() => {
        const secondImage = captureImageFromVideo(otherCamera, "capture");
        if (!secondImage) {
          setError("Fehler beim Aufnehmen des zweiten Bildes");
          setIsCapturing(false);
          return;
        }
        if (firstCameraType === "environment") {
          setBackCameraImage(firstImage);
          setFrontCameraImage(secondImage);
        } else {
          setFrontCameraImage(firstImage);
          setBackCameraImage(secondImage);
        }
        stopStream();
        setIsCapturing(false);
        setCurrentStep("captured");
      }, 1000);
    } catch (err) {
      console.error("Fehler beim Capture-Sequence:", err);
      setError("Fehler beim Aufnehmen der Bilder");
      setIsCapturing(false);
    }
  }, [captureImageFromVideo, currentCamera, startCamera, stopStream]);

  const retake = useCallback(() => {
    setBackCameraImage(null);
    setFrontCameraImage(null);
    setCaptionText("");
    setCurrentStep("preview");
    setCurrentCamera("environment");
    startCamera("environment");
  }, [startCamera]);

  // Initial Posting Status + Kamera Start
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/posting-status", { cache: "no-store" });
        if (res.ok) {
          const data: PostingStatusResponse = await res.json();
          setPostsRemaining(data?.postsRemaining ?? 0);
          setTimeLeft(data?.timeLeftInWindowSeconds ?? null);
          // Kamera wird erst durch expliziten Nutzer-Klick aktiviert (Schritt 'inactive' -> 'preview')
        }
      } catch {
        // ignore
      }
    };
    init();
    return () => stopStream();
  }, [currentStep, startCamera, stopStream]);

  const activateCamera = useCallback(async () => {
    setCurrentStep("preview");
    await startCamera("environment");
  }, [startCamera]);

  return {
    // State
    currentStep,
    currentCamera,
    backCameraImage,
    frontCameraImage,
    isCameraSupported,
    isCapturing,
    captionText,
    postsRemaining,
    timeLeft,
    lastVideoHeight,
    error,
    isFlipping,
    // Refs & Animation
    videoRef,
    canvasRef,
    flipControls,
    // Actions
    shouldMirrorAt,
    setCaptionText,
    setCurrentStep,
    switchCamera,
    startCaptureSequence,
    retake,
    startCamera,
    setError,
    activateCamera,
  };
}
