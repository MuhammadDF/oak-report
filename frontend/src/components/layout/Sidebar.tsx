import { NAV_ITEMS } from "../../constants/navigation";
import { AppRole, Screen, ThemeMode } from "../../types/app";

type SidebarProps = {
  authRole: AppRole | null;
  isDark: boolean;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  setTheme: (theme: ThemeMode) => void;
};

export function Sidebar({
  authRole,
  isDark,
  screen,
  setScreen,
  setTheme,
}: SidebarProps) {
  const navItems = NAV_ITEMS.filter((item) => {
    if (!item.visibleTo) {
      return true;
    }
    if (!authRole) {
      return false;
    }
    return item.visibleTo.includes(authRole);
  });

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__mark">OR</div>
        <div>
          <p className="brand__title">Oak Report</p>
          <p className="brand__subtitle">TCG appraisal agent</p>
        </div>
      </div>

      <div className="sidebar__content">
        <nav className="sidebar__nav" aria-label="Primary">
          {navItems.map((item) => (
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
      </div>
    </aside>
  );
}
