import { useEffect, useRef, useState } from "react";
import { CardSearchBar } from "./CardSearchBar";
import { useCardSearch } from "../../hooks/useCardSearch";
import { CardPricingMatch } from "../../types/app";

type LiveCameraPanelProps = {
  authToken: string | null;
  // Scan-level error from the parent (e.g. API failure after capture).
  error: string | null;
  // True while the scan API call is in-flight. Disables the Capture button.
  loading: boolean;
  // True when the appraisal modal/search page has opened and the frozen frame
  // should be cleared so the live view can resume underneath.
  isAppraisalOpen?: boolean;
  // Called with the captured JPEG File once the user clicks "Capture".
  onFileCaptured: (file: File) => void;
  // Passes search query + results up to AppraiseScreen to open the result modal.
  onSearchResults: (query: string, results: CardPricingMatch[]) => void;
};

export function LiveCameraPanel({
  authToken,
  error,
  isAppraisalOpen = false,
  loading,
  onFileCaptured,
  onSearchResults,
}: LiveCameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Keep a ref to the active MediaStream so we can stop all tracks on unmount,
  // which releases the camera indicator light on the device.
  const streamRef = useRef<MediaStream | null>(null);
  // Error that originated inside this component (e.g. permission denied).
  const [cameraError, setCameraError] = useState<string | null>(null);
  // Becomes true once the video element fires `canplay`, meaning frames are
  // flowing and a capture will produce a valid image.
  const [ready, setReady] = useState(false);
  // Frozen still shown after capture so the user sees the exact frame that was
  // taken while the scan starts processing.
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);

  const search = useCardSearch(authToken, onSearchResults);

  useEffect(() => {
    if (isAppraisalOpen && capturedPreviewUrl) {
      setCapturedPreviewUrl(null);
    }
  }, [capturedPreviewUrl, isAppraisalOpen]);

  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [capturedPreviewUrl]);

  // Start the camera stream as soon as this component mounts.
  // The cleanup function stops all tracks when the user switches tabs or
  // navigates away, so the camera light turns off immediately.
  useEffect(() => {
    // `cancelled` guards against a race where the component unmounts before
    // getUserMedia resolves — without it we'd try to assign srcObject to an
    // unmounted ref and leak the stream.
    let cancelled = false;

    async function startCamera() {
      // getUserMedia requires a secure context (HTTPS). On mobile browsers it
      // is simply absent when the page is loaded over plain HTTP.
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera is not available. Make sure the page is loaded over HTTPS.");
        return;
      }

      async function openStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
        return navigator.mediaDevices.getUserMedia(constraints);
      }

      try {
        // `facingMode: "environment"` requests the rear camera on mobile.
        // On desktop (MacBook) this is ignored and the built-in webcam is used.
        let stream: MediaStream;
        try {
          stream = await openStream({ video: { facingMode: "environment" } });
        } catch (err) {
          // OverconstrainedError means the browser couldn't satisfy facingMode.
          // Fall back to any available camera before giving up.
          if (err instanceof DOMException && (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError")) {
            stream = await openStream({ video: true });
          } else {
            throw err;
          }
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException) {
          switch (err.name) {
            case "NotAllowedError":
            case "PermissionDeniedError":
              setCameraError("Camera access was denied. Please allow camera permissions and try again.");
              break;
            case "NotFoundError":
            case "DevicesNotFoundError":
              setCameraError("No camera was found on this device.");
              break;
            case "NotReadableError":
            case "TrackStartError":
              setCameraError("Camera is in use by another app. Close other apps and try again.");
              break;
            case "SecurityError":
              setCameraError("Camera requires a secure connection (HTTPS).");
              break;
            default:
              setCameraError(`Could not access camera (${err.name}). Make sure no other app is using it.`);
          }
        } else {
          setCameraError("Could not access camera. Make sure no other app is using it.");
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Snapshot the current video frame when the user clicks "Capture".
  // Draws the live frame into an off-screen <canvas>, exports as JPEG, then
  // wraps in a File — same type UploadPanel produces — so both panels share
  // the same onFileCaptured / useAppraisal pipeline.
  function handleCapture() {
    const video = videoRef.current;
    if (!video || !ready || loading) return;

    const canvas = document.createElement("canvas");
    // Match canvas to the video's native resolution to avoid scaling artifacts.
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // 0.92 quality balances file size and detail for card texture recognition.
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const nextPreviewUrl = URL.createObjectURL(file);
      setCapturedPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return nextPreviewUrl;
      });
      onFileCaptured(file);
    }, "image/jpeg", 0.92);
  }

  const displayError = cameraError ?? error;

  return (
    <section className="panel upload-panel upload-panel--live-camera">
      <div className="live-camera">
        {cameraError ? null : (
          // Viewfinder wrapper — positions the card-frame overlay on top of the video
          <div className="live-camera__viewfinder">
            <video
              autoPlay
              className={`live-camera__video${capturedPreviewUrl ? " live-camera__video--hidden" : ""}`}
              muted         // Required for autoPlay without a user gesture in most browsers
              onCanPlay={() => setReady(true)}  // Unlocks Capture once frames are flowing
              playsInline   // Prevents iOS from forcing full-screen playback
              ref={videoRef}
            />

            {capturedPreviewUrl ? (
              <img
                alt="Captured card preview"
                aria-hidden="true"
                className="live-camera__capture-preview"
                src={capturedPreviewUrl}
              />
            ) : null}

            {/* Card alignment frame overlay — corner brackets show the user
                where to position the card. box-shadow darkens the surrounding
                area to create a spotlight/cutout effect. */}
            <div className="card-frame" aria-hidden="true">
              <div className="card-frame__cutout">
                <span className="card-frame__corner card-frame__corner--tl" />
                <span className="card-frame__corner card-frame__corner--tr" />
                <span className="card-frame__corner card-frame__corner--bl" />
                <span className="card-frame__corner card-frame__corner--br" />
              </div>
            </div>

            <p className="live-camera__hint">Align card within frame</p>
          </div>
        )}

        {/* Capture button sits below the viewfinder, same as the original layout */}
        {!cameraError && (
          <button
            className={`primary-button camera-button ${(!ready || loading) ? "camera-button--disabled" : ""}`}
            disabled={!ready || loading}
            onClick={handleCapture}
            type="button"
          >
            {loading ? "Analyzing..." : "Capture"}
          </button>
        )}

        <CardSearchBar
          error={search.error}
          lastSearchTerm={search.lastSearchTerm}
          loading={search.loading}
          onQueryChange={search.setQuery}
          onSubmit={search.handleSubmit}
          query={search.query}
        />

        {displayError ? <p className="error-banner">{displayError}</p> : null}
      </div>
    </section>
  );
}
