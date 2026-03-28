import { NAV_ITEMS } from "../../constants/navigation";
import { Screen } from "../../types/app";

type MobileNavProps = {
  screen: Screen;
  setScreen: (screen: Screen) => void;
};

export function MobileNav({ screen, setScreen }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Mobile primary">
      {NAV_ITEMS.filter((item) => item.id !== "settings").map((item) => (
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
