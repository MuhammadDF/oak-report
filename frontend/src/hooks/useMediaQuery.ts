import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const getMatch = () =>
    typeof window !== "undefined" && "matchMedia" in window
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);
    handleChange();

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    // Safari < 14 fallback
    // @ts-expect-error addListener exists on older MediaQueryList
    mediaQuery.addListener(handleChange);
    // @ts-expect-error removeListener exists on older MediaQueryList
    return () => mediaQuery.removeListener(handleChange);
  }, [query]);

  return matches;
}
