import GestureDemo from './components/GestureDemo.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';

function App() {
  return (
    // min-h-dvh, not min-h-screen: 100vh sits under mobile browser chrome and
    // leaves the page scrollable by the height of the address bar.
    <div className="min-h-dvh bg-bg text-gray-900 dark:text-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-4">
          <ThemeToggle />
        </div>
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">
            Hand Gesture Recognition
          </h1>
          <p className="mt-3 text-sm sm:text-base opacity-70 max-w-xl mx-auto">
            Real-time hand tracking and gesture classification running entirely
            in your browser. No server, no uploads &mdash; video never leaves
            your device.
          </p>
        </header>

        <GestureDemo />

        <footer className="text-center text-xs font-mono opacity-50 mt-12 pb-4">
          Built with MediaPipe hand landmarks &middot; 21 keypoints tracked per
          hand, classified on-device
        </footer>
      </div>
    </div>
  );
}

export default App;
