import { API_BASE_URL } from "../constants/api";
import { ThemeMode } from "../types/app";
import { ScreenHeader } from "../components/common/ScreenHeader";

type SettingsScreenProps = {
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
};

export function SettingsScreen({
  isDark,
  setTheme,
}: SettingsScreenProps) {
  return (
    <section className="screen">
      <ScreenHeader
        description="The mockup included a lightweight settings area, so this version exposes the key controls already present in the app."
        eyebrow="Settings"
        title="App behavior and analyst preferences."
      />

      <div className="settings-grid">
        <article className="panel settings-card">
          <p className="panel__eyebrow">Theme</p>
          <h2>{isDark ? "Dark mode enabled" : "Light mode enabled"}</h2>
          <p className="report-copy">
            Toggle the display mode for in-store use or bright desk review.
          </p>
          <button
            className="primary-button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            type="button"
          >
            Switch to {isDark ? "light" : "dark"} mode
          </button>
        </article>

        <article className="panel settings-card">
          <p className="panel__eyebrow">Endpoint</p>
          <h2>Scan API</h2>
          <p className="report-copy">{API_BASE_URL}/api/scan/scan</p>
        </article>

        <article className="panel settings-card">
          <p className="panel__eyebrow">Workflow</p>
          <h2>Collection handoff</h2>
          <p className="report-copy">
            Appraisal results stay on the scan screen for now. The next backend
            step is persisting accepted cards into the memory bank.
          </p>
        </article>
      </div>
    </section>
  );
}
