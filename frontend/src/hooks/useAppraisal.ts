import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { API_BASE_URL } from "../constants/api";
import { ScanResult } from "../types/app";

export function useAppraisal() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(nextFile);
    setResult(null);
    setError(null);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose an image before running an appraisal.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

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
  }

  return {
    error,
    handleFileChange,
    handleSubmit,
    loading,
    previewUrl,
    resetAppraisal,
    result,
  };
}
