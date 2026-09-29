import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RotateCcw, Check, X, AlertCircle, RefreshCw, Upload, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface LiveCameraModalProps {
  isOpen: boolean;
  locationName?: string;
  language: Language;
  onCapture: (file: File, previewUrl: string) => void;
  onFallbackToUpload?: () => void;
  onClose: () => void;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  locationName,
  language,
  onCapture,
  onFallbackToUpload,
  onClose,
}) => {
  const t = getTranslation(language);

  // States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup all active tracks
  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      } catch (err) {
        console.warn('Error stopping camera track:', err);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  }, []);

  // Check if multiple camera devices exist
  const checkForCameras = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      }
    } catch {
      // Ignore device enumeration errors
    }
  }, []);

  // Start device camera
  const startCamera = useCallback(
    async (mode: 'environment' | 'user' = facingMode) => {
      stopAllTracks();
      setErrorMessage(null);
      setIsCameraStarting(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsCameraStarting(false);
        setErrorMessage(t.cameraNotSupported);
        return;
      }

      try {
        // First try with preferred facingMode and optimal resolution
        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: mode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
        } catch (firstErr: unknown) {
          console.warn('Initial facingMode camera request failed, falling back to simple video constraints:', firstErr);
          // Fallback to basic { video: true } constraint (e.g. desktop webcam or browser without facingMode support)
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn('Video play interrupted or autoplay blocked:', playErr);
          }
        }

        checkForCameras();
      } catch (err: unknown) {
        console.error('Camera access error:', err);
        const errorName = (err as Error)?.name || '';

        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setErrorMessage(t.cameraPermissionDenied);
        } else if (
          errorName === 'NotFoundError' ||
          errorName === 'DevicesNotFoundError' ||
          (err as Error)?.message?.includes('not found')
        ) {
          setErrorMessage(t.cameraUnavailable);
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          setErrorMessage(t.cameraInUse);
        } else {
          setErrorMessage(t.cameraGenericError);
        }
      } finally {
        setIsCameraStarting(false);
      }
    },
    [facingMode, stopAllTracks, t, checkForCameras]
  );

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setErrorMessage(null);
      startCamera(facingMode);
    } else {
      stopAllTracks();
      if (capturedPhoto?.previewUrl) {
        URL.revokeObjectURL(capturedPhoto.previewUrl);
        setCapturedPhoto(null);
      }
    }

    return () => {
      stopAllTracks();
    };
  }, [isOpen]);

  // Handle pagehide or visibilitychange to release camera promptly
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllTracks();
      } else if (isOpen && !capturedPhoto) {
        startCamera(facingMode);
      }
    };

    window.addEventListener('pagehide', stopAllTracks);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', stopAllTracks);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, capturedPhoto, facingMode, startCamera, stopAllTracks]);

  // Capture current video frame to high-quality image file
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setErrorMessage(t.cameraGenericError);
        return;
      }

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        blob => {
          if (!blob) {
            setErrorMessage(t.cameraGenericError);
            return;
          }

          const fileName = `location_${Date.now()}_live.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);

          setCapturedPhoto({ file, previewUrl });

          // Turn off camera stream to save battery and turn off camera LED
          stopAllTracks();
        },
        'image/jpeg',
        0.9
      );
    } catch (err) {
      console.error('Photo capture error:', err);
      setErrorMessage(t.cameraGenericError);
    }
  };

  // Retake photo: discard captured preview and restart camera
  const handleRetake = () => {
    if (capturedPhoto?.previewUrl) {
      URL.revokeObjectURL(capturedPhoto.previewUrl);
    }
    setCapturedPhoto(null);
    setErrorMessage(null);
    startCamera(facingMode);
  };

  // Confirm and use captured photo
  const handleUsePhoto = () => {
    if (!capturedPhoto) return;
    stopAllTracks();
    onCapture(capturedPhoto.file, capturedPhoto.previewUrl);
    onClose();
  };

  // Switch between rear and front cameras
  const handleSwitchFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Cancel and close
  const handleClose = () => {
    stopAllTracks();
    if (capturedPhoto?.previewUrl) {
      URL.revokeObjectURL(capturedPhoto.previewUrl);
    }
    setCapturedPhoto(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[95vh] transition-all">
        {/* Top Header Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="camera-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
              >
                {t.cameraPreviewTitle}
              </h3>
              {locationName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {locationName}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label={t.cancel}
            title={t.cancel}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera / Preview Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
          {errorMessage ? (
            /* Error / Permission Denied State */
            <div className="w-full py-8 px-4 flex flex-col items-center text-center space-y-4 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.cameraUnavailable}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors min-h-[48px]"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.retakePhoto}</span>
                </button>

                {onFallbackToUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onFallbackToUpload();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-colors min-h-[48px]"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{t.uploadPhoto}</span>
                  </button>
                )}
              </div>
            </div>
          ) : capturedPhoto ? (
            /* Captured Photo Preview State */
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="relative w-full max-h-[50vh] sm:max-h-[55vh] flex items-center justify-center rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500/40 shadow-inner">
                <img
                  src={capturedPhoto.previewUrl}
                  alt={locationName || t.photoPreview}
                  className="w-full max-h-[50vh] sm:max-h-[55vh] object-contain rounded-2xl"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.photoPreview}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                {language === 'ta'
                  ? 'புகைப்படம் சரியாக உள்ளதா எனப் பார்த்து உறுதிப்படுத்தவும்.'
                  : 'Check the photo and confirm if it is clear.'}
              </p>
            </div>
          ) : (
            /* Live Camera Stream Video */
            <div className="w-full flex flex-col items-center space-y-2">
              <div className="relative w-full aspect-4/3 sm:aspect-16/10 max-h-[50vh] sm:max-h-[55vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-md">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-2xl"
                />

                {isCameraStarting && (
                  <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-white space-y-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                    <span className="text-xs font-medium tracking-wide">
                      {language === 'ta' ? 'கேமரா திறக்கப்படுகிறது...' : 'Opening camera...'}
                    </span>
                  </div>
                )}

                {/* Target Guides for easier framing (especially for elderly users) */}
                <div className="absolute inset-6 sm:inset-10 border-2 border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-sm" />
                  </div>
                </div>

                {/* Switch Camera Button (if device has front & back cameras) */}
                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleSwitchFacing}
                    title={t.cameraSwitchFacing}
                    aria-label={t.cameraSwitchFacing}
                    className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shadow"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                {t.cameraInstructions}
              </p>
            </div>
          )}
        </div>

        {/* Footer Action Buttons - Prominent & Elderly-Friendly */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
          {capturedPhoto ? (
            /* Action Buttons for Preview State */
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="order-2 sm:order-1 py-3 px-5 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[52px] shadow-xs active:scale-[0.98]"
              >
                <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>{t.retakePhoto}</span>
              </button>

              <button
                type="button"
                onClick={handleUsePhoto}
                className="order-1 sm:order-2 flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer min-h-[52px] active:scale-[0.98]"
              >
                <Check className="w-5 h-5" />
                <span>{t.usePhoto}</span>
              </button>
            </div>
          ) : !errorMessage ? (
            /* Action Buttons for Live Stream View */
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="order-2 sm:order-1 sm:w-auto py-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[48px]"
              >
                <X className="w-4 h-4" />
                <span>{t.cancel}</span>
              </button>

              <button
                type="button"
                id="camera-capture-action-btn"
                onClick={handleCapture}
                disabled={isCameraStarting}
                className="order-1 sm:order-2 flex-1 sm:flex-initial py-3.5 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-3 transition-all cursor-pointer min-h-[54px] active:scale-[0.98] disabled:opacity-50"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <span>{t.capturePhoto}</span>
              </button>
            </div>
          ) : (
            /* Action Button for Cancel when error */
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[48px]"
              >
                <span>{t.cancel}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
