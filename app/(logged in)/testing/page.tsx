"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type SettingMode = "preset" | "custom";

interface SettingState<T> {
  value: T | undefined;
  mode: SettingMode;
  customValue: string;
  useMin?: boolean;
}

interface CameraSettings {
  deviceId: string;
  aspectRatio: SettingState<number>;
  facingMode: SettingState<string>;
  frameRate: SettingState<number>;
  height: SettingState<number>;
  width: SettingState<number>;
  resizeMode: SettingState<string>;
}

const DEFAULT_SETTINGS: CameraSettings = {
  deviceId: "",
  aspectRatio: { value: undefined, mode: "preset", customValue: "", useMin: false },
  facingMode: { value: "user", mode: "preset", customValue: "", useMin: false },
  frameRate: { value: undefined, mode: "preset", customValue: "", useMin: false },
  height: { value: undefined, mode: "preset", customValue: "", useMin: false },
  width: { value: undefined, mode: "preset", customValue: "", useMin: false },
  resizeMode: { value: undefined, mode: "preset", customValue: "", useMin: false },
};

export default function TestingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [settings, setSettings] = useState<CameraSettings>(DEFAULT_SETTINGS);
  const [activeConstraints, setActiveConstraints] = useState<MediaTrackConstraints | null>(null);
  const [actualSettings, setActualSettings] = useState<MediaTrackSettings | null>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<Record<string, MediaTrackCapabilities>>({});
  const [isScanning, setIsScanning] = useState(false);

  // Fetch available devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first to get labels
        await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        setDevices(devices.filter((device) => device.kind === "videoinput"));
      } catch (err) {
        console.error("Error enumerating devices:", err);
        setError("Konnte Geräte nicht abrufen. Bitte Berechtigungen prüfen.");
      }
    };
    getDevices();
  }, []);

  const scanCapabilities = async () => {
    if (devices.length === 0) return;
    setIsScanning(true);
    const caps: Record<string, MediaTrackCapabilities> = {};

    // Stop current stream to avoid conflicts
    stopCamera();

    for (const device of devices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: device.deviceId } },
        });
        const track = stream.getVideoTracks()[0];
        if (track && track.getCapabilities) {
          caps[device.deviceId] = track.getCapabilities();
        }
        track.stop();
      } catch (err) {
        console.error(`Could not get capabilities for device ${device.label}:`, err);
      }
    }
    setDeviceCapabilities(caps);
    setIsScanning(false);
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setActiveConstraints(null);
      setActualSettings(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const startCamera = async () => {
    stopCamera();
    setError(null);

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {},
    };

    const videoConstraints: MediaTrackConstraints = {};

    if (settings.deviceId) {
      videoConstraints.deviceId = { exact: settings.deviceId };
    }

    // Helper to apply setting
    const applySetting = <T extends string | number>(
      key: keyof MediaTrackConstraints,
      setting: SettingState<T>
    ) => {
      let val: T | undefined;

      if (setting.mode === "custom" && setting.customValue) {
        // Try to parse number if it looks like one
        const num = Number(setting.customValue);
        // @ts-ignore - dynamic assignment
        val = isNaN(num) ? setting.customValue : num;
      } else if (setting.mode === "preset" && setting.value !== undefined) {
        val = setting.value;
      }

      if (val !== undefined) {
        if (setting.useMin) {
          // @ts-ignore
          videoConstraints[key] = { min: val };
        } else {
          // @ts-ignore
          videoConstraints[key] = val;
        }
      }
    };

    applySetting("aspectRatio", settings.aspectRatio);
    applySetting("facingMode", settings.facingMode);
    applySetting("frameRate", settings.frameRate);
    applySetting("height", settings.height);
    applySetting("width", settings.width);
    // @ts-ignore
    applySetting("resizeMode", settings.resizeMode);

    constraints.video = videoConstraints;

    try {
      console.log("Requesting stream with constraints:", constraints);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        setActiveConstraints(videoTrack.getConstraints());
        setActualSettings(videoTrack.getSettings());
      }

    } catch (err: any) {
      console.error("Error starting camera:", err);
      setError(`Fehler beim Starten der Kamera: ${err.name}: ${err.message}`);
    }
  };

  const updateSetting = <K extends keyof CameraSettings>(
    key: K,
    updates: Partial<CameraSettings[K]>
  ) => {
    setSettings((prev) => {
      const prevValue = prev[key];
      if (typeof prevValue === "object" && prevValue !== null) {
        return {
          ...prev,
          [key]: { ...prevValue, ...updates },
        };
      }
      return prev;
    });
  };

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold">Kamera API Test</h1>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Video Preview */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-800">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
        {!stream && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Kamera gestoppt
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold mb-4">Einstellungen</h2>

          {/* Device Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Kamera Gerät</label>
            <select
              className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent"
              value={settings.deviceId}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, deviceId: e.target.value }))
              }
            >
              <option value="" className="text-black">Standard / Automatisch</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId} className="text-black">
                  {device.label || `Kamera ${device.deviceId.slice(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>

          {/* Facing Mode */}
          <SettingControl
            label="Facing Mode"
            setting={settings.facingMode}
            onChange={(updates) => updateSetting("facingMode", updates)}
            presets={[
              { label: "Nicht gesetzt", value: undefined },
              { label: "User (Front)", value: "user" },
              { label: "Environment (Back)", value: "environment" },
              { label: "Left", value: "left" },
              { label: "Right", value: "right" },
            ]}
          />

          {/* Aspect Ratio */}
          <SettingControl
            label="Aspect Ratio"
            setting={settings.aspectRatio}
            onChange={(updates) => updateSetting("aspectRatio", updates)}
            presets={[
              { label: "Nicht gesetzt", value: undefined },
              { label: "16:9 (1.777)", value: 1.7777777778 },
              { label: "4:3 (1.333)", value: 1.3333333333 },
              { label: "1:1 (1.0)", value: 1 },
              { label: "9:16 (0.5625)", value: 0.5625 },
            ]}
          />

          {/* Frame Rate */}
          <SettingControl
            label="Frame Rate"
            setting={settings.frameRate}
            onChange={(updates) => updateSetting("frameRate", updates)}
            presets={[
              { label: "Nicht gesetzt", value: undefined },
              { label: "15 fps", value: 15 },
              { label: "24 fps", value: 24 },
              { label: "30 fps", value: 30 },
              { label: "60 fps", value: 60 },
            ]}
          />

          {/* Height */}
          <SettingControl
            label="Height (px)"
            setting={settings.height}
            onChange={(updates) => updateSetting("height", updates)}
            showMinToggle
            presets={[
              { label: "Nicht gesetzt", value: undefined },
              { label: "500", value: 500 },
              { label: "720", value: 720 },
              { label: "1000", value: 1000 },
              { label: "2000", value: 2000 },
            ]}
          />

          {/* Width */}
          <SettingControl
            label="Width (px)"
            setting={settings.width}
            onChange={(updates) => updateSetting("width", updates)}
            showMinToggle
            presets={[
              { label: "Nicht gesetzt", value: undefined },
              { label: "500", value: 500 },
              { label: "1000", value: 1000 },
              { label: "1500", value: 1500 },
              { label: "3000", value: 3000 },
            ]}
          />

          {/* Resize Mode */}
          <SettingControl
            label="Resize Mode"
            setting={settings.resizeMode}
            onChange={(updates) => updateSetting("resizeMode", updates)}
            presets={[
              { label: "Nicht gesetzt", value: undefined },
              { label: "None", value: "none" },
              { label: "Crop and Scale", value: "crop-and-scale" },
            ]}
          />

          <div className="flex gap-4 pt-4">
            <button
              onClick={startCamera}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              Kamera Starten / Aktualisieren
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              Stoppen
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold mb-4">Aktive Constraints</h2>
            <pre className="text-xs overflow-auto max-h-60 bg-gray-50 dark:bg-black p-2 rounded border border-gray-200 dark:border-zinc-800">
              {activeConstraints
                ? JSON.stringify(activeConstraints, null, 2)
                : "Keine aktiven Constraints"}
            </pre>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold mb-4">Tatsächliche Einstellungen (Settings)</h2>
            <pre className="text-xs overflow-auto max-h-60 bg-gray-50 dark:bg-black p-2 rounded border border-gray-200 dark:border-zinc-800">
              {actualSettings
                ? JSON.stringify(actualSettings, null, 2)
                : "Keine aktiven Einstellungen"}
            </pre>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Geräte Fähigkeiten</h2>
              <button
                onClick={scanCapabilities}
                disabled={isScanning}
                className="text-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 px-3 py-1 rounded transition-colors"
              >
                {isScanning ? "Scanne..." : "Scannen"}
              </button>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {Object.keys(deviceCapabilities).length === 0 && !isScanning && (
                <p className="text-sm text-gray-500">Klicken Sie auf Scannen um Fähigkeiten zu laden.</p>
              )}
              {devices.map((device) => {
                const caps = deviceCapabilities[device.deviceId];
                if (!caps) return null;
                return (
                  <div key={device.deviceId} className="space-y-2">
                    <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {device.label || device.deviceId}
                    </h3>
                    <pre className="text-xs overflow-auto bg-gray-50 dark:bg-black p-2 rounded border border-gray-200 dark:border-zinc-800">
                      {JSON.stringify(caps, null, 2)}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingControlProps<T> {
  label: string;
  setting: SettingState<T>;
  onChange: (updates: Partial<SettingState<T>>) => void;
  presets: { label: string; value: T | undefined }[];
  showMinToggle?: boolean;
}

function SettingControl<T extends string | number>({
  label,
  setting,
  onChange,
  presets,
  showMinToggle,
}: SettingControlProps<T>) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium">{label}</label>
        {showMinToggle && (
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={setting.useMin}
              onChange={(e) => onChange({ useMin: e.target.checked })}
              className="rounded border-gray-300 dark:border-zinc-700"
            />
            Min Mode
          </label>
        )}
      </div>
      <div className="flex gap-2">
        <select
          className="flex-1 p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent text-sm"
          value={setting.mode === "custom" ? "custom" : String(setting.value)}
          onChange={(e) => {
            if (e.target.value === "custom") {
              onChange({ mode: "custom" });
            } else {
              const preset = presets.find(
                (p) => String(p.value) === e.target.value
              );
              onChange({
                mode: "preset",
                value: preset?.value,
              });
            }
          }}
        >
          {presets.map((preset, i) => (
            <option key={i} value={String(preset.value)} className="text-black">
              {preset.label}
            </option>
          ))}
          <option value="custom" className="text-black">Benutzerdefiniert</option>
        </select>
        {setting.mode === "custom" && (
          <input
            type="text"
            className="w-1/3 p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent text-sm"
            placeholder="Wert"
            value={setting.customValue}
            onChange={(e) => onChange({ customValue: e.target.value })}
          />
        )}
      </div>
    </div>
  );
}
