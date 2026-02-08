import { useState, useEffect, useRef, useCallback } from "react";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // Show warning 5 min before timeout

/**
 * Tracks user activity and triggers idle/warning callbacks.
 * During the warning period, only an explicit "Stay Logged In" click resets the timer.
 *
 * @param {Object} options
 * @param {() => void} options.onIdle - Called when the idle timeout expires
 * @param {number} [options.timeout=1800000] - Total idle timeout in ms (default 30 min)
 * @param {number} [options.warningThreshold=300000] - Show warning this many ms before timeout (default 5 min)
 * @returns {{ showWarning: boolean, secondsRemaining: number, stayLoggedIn: () => void }}
 */
export const useIdleTimer = ({
  onIdle,
  timeout = IDLE_TIMEOUT_MS,
  warningThreshold = WARNING_THRESHOLD_MS,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const onIdleRef = useRef(onIdle);
  const showWarningRef = useRef(false);
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownRef = useRef(null);

  // Keep callback ref current without re-creating timers
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const clearAllTimers = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);
    clearInterval(countdownRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    showWarningRef.current = false;
    setShowWarning(false);
    clearAllTimers();

    // Schedule warning
    warningTimerRef.current = setTimeout(() => {
      showWarningRef.current = true;
      setShowWarning(true);
      setSecondsRemaining(Math.ceil(warningThreshold / 1000));

      countdownRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, timeout - warningThreshold);

    // Schedule actual idle logout
    idleTimerRef.current = setTimeout(() => {
      clearAllTimers();
      onIdleRef.current?.();
    }, timeout);
  }, [timeout, warningThreshold, clearAllTimers]);

  // Attach activity listeners
  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      // Only auto-reset while warning is NOT showing.
      // If warning is visible, user must click "Stay Logged In".
      if (!showWarningRef.current) {
        resetTimer();
      }
    };

    events.forEach((event) =>
      document.addEventListener(event, handleActivity, { passive: true }),
    );

    resetTimer();

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, handleActivity),
      );
      clearAllTimers();
    };
  }, [resetTimer, clearAllTimers]);

  /** Manually dismiss the warning and reset the full timer */
  const stayLoggedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return { showWarning, secondsRemaining, stayLoggedIn };
};
