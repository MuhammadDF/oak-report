import { ChangeEventHandler, FormEventHandler } from "react";
import { CameraCard } from "./CameraCard";

type UploadPanelProps = {
  error: string | null;
  loading: boolean;
  onFileChange: ChangeEventHandler<HTMLInputElement>;
  onReset: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  previewUrl: string | null;
};

export function UploadPanel({
  error,
  loading,
  onFileChange,
  onReset,
  onSubmit,
  previewUrl,
}: UploadPanelProps) {
  return (
    <section className="panel upload-panel">
      <CameraCard loading={loading} />

      <form className="scan-form" onSubmit={onSubmit}>
        <label className="upload-field">
          <span className="upload-field__label">Card image</span>
          <input
            accept="image/png,image/jpeg,image/webp,image/heic"
            onChange={onFileChange}
            type="file"
          />
        </label>

        <div className="scan-form__actions">
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Scanning..." : "Appraise card"}
          </button>

          <button className="secondary-button" onClick={onReset} type="button">
            Clear report
          </button>
        </div>
      </form>

      {previewUrl ? (
        <div className="preview-card">
          <img alt="Selected card preview" src={previewUrl} />
        </div>
      ) : null}

      {error ? <p className="error-banner">{error}</p> : null}
    </section>
  );
}
