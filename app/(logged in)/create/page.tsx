"use client";

import PageHead from "@/components/layout/PageHead";
import { useCaptureFlow } from "@/components/create/useCaptureFlow";
import CameraPreview from "@/components/create/CameraPreview";
import CapturedPreview from "@/components/create/CapturedPreview";
import ErrorState from "@/components/create/ErrorState";
import ActivateCameraStep from "@/components/create/ActivateCameraStep";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const trpc = useTRPC();
  const router = useRouter();
  const createMutation = useMutation(trpc.posts.create.mutationOptions());
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
    const input = {
      postId: (formData.get("postId") as string) || undefined,
      imageUrl: (formData.get("imageUrl") as string)!,
      frontImageUrl: (formData.get("frontImageUrl") as string) || undefined,
      caption: (formData.get("caption") as string) || undefined,
    };
    const res = await createMutation.mutateAsync(input);
    router.replace(`/posts/${res.id}`);
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
