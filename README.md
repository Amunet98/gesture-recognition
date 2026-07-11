# Hand Gesture Recognition

[![Live Demo](https://img.shields.io/badge/Live%20Demo-vercel.app-facc15)](https://gesture-recognition-ten.vercel.app)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-0097a7?logo=google&logoColor=white)](https://ai.google.dev/edge/mediapipe)

Real-time hand gesture recognition running **entirely in the browser** — no
backend, no uploads, video never leaves the device.

**Live demo:** https://gesture-recognition-ten.vercel.app

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
