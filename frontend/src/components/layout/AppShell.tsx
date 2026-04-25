import { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { AppRole, Screen, ThemeMode } from "../../types/app";

type AppShellProps = {
  children: ReactNode;
  isDark: boolean;
  authRole: AppRole | null;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  setTheme: (theme: ThemeMode) => void;
};

export function AppShell({
  children,
  isDark,
  authRole,
  screen,
  setScreen,
  setTheme,
}: AppShellProps) {
  return (
    <div className={`app ${isDark ? "theme-dark" : "theme-light"}`}>
      <div className="app__chrome">
        <Sidebar
          authRole={authRole}
          isDark={isDark}
          screen={screen}
          setScreen={setScreen}
          setTheme={setTheme}
        />
        <main className="content">{children}</main>
      </div>
      <MobileNav authRole={authRole} screen={screen} setScreen={setScreen} />
    </div>
  );
}
