import { NAV_ITEMS } from "../../constants/navigation";
import { Screen, ThemeMode } from "../../types/app";

type SidebarProps = {
  isDark: boolean;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  setTheme: (theme: ThemeMode) => void;
};

export function Sidebar({
  isDark,
  screen,
  setScreen,
  setTheme,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__mark">OR</div>
        <div>
          <p className="brand__title">Oak Report</p>
          <p className="brand__subtitle">TCG appraisal agent</p>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-button ${screen === item.id ? "nav-button--active" : ""}`}
            onClick={() => setScreen(item.id)}
            type="button"
          >
            <span className="nav-button__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        className="theme-toggle"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        type="button"
      >
        <span aria-hidden="true">{isDark ? "☼" : "◐"}</span>
        <span>{isDark ? "Light mode" : "Dark mode"}</span>
      </button>
    </aside>
  );
}
