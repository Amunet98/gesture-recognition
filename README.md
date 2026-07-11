# Hand Gesture Recognition

Real-time hand gesture recognition running **entirely in the browser** — no
backend, no uploads, video never leaves the device.

**Live demo:** _(coming soon)_

## How it works

1. [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)
   tracks 21 hand landmarks per frame via a WASM runtime (GPU-delegated when
   available).
2. A bundled gesture classifier maps the landmark geometry to 7 gestures:
   ✊ 🖐️ ☝️ 👎 👍 ✌️ 🤟 (the last one is the ASL "I love you" sign).
3. Labels are debounced over consecutive frames to filter out flicker between
   hand poses.
4. **Gesture Match** mini-game: match as many prompted gestures as you can in
   30 seconds; best score is kept in localStorage.

The WASM runtime and the `.task` model are self-hosted in `public/`, so the
deployed demo has no runtime CDN dependency. On phones you can flip between
front and back cameras; the front-camera preview is mirrored like native
camera apps (classification runs on the unmirrored frames).

## Stack

React 19 · Vite · Tailwind CSS v4 · @mediapipe/tasks-vision

## Run locally

```bash
npm install
npm run dev
```

Requires a camera and a browser with WebGL/WASM support (any modern one).
