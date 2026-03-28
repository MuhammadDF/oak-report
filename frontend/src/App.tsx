import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { AppraiseScreen } from "./screens/AppraiseScreen";
import { CollectionScreen } from "./screens/CollectionScreen";
import { LibraryScreen } from "./screens/LibraryScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { Screen, ThemeMode } from "./types/app";

export default function App() {
  const [screen, setScreen] = useState<Screen>("appraise");
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const isDark = theme === "dark";

  return (
    <AppShell
      isDark={isDark}
      screen={screen}
      setScreen={setScreen}
      setTheme={setTheme}
    >
      {screen === "appraise" ? <AppraiseScreen /> : null}
      {screen === "collection" ? <CollectionScreen /> : null}
      {screen === "library" ? <LibraryScreen /> : null}
      {screen === "settings" ? (
        <SettingsScreen isDark={isDark} setTheme={setTheme} />
      ) : null}
    </AppShell>
  );
}
