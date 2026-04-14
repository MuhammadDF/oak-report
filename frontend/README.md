# Frontend Scaffold

This folder houses the presentation layer for the Pokémon appraisal tool.

## Current layout
- `components/`: Holds reusable UI primitives (buttons, card previews, scan overlays).
- `pages/`: Entry points for major screens such as the camera viewfinder, dashboard, and admin console.

## Card Scanning

The Appraise screen (`src/screens/AppraiseScreen.tsx`) offers two scanning modes, switchable via a tab bar:

### Upload tab (default)
- **Mobile:** Shows a "Use camera" button backed by `<input type="file" capture="environment">`. Tapping it opens the native OS camera picker.
- **Desktop:** Shows a drag-and-drop zone for selecting a card image file.

### Live Camera tab
Uses the browser's WebRTC `getUserMedia` API to stream the camera directly into a `<video>` element — no button click required to see the feed. A "Capture" button snaps a frame, converts it to JPEG via `<canvas>`, and posts it to the scan API.

**Works on MacBook Pro:** The built-in FaceTime camera is used. The browser will prompt for camera permission on first use. Tested in Chrome, Safari, and Firefox on macOS.

**Key files:**
- `src/components/appraise/LiveCameraPanel.tsx` — live camera component (getUserMedia, capture, cleanup on unmount)
- `src/components/appraise/UploadPanel.tsx` — original file-input/drag-drop flow
- `src/hooks/useAppraisal.ts` — shared scan state; exposes `handleFileChange` (for file inputs) and `handleFileDirect` (for direct File objects from LiveCameraPanel)

