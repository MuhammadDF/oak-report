import { useMediaQuery } from "./useMediaQuery";

// Multi-signal mobile detection. Combines two orthogonal signals so we don't
// misclassify a narrow desktop window as a phone or an iPad as a desktop:
//   - `(pointer: coarse)` — user's primary input is touch-like
//   - `navigator.maxTouchPoints > 0` — hardware actually has a touchscreen
// Width is deliberately NOT used; it conflates window size with device class.
export function useIsMobile() {
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const hasTouch =
    typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  return coarsePointer && hasTouch;
}
