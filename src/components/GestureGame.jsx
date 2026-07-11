import { useEffect, useRef, useState } from 'react';
import { GESTURES } from './GestureDemo.jsx';

const ROUND_SECONDS = 30;
const BEST_KEY = 'gesture-game-best';

const randomTarget = (exclude) => {
  const pool = Object.keys(GESTURES).filter((g) => g !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
};

// "Simon says" round: match as many prompted gestures as you can in 30s.
const GestureGame = ({ stableGesture }) => {
  const [phase, setPhase] = useState('idle'); // idle | playing | done
  const [target, setTarget] = useState(null);
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef();

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setPhase('done');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Score when the debounced gesture matches the prompt. The next target is
  // always different from the one just matched, so keeping your hand still
  // can't double-score.
  useEffect(() => {
    if (phase !== 'playing' || !target || stableGesture !== target) return;
    setScore((s) => s + 1);
    setTarget(randomTarget(target));
    setFlash(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 400);
  }, [stableGesture, target, phase]);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  useEffect(() => {
    if (phase === 'done' && score > best) {
      setBest(score);
      localStorage.setItem(BEST_KEY, String(score));
    }
  }, [phase, score, best]);

  const start = () => {
    setScore(0);
    setSecondsLeft(ROUND_SECONDS);
    setTarget(randomTarget(null));
    setPhase('playing');
  };

  return (
    <div className="mt-6 w-full max-w-2xl p-5 rounded-2xl bg-[#1f2028] text-center">
      <h2 className="font-bold text-xl">Gesture Match</h2>

      {phase === 'idle' && (
        <>
          <p className="mt-2 text-sm opacity-70">
            Match as many gestures as you can in {ROUND_SECONDS} seconds.
            {best > 0 && <span className="block mt-1 font-mono">Best: {best}</span>}
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-4 px-6 py-2 rounded-xl font-bold text-red-400 bg-red-500/15 border border-red-500/40 hover:bg-red-500/25"
          >
            Start
          </button>
        </>
      )}

      {phase === 'playing' && (
        <>
          <div className="mt-2 flex justify-center gap-8 font-mono text-sm">
            <span>⏱ {secondsLeft}s</span>
            <span>Score: {score}</span>
          </div>
          <div className="mt-3 text-sm opacity-70">Show me&hellip;</div>
          <div
            className={`text-7xl mt-2 transition-transform duration-200 ${flash ? 'scale-125' : ''}`}
          >
            {GESTURES[target].emoji}
          </div>
          <div className="mt-2 font-mono font-bold text-red-400">
            {GESTURES[target].label}
          </div>
        </>
      )}

      {phase === 'done' && (
        <>
          <div className="mt-3 text-5xl font-bold">{score}</div>
          <p className="mt-1 text-sm opacity-70">
            {score >= best && score > 0 ? 'New best! 🎉' : `Best: ${best}`}
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-4 px-6 py-2 rounded-xl font-bold text-red-400 bg-red-500/15 border border-red-500/40 hover:bg-red-500/25"
          >
            Play again
          </button>
        </>
      )}
    </div>
  );
};

export default GestureGame;
