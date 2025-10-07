"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PageHead from "@/components/layout/PageHead";
import { createReaction, getUserReactions } from "./actions";
import ReactionBubble from "@/components/post/reactions/ReactionBubble";
import { motion } from "motion/react";
import type { UserReaction } from "@/lib/db/schema";
import { reactionEmojis } from "@/lib/reactions";

export default function ReactionsPage() {
	// Schritte: Emoji wählen -> Vorschau -> aufgenommen -> Fehler
	const [currentStep, setCurrentStep] = useState<"choose-emoji" | "preview" | "captured" | "error">("choose-emoji");

	// Kamera-States
	const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isCameraSupported, setIsCameraSupported] = useState(true);
	const [isCapturing, setIsCapturing] = useState(false);

		// Emoji (wird zuerst gewählt)
		const [emoji, setEmoji] = useState<string>("");

		// Wenn ein Query-Param `emoji` gesetzt ist, versuchen wir ihn zu verwenden
		useEffect(() => {
			try {
				const params = new URLSearchParams(window.location.search);
				const q = params.get("emoji");
				if (q && reactionEmojis.includes(q)) {
					setEmoji(q);
					// Wenn ein Emoji vorgegeben ist, direkt in die Kamera-Vorschau springen
					setCurrentStep("preview");
				}
			} catch (e) {
				// Ignoriere Fehler (z. B. SSR, aber diese Datei ist "use client")
			}
		}, []);

	// Bisherige Reaktionen des Nutzers
	const [userReactions, setUserReactions] = useState<UserReaction[]>([]);

	useEffect(() => {
		(async () => {
			try {
				const reactions = await getUserReactions();
				setUserReactions(Array.isArray(reactions) ? reactions : []);
			} catch {
				setUserReactions([]);
			}
		})();
	}, []);

	// Mappe die letzten Nutzer-Reaktionen je Emoji für Anreicherung
	const lastReactionByEmoji = useMemo(() => {
		const map = new Map<string, UserReaction>();
		for (const r of userReactions) {
			if (!map.has(r.emoji)) map.set(r.emoji, r);
		}
		return map;
	}, [userReactions]);

	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const overlayContainerRef = useRef<HTMLDivElement>(null);
	const [overlaySize, setOverlaySize] = useState<number>(0);

	// Mess-Logik: Kreis soll Durchmesser = kleinere Kante der sichtbaren Video-Fläche haben
	const updateOverlaySize = () => {
		const v = videoRef.current;
		if (!v) return;
		const w = v.clientWidth || 0;
		const h = v.clientHeight || 0;
		const min = Math.max(0, Math.min(w, h));
		setOverlaySize(min);
	};

	const checkCameraSupport = () => {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			setIsCameraSupported(false);
			setError("Kamera wird von diesem Browser nicht unterstützt");
			setCurrentStep("error");
			return false;
		}
		return true;
	};

	const stopStream = () => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		}
	};

	const startCamera = async () => {
		if (!checkCameraSupport()) return;
		try {
			setError(null);
			stopStream();

			const constraints: MediaStreamConstraints = {
				video: {
					facingMode: "user",/*
					width: { ideal: 1500 },
					height: { ideal: 2000 },*/
				},
				audio: false,
			};

			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
				// Nach Start Größe berechnen
				updateOverlaySize();
			}
		} catch (err) {
			console.error("Fehler beim Zugriff auf die Kamera:", err);
			if (err instanceof Error) {
				if ((err as any).name === "NotAllowedError") {
					setError("Kamera-Zugriff wurde verweigert. Bitte erlauben Sie den Kamera-Zugriff.");
				} else if ((err as any).name === "NotFoundError") {
					setError("Keine Kamera gefunden.");
				} else if ((err as any).name === "NotReadableError") {
					setError("Kamera ist bereits in Verwendung.");
				} else {
					setError(`Kamera-Fehler: ${err.message}`);
				}
			} else {
				setError("Unbekannter Kamera-Fehler aufgetreten.");
			}
			setCurrentStep("error");
		}
	};

	const captureImageFromVideo = (): string | null => {
		if (!videoRef.current || !canvasRef.current) {
			setError("Kamera oder Canvas nicht verfügbar");
			return null;
		}
		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");
		if (!context) {
			setError("Canvas-Kontext nicht verfügbar");
			return null;
		}
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL("image/jpeg", 0.8);
	};

	const takePhoto = () => {
		setIsCapturing(true);
		const shot = captureImageFromVideo();
		if (!shot) {
			setIsCapturing(false);
			return;
		}
		setImageDataUrl(shot);
		stopStream();
		setIsCapturing(false);
		setCurrentStep("captured");
	};

	const retake = () => {
		setImageDataUrl(null);
		setCurrentStep("preview");
		startCamera();
	};

		// Starte Kamera, sobald wir im Preview-Schritt sind
		useEffect(() => {
			if (currentStep === "preview") {
				startCamera();
			}
		}, [currentStep]);

		// Stream beim Unmount beenden
		useEffect(() => {
			return () => {
				stopStream();
			};
		}, []);

		// Overlay-Größe mit ResizeObserver und Events aktuell halten
		useEffect(() => {
				if (currentStep !== "preview") return;
				const v = videoRef.current;
				if (!v) return;
				const handle = () => updateOverlaySize();
				// Initial messen
				handle();
				// Reagieren auf Video-Events
				v.addEventListener("loadedmetadata", handle);
				v.addEventListener("playing", handle);
				v.addEventListener("resize", handle as any);
				// ResizeObserver fallback/Ergänzung
				const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(handle) : null;
				ro?.observe(v);
				// Fenster-Resize
				window.addEventListener("resize", handle);
				return () => {
						v.removeEventListener("loadedmetadata", handle);
						v.removeEventListener("playing", handle);
						v.removeEventListener("resize", handle as any);
						ro?.disconnect();
						window.removeEventListener("resize", handle);
				};
		}, [currentStep]);

	// Hilfsfunktion: DataURL -> File für Upload
	const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
		const res = await fetch(dataUrl);
		const blob = await res.blob();
		return new File([blob], filename, { type: blob.type || "image/jpeg" });
	};

		const handleSubmit = async () => {
			if (!imageDataUrl || !emoji) return;
		const formData = new FormData();
		const file = await dataUrlToFile(imageDataUrl, "reaction.jpg");
		formData.set("image", file);
		formData.set("emoji", emoji);
		const res = await createReaction(formData);
		if (!res.success) {
			setError(res.error || "Unbekannter Fehler beim Speichern");
			setCurrentStep("error");
			return;
		}
		// Optional: Weiterleitung oder Hinweis – für jetzt zurück zum Feed
		window.location.href = "/reactions";
	};

	return (
		<div>
				<PageHead title="Reaktionen bearbeiten" backUrl="/feed" subtitle="Wow! Reaction!" />

				{/* Schritt 1: Emoji wählen */}
				{currentStep === "choose-emoji" && (
					<div className="space-y-6">
						<h3 className="text-xl font-semibold">Wähle ein GnagMoji zum Bearbeiten</h3>
						<div className="flex justify-center">
							<div className="flex flex-wrap gap-4 justify-center">
								{reactionEmojis.map((e) => {
									const r = lastReactionByEmoji.get(e);
									const imageUrl = r?.imageUrl || undefined;
									return (
										<ReactionBubble
											key={`select-${e}-${imageUrl ?? 'noimg'}`}
											emoji={e}
											imageUrl={imageUrl}
											selected={undefined}
											interactive
											size="xl"
											onClick={() => {
												setEmoji(e);
												setCurrentStep("preview");
											}}
										/>
									);
								})}
							</div>
						</div>
					</div>
				)}

				{/* Schritt 2: Kamera Vorschau */}
				{currentStep === "preview" && (
				<div className="space-y-4">
					<div ref={overlayContainerRef} className="relative w-full flex justify-center items-center">
						<video
							ref={videoRef}
							className="border-2 border-gray-300 rounded-lg max-h-[60vh] w-auto"
							playsInline
							muted
							autoPlay
							style={{ maxWidth: "100%" }}
						/>

						{/* Masken-Overlay: Außenbereich abdunkeln, Kreis als Loch */}
						<div className="absolute inset-0 pointer-events-none z-10">
							<svg className="w-full h-full"  xmlns="http://www.w3.org/2000/svg">
								<defs>
									<mask id="circle-hole-mask">
										{/* Vollflächig weiß (sichtbar) */}
										<rect x="0" y="0" width="100%" height="100%" fill="white" />
										{/* Kreis in schwarz -> transparentes Loch in der Maske */}
										<circle
											cx="50%"
											cy="50%"
											r={Math.max(0, overlaySize / 2)}
											fill="black"
										/>
									</mask>
								</defs>
								{/* Abgedunkelte Fläche, mit Loch per Maske */}
								<rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.8)" mask="url(#circle-hole-mask)" />
							</svg>
						</div>

						{/* Kreiskante separat, damit der Rand klar sichtbar bleibt */}
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
							<div
								style={{ width: overlaySize, height: overlaySize }}
								className="rounded-full border-2 border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.2)_inset]"
							/>
						</div>

						{/* Overlay Buttons */}
						<div className="absolute inset-0 pointer-events-none z-30">
							<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
								<button
									type="button"
									onClick={takePhoto}
									disabled={!isCameraSupported || isCapturing}
									className="w-14 h-14 bg-black text-white opacity-60 hover:opacity-80 disabled:bg-zinc-900 disabled:cursor-not-allowed rounded-full cursor-pointer transition-colors flex items-center justify-center"
									title={isCapturing ? "Aufnahme läuft..." : "Foto aufnehmen"}
								>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-7">
										<path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
										<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
									</svg>
								</button>
							</div>
						</div>
					</div>

					{isCapturing && (
						<div className="text-center p-4">
							<p className="font-semibold">Bitte lächeln!</p>
						</div>
					)}
				</div>
			)}

					{/* Schritt 3: Vorschau & Senden */}
					{currentStep === "captured" && imageDataUrl && (
				<div className="space-y-6">
								<h3 className="text-xl font-semibold">Vorschau</h3>
								<div className="flex justify-center">
									<ReactionBubble
										imageUrl={imageDataUrl}
										emoji={emoji}
										selected={true}
										size="xxl"
									/>
								</div>

							{/* Emoji nachträglich ändern */}
							<div>
								<div className="flex flex-wrap gap-4 justify-center">
									{reactionEmojis.map((e) => {
										const r = lastReactionByEmoji.get(e);
										const imageUrl = r?.imageUrl || undefined;
										return (
											<ReactionBubble
												key={`change-${e}-${imageUrl ?? 'noimg'}`}
												emoji={e}
												imageUrl={imageUrl}
												selected={e === emoji}
												interactive
												size="xl"
												onClick={() => setEmoji(e)}
											/>
										);
									})}
								</div>
							</div>

					{/* Aktionen */}
					<div className="flex gap-3">
						<button
							type="button"
							onClick={handleSubmit}
							className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer font-semibold"
						>
							Reaktion speichern
						</button>
						<button
							type="button"
							onClick={retake}
							className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg cursor-pointer font-semibold"
						>
							Neuer Versuch
						</button>
					</div>
				</div>
			)}

			{currentStep === "error" && (
				<div className="text-center p-6">
					<div className="text-red-300 mb-2">
						<div className="text-3xl mb-2 animate-bounce">🤔</div>
						<p className="text-lg font-semibold">Webcams sind wie Faxgeräte. Sie machen Faxen...</p>
						{error && <p className="text-sm mt-2">{error}</p>}
					</div>
					<button
						type="button"
						onClick={() => {
							setCurrentStep("preview");
							setError(null);
							startCamera();
						}}
						className="px-6 py-3 text-2xl font-bold text-white cursor-pointer transition-colors hover:text-zinc-300"
					>
						Erneut versuchen
					</button>
				</div>
			)}

			<canvas ref={canvasRef} className="hidden" />
		</div>
	);
}

