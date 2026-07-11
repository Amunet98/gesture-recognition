import { useEffect, useRef, useState } from 'react';

const MOVES = {
  Closed_Fist: { emoji: '✊', label: 'Rock', beats: 'Victory' },
  Open_Palm: { emoji: '🖐️', label: 'Paper', beats: 'Closed_Fist' },
  Victory: { emoji: '✌️', label: 'Scissors', beats: 'Open_Palm' },
};

const COUNTDOWN_MS = 700;
// How long after "Show!" the player has to form a recognizable move.
const CAPTURE_WINDOW_MS = 2500;

const RockPaperScissors = ({ stableGesture }) => {
  const [phase, setPhase] = useState('idle'); // idle | countdown | capture | reveal | miss
  const [count, setCount] = useState(3);
  const [playerMove, setPlayerMove] = useState(null);
  const [cpuMove, setCpuMove] = useState(null);
  const [scores, setScores] = useState({ player: 0, cpu: 0, draws: 0 });
  const captureTimer = useRef();

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      setPhase('capture');
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), COUNTDOWN_MS);
    return () => clearTimeout(t);
  }, [phase, count]);

  // Capture: first stable rock/paper/scissors inside the window plays the
  // round; other gestures (thumbs up etc.) are ignored rather than penalized.
  useEffect(() => {
    if (phase !== 'capture') return;
    if (stableGesture && MOVES[stableGesture]) {
      clearTimeout(captureTimer.current);
      const cpuKeys = Object.keys(MOVES);
      const cpu = cpuKeys[Math.floor(Math.random() * cpuKeys.length)];
      setPlayerMove(stableGesture);
      setCpuMove(cpu);
      setScores((s) => {
        if (stableGesture === cpu) return { ...s, draws: s.draws + 1 };
        if (MOVES[stableGesture].beats === cpu) return { ...s, player: s.player + 1 };
        return { ...s, cpu: s.cpu + 1 };
      });
      setPhase('reveal');
    }
  }, [phase, stableGesture]);

  useEffect(() => {
    if (phase !== 'capture') return;
    captureTimer.current = setTimeout(() => setPhase('miss'), CAPTURE_WINDOW_MS);
    return () => clearTimeout(captureTimer.current);
  }, [phase]);

  const play = () => {
    setPlayerMove(null);
    setCpuMove(null);
    setCount(3);
    setPhase('countdown');
  };

  const result =
    phase === 'reveal' && playerMove && cpuMove
      ? playerMove === cpuMove
        ? 'Draw!'
        : MOVES[playerMove].beats === cpuMove
          ? 'You win! 🎉'
          : 'Computer wins 🤖'
      : null;

  return (
    <div className="mt-6 w-full max-w-2xl p-5 rounded-2xl bg-[#1f2028] text-center">
      <h2 className="font-bold text-xl">Rock · Paper · Scissors</h2>
      <div className="mt-2 flex justify-center gap-6 font-mono text-sm">
        <span>You: {scores.player}</span>
        <span>Draws: {scores.draws}</span>
        <span>CPU: {scores.cpu}</span>
      </div>

      {phase === 'idle' && (
        <>
          <p className="mt-3 text-sm opacity-70">
            ✊ rock · 🖐️ paper · ✌️ scissors — show your move to the camera
            when the countdown hits zero.
          </p>
          <button
            type="button"
            onClick={play}
            className="mt-4 px-6 py-2 rounded-xl font-bold text-red-400 bg-red-500/15 border border-red-500/40 hover:bg-red-500/25"
          >
            Play
          </button>
        </>
      )}

      {phase === 'countdown' && (
        <div className="mt-4 text-6xl font-bold font-mono">{count}</div>
      )}

      {phase === 'capture' && (
        <div className="mt-4 text-3xl font-bold text-red-400 animate-pulse">
          Show! ✊🖐️✌️
        </div>
      )}

      {phase === 'reveal' && (
        <>
          <div className="mt-4 flex items-center justify-center gap-6 text-5xl">
            <div>
              {MOVES[playerMove].emoji}
              <div className="text-xs font-mono mt-1 opacity-60">you</div>
            </div>
            <span className="text-2xl font-mono opacity-60">vs</span>
            <div>
              {MOVES[cpuMove].emoji}
              <div className="text-xs font-mono mt-1 opacity-60">cpu</div>
            </div>
          </div>
          <div className="mt-3 font-bold text-lg">{result}</div>
          <button
            type="button"
            onClick={play}
            className="mt-3 px-6 py-2 rounded-xl font-bold text-red-400 bg-red-500/15 border border-red-500/40 hover:bg-red-500/25"
          >
            Play again
          </button>
        </>
      )}

      {phase === 'miss' && (
        <>
          <p className="mt-4 text-sm opacity-70">
            Didn&apos;t catch a move — hold your ✊ 🖐️ or ✌️ clearly in frame.
          </p>
          <button
            type="button"
            onClick={play}
            className="mt-3 px-6 py-2 rounded-xl font-bold text-red-400 bg-red-500/15 border border-red-500/40 hover:bg-red-500/25"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
};

export default RockPaperScissors;
