import { ChangeEvent, useEffect, useState } from "react";
import { API_BASE_URL } from "../constants/api";
import { ScanResult } from "../types/app";

export function useAppraisal() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reportPreviewUrl, setReportPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== reportPreviewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, reportPreviewUrl]);

  useEffect(() => {
    return () => {
      if (reportPreviewUrl) {
        URL.revokeObjectURL(reportPreviewUrl);
      }
    };
  }, [reportPreviewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    const nextPreview = nextFile ? URL.createObjectURL(nextFile) : null;
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

  async function submitSelectedFile(
    selectedFile: File,
    previewForReport: string | null,
  ) {
    const formData = new FormData();
    formData.append("image", selectedFile);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scan/scan`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Scan failed with status ${response.status}`);
      }

      const payload = (await response.json()) as ScanResult;
      setResult(payload);
      if (previewForReport) {
        setReportPreviewUrl(previewForReport);
      }
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

  function resetAppraisal() {
    setResult(null);
    setError(null);
    setPreviewUrl(null);
    setReportPreviewUrl(null);
  }

  return {
    error,
    handleFileChange,
    loading,
    previewUrl,
    reportPreviewUrl,
    resetAppraisal,
    result,
  };
}
