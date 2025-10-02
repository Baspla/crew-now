"use client";

import { createPost } from "./actions";
import PageHead from "@/components/layout/PageHead";
import { useCaptureFlow } from "@/components/create/useCaptureFlow";
import CameraPreview from "@/components/create/CameraPreview";
import CapturedPreview from "@/components/create/CapturedPreview";
import ErrorState from "@/components/create/ErrorState";
import ActivateCameraStep from "@/components/create/ActivateCameraStep";

export default function CreatePage() {
  const {
    currentStep,
    backCameraImage,
    frontCameraImage,
    isCameraSupported,
    isCapturing,
    captionText,
    postsRemaining,
    lastVideoHeight,
    error,
    isFlipping,
    videoRef,
    canvasRef,
    flipControls,
    setCaptionText,
    setCurrentStep,
    switchCamera,
    startCaptureSequence,
    retake,
    startCamera,
    setError,
    activateCamera,
  } = useCaptureFlow();

  const handleSubmit = async (formData: FormData) => {
    if (postsRemaining !== null && postsRemaining <= 0) {
      setError('Du hast keine Posts mehr übrig.');
      return;
    }
    await createPost(formData);
  };

  return (
    <div>
      <PageHead title="Neuen Post erstellen" backUrl="/feed" subtitle="Es wir Zeit für ein Bild" />
      {currentStep === 'inactive' && (
        <ActivateCameraStep
          onActivate={activateCamera}
          postsRemaining={postsRemaining}
          disabled={postsRemaining !== null && postsRemaining <= 0}
        />
      )}
      {currentStep === 'preview' && (
        <CameraPreview
          videoRef={videoRef}
          canvasRef={canvasRef}
          flipControls={flipControls}
          lastVideoHeight={lastVideoHeight}
          isCameraSupported={isCameraSupported}
          isCapturing={isCapturing}
          postsRemaining={postsRemaining}
          isFlipping={isFlipping}
          startCaptureSequence={startCaptureSequence}
          switchCamera={switchCamera}
        />
      )}
      {currentStep === 'captured' && backCameraImage && (
        <CapturedPreview
          backCameraImage={backCameraImage}
          frontCameraImage={frontCameraImage}
          captionText={captionText}
          setCaptionText={setCaptionText}
          onSubmit={handleSubmit}
          retake={retake}
          postsRemaining={postsRemaining}
        />
      )}
      {currentStep === 'error' && (
        <ErrorState
          error={error}
          onRetry={() => {
            setCurrentStep('preview');
            setError(null);
            startCamera('environment');
          }}
        />
      )}
    </div>
  );
}
