import { NAV_ITEMS } from "../../constants/navigation";
import { AppRole, Screen } from "../../types/app";

type MobileNavProps = {
  authRole: AppRole | null;
  screen: Screen;
  setScreen: (screen: Screen) => void;
};

export function MobileNav({ authRole, screen, setScreen }: MobileNavProps) {
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
    <nav className="mobile-nav" aria-label="Mobile primary">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`mobile-nav__button ${
            screen === item.id ? "mobile-nav__button--active" : ""
          }`}
          onClick={() => setScreen(item.id)}
          type="button"
        >
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.mobileLabel}</span>
        </button>
      ))}
    </nav>
  );
}
