import { ChangeEvent, useEffect, useState } from "react";
import { API_BASE_URL } from "../constants/api";
import { ScanResult } from "../types/app";

// Central hook for all card-scan state. Both the UploadPanel (file input) and
// LiveCameraPanel (WebRTC capture) funnel their images through here so that
// loading, error, and result state is shared in one place.
export function useAppraisal(authToken: string | null) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // `reportPreviewUrl` is kept alive after a successful scan so the result
  // modal can display the image. `previewUrl` is the in-flight preview shown
  // while uploading; it's cleared once the API responds.
  const [reportPreviewUrl, setReportPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke the in-flight preview blob when it changes so we don't leak memory.
  // We skip revocation if previewUrl === reportPreviewUrl because the report
  // modal is still referencing the same object URL.
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== reportPreviewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, reportPreviewUrl]);

  // Revoke the report preview blob when it changes (e.g. a new scan replaces
  // the previous one). This runs on cleanup, not on every render.
  useEffect(() => {
    return () => {
      if (reportPreviewUrl) {
        URL.revokeObjectURL(reportPreviewUrl);
      }
    };
  }, [reportPreviewUrl]);

  // Entry point for UploadPanel's <input type="file"> onChange event.
  // Resets any previous result, creates a blob URL for the preview, and
  // kicks off the API call.
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    const nextPreview = nextFile ? URL.createObjectURL(nextFile) : null;
    // Clear the input value so selecting the same file again triggers onChange.
    event.target.value = "";

    if (previewUrl && previewUrl !== reportPreviewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setResult(null);
    setError(null);
    setPreviewUrl(nextPreview);

    if (nextFile) {
      void submitSelectedFile(nextFile, nextPreview);
    }
  }

  // Entry point for LiveCameraPanel, which produces a File directly from a
  // canvas snapshot rather than from a file input event. Mirrors the logic in
  // handleFileChange but skips the event-unwrapping step.
  function handleFileDirect(file: File) {
    const nextPreview = URL.createObjectURL(file);

    if (previewUrl && previewUrl !== reportPreviewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setResult(null);
    setError(null);
    setPreviewUrl(nextPreview);
    void submitSelectedFile(file, nextPreview);
  }

  // Shared upload logic called by both entry points. Posts the image as
  // multipart/form-data to the backend scan endpoint and stores the result.
  // `previewForReport` is the blob URL to promote to reportPreviewUrl on
  // success so the result modal has an image to display. 
  async function submitSelectedFile(
    selectedFile: File,
    previewForReport: string | null,
  ) {
    const formData = new FormData();
    formData.append("image", selectedFile);

    setLoading(true);
    setError(null);

    try {
      if (!authToken) {
        throw new Error("Authentication required for appraisal.");
      }

      const response = await fetch(`${API_BASE_URL}/api/scan/scan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let message = `Scan failed with status ${response.status}`;

        try {
          const payload = (await response.json()) as { detail?: string };
          if (payload.detail) {
            message = payload.detail;
          }
        } catch {
          // Keep the status-based fallback when the body is not JSON.
        }

        throw new Error(message);
      }

      const payload = (await response.json()) as ScanResult;
      setResult(payload);
      if (previewForReport) {
        setReportPreviewUrl(previewForReport);
      }
      // Clear the in-flight preview now that we have a reportPreviewUrl.
      setPreviewUrl(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The scan request failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Wipes all scan state — called when the user closes the result modal or
  // switches context (e.g. starts a new search).
  function resetAppraisal() {
    setResult(null);
    setError(null);
    setPreviewUrl(null);
    setReportPreviewUrl(null);
  }

  return {
    error,
    handleFileChange,   // For UploadPanel (<input type="file">)
    handleFileDirect,   // For LiveCameraPanel (canvas → File)
    loading,
    previewUrl,
    reportPreviewUrl,
    resetAppraisal,
    result,
  };
}
