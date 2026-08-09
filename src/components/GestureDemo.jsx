import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer, DrawingUtils } from '@mediapipe/tasks-vision';
import { SwitchCamera } from 'lucide-react';
import GestureGame from './GestureGame.jsx';
import RockPaperScissors from './RockPaperScissors.jsx';

export const GESTURES = {
  Closed_Fist: { emoji: '✊', label: 'Fist' },
  Open_Palm: { emoji: '🖐️', label: 'Open Palm' },
  Pointing_Up: { emoji: '☝️', label: 'Pointing Up' },
  Thumb_Down: { emoji: '👎', label: 'Thumbs Down' },
  Thumb_Up: { emoji: '👍', label: 'Thumbs Up' },
  Victory: { emoji: '✌️', label: 'Victory' },
  ILoveYou: { emoji: '🤟', label: 'I Love You (ASL)' },
};

// A gesture only counts once the model reports the same label for this many
// consecutive frames - filters out single-frame flickers between poses.
const STABLE_FRAMES = 6;
const MIN_SCORE = 0.5;

const GestureDemo = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();
  const recognizerRef = useRef();
  const rafRef = useRef();
  const stabilityRef = useRef({ name: null, frames: 0 });

  const [status, setStatus] = useState('loading'); // loading | ready | no-camera | error
  const [facingMode, setFacingMode] = useState('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [current, setCurrent] = useState(null); // { name, score } - raw per-frame reading
  const [stableGesture, setStableGesture] = useState(null); // name, after STABLE_FRAMES
  const [game, setGame] = useState('match'); // match | rps

  // Load the model once. WASM runtime and .task model are self-hosted in
  // /public so the demo has no runtime CDN dependency.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks('wasm');
        const recognizer = await GestureRecognizer.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: 'models/gesture_recognizer.task', delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
        });
        if (cancelled) {
          recognizer.close();
          return;
        }
        recognizerRef.current = recognizer;
        setStatus((s) => (s === 'loading' ? 'ready' : s));
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      recognizerRef.current?.close();
      recognizerRef.current = null;
    };
  }, []);

  // Camera, with front/back switching. Old stream is stopped before
  // requesting the other lens - phones can't open both at once.
  useEffect(() => {
    let cancelled = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    navigator.mediaDevices?.getUserMedia?.({ video: { facingMode: { ideal: facingMode } } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        navigator.mediaDevices.enumerateDevices()
          .then((devices) => {
            if (!cancelled) {
              setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1);
            }
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setStatus('no-camera');
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode]);

  // Recognition loop: classify each video frame, draw the hand skeleton on
  // the overlay canvas, and debounce the label into stableGesture.
  useEffect(() => {
    if (status !== 'ready') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const drawer = new DrawingUtils(ctx);
    let lastVideoTime = -1;

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const video = videoRef.current;
      const recognizer = recognizerRef.current;
      if (!video || !recognizer || video.readyState < 2) return;
      if (video.currentTime === lastVideoTime) return; // no new frame yet
      lastVideoTime = video.currentTime;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const result = recognizer.recognizeForVideo(video, performance.now());
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const landmarks of result.landmarks) {
        drawer.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
          color: '#f87171', lineWidth: 3,
        });
        drawer.drawLandmarks(landmarks, { color: '#fecaca', lineWidth: 1, radius: 4 });
      }

      const top = result.gestures[0]?.[0];
      const name = top && top.categoryName !== 'None' && top.score >= MIN_SCORE
        ? top.categoryName
        : null;
      setCurrent(name ? { name, score: top.score } : null);

      const st = stabilityRef.current;
      st.frames = name && name === st.name ? st.frames + 1 : 0;
      st.name = name;
      setStableGesture(st.frames >= STABLE_FRAMES ? name : null);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status]);

  if (status === 'error') {
    return (
      <div className="text-center p-8 rounded-2xl bg-surface border border-line">
        Could not load the gesture model. Check your connection and refresh.
      </div>
    );
  }
  if (status === 'no-camera') {
    return (
      <div className="text-center p-8 rounded-2xl bg-surface border border-line">
        Camera unavailable or permission denied. This demo needs a camera -
        allow access and refresh the page.
      </div>
    );
  }

  const info = current ? GESTURES[current.name] : null;

  return (
    <div className="flex flex-col items-center">
      {/* Mirror only the front-camera preview (like native camera apps).
          Canvas overlay lives inside the same flipped container so the
          skeleton stays aligned with the hand. */}
      <div
        className={`relative w-full max-w-2xl ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="rounded-2xl w-full block aspect-[4/3] object-cover bg-canvas"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 text-gray-100 font-mono text-sm scale-x-[-1]">
            Loading hand-tracking model&hellip;
          </div>
        )}
        {hasMultipleCameras && (
          <button
            type="button"
            onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
            className="absolute bottom-3 right-3 grid place-items-center w-11 h-11 rounded-full bg-black/50 text-white backdrop-blur-sm cursor-pointer"
            aria-label="Switch camera"
            title="Switch camera"
          >
            <SwitchCamera size={20} aria-hidden />
          </button>
        )}
      </div>

      {/* The gesture emoji is the reading itself - it shows the hand shape the
          model matched - so it stays an emoji rather than becoming an icon. */}
      <div className="mt-5 w-full max-w-2xl flex items-center justify-center gap-4 p-4 rounded-2xl bg-surface border border-line">
        <span className="text-5xl w-16 shrink-0 text-center">{info ? info.emoji : '—'}</span>
        {/* Fluid rather than a fixed w-48: at 360px the fixed width plus the
            emoji column overflowed the card. */}
        <div className="w-full max-w-48">
          <div className="font-mono font-bold text-lg">
            {info ? info.label : 'Show a hand…'}
          </div>
          <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-accent transition-[width] duration-150"
              style={{ width: `${current ? Math.round(current.score * 100) : 0}%` }}
            />
          </div>
          <div className="mt-1 text-xs font-mono opacity-60">
            {current ? `${Math.round(current.score * 100)}% confidence` : 'no gesture detected'}
          </div>
        </div>
      </div>

      {/* flex-wrap matters here: "Rock · Paper · Scissors" is long enough that
          the two tabs overflow a 360px phone on one line. */}
      <div className="mt-6 flex flex-wrap justify-center gap-2 px-2" role="tablist" aria-label="Games">
        {[
          ['match', 'Gesture Match'],
          ['rps', 'Rock · Paper · Scissors'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={game === id}
            onClick={() => setGame(id)}
            className={`px-4 min-h-11 rounded-xl font-mono text-sm font-bold cursor-pointer transition-colors motion-reduce:transition-none ${
              game === id
                ? 'bg-accent/20 text-accent border border-accent/50'
                : 'bg-surface border border-line text-gray-600 hover:bg-muted dark:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {game === 'match' ? (
        <GestureGame stableGesture={stableGesture} />
      ) : (
        <RockPaperScissors stableGesture={stableGesture} />
      )}
    </div>
  );
};

export default GestureDemo;
