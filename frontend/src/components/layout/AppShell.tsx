import { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Screen, ThemeMode } from "../../types/app";

type AppShellProps = {
  children: ReactNode;
  isDark: boolean;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  setTheme: (theme: ThemeMode) => void;
};

export function AppShell({
  children,
  isDark,
  screen,
  setScreen,
  setTheme,
}: AppShellProps) {
  return (
    <div className={`app ${isDark ? "theme-dark" : "theme-light"}`}>
      <div className="app__chrome">
        <Sidebar
          isDark={isDark}
          screen={screen}
          setScreen={setScreen}
          setTheme={setTheme}
        />
        <main className="content">{children}</main>
      </div>
      <MobileNav screen={screen} setScreen={setScreen} />
    </div>
  );
}
