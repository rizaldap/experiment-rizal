"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// ============================================
// LOCK CONFIGURATION
// ============================================
const UNLOCK_DATE = new Date("2025-12-28T00:00:00+07:00"); // December 28, 2025 00:00:00 WIB
const SECRET_PASSWORD = "rizalloveara";

// ============================================
// ADJUSTABLE SNAP POSITIONS - Edit these values!
// ============================================
const SNAP_POSITIONS = {
  glasses: { top: "18%", left: "50%", transform: "translateX(-50%)" },
  shoes: { top: "85%", left: "50%", transform: "translateX(-50%)" },
};

// Item sizes (adjust as needed)
const ITEM_SIZES = {
  glasses: { width: 60, height: 30 },
  shoes: { width: 80, height: 40 },
};

// Asset paths
const ASSETS = {
  idle: "/assets/birthdayAra2025/girl-idle.png",
  withGlasses: "/assets/birthdayAra2025/withGlasses.png",
  withShoes: "/assets/birthdayAra2025/withShoes.png",
  happy: "/assets/birthdayAra2025/girl-happy.png",
  glasses: "/assets/birthdayAra2025/glasses.png",
  shoes: "/assets/birthdayAra2025/shoes.png",
  background: "/assets/birthdayAra2025/bedroom-bg.png",
  surpriseClose: "/assets/birthdayAra2025/surpriseBoxClose.png",
  surpriseOpen: "/assets/birthdayAra2025/surpriseBoxOpen.png",
};

// Pre-defined sparkle positions (fixed to avoid hydration mismatch)
const SPARKLE_POSITIONS = [
  { left: 10, top: 15, duration: 2.5, delay: 0.1 },
  { left: 25, top: 80, duration: 3.2, delay: 0.3 },
  { left: 45, top: 25, duration: 2.8, delay: 0.5 },
  { left: 70, top: 60, duration: 3.5, delay: 0.2 },
  { left: 85, top: 30, duration: 2.2, delay: 0.7 },
  { left: 15, top: 50, duration: 3.0, delay: 0.4 },
  { left: 55, top: 75, duration: 2.6, delay: 0.6 },
  { left: 30, top: 40, duration: 3.3, delay: 0.8 },
  { left: 60, top: 10, duration: 2.4, delay: 0.2 },
  { left: 90, top: 85, duration: 3.1, delay: 0.5 },
  { left: 5, top: 70, duration: 2.9, delay: 0.3 },
  { left: 40, top: 55, duration: 3.4, delay: 0.1 },
  { left: 75, top: 20, duration: 2.7, delay: 0.6 },
  { left: 20, top: 90, duration: 3.0, delay: 0.4 },
  { left: 50, top: 45, duration: 2.3, delay: 0.7 },
  { left: 80, top: 65, duration: 3.2, delay: 0.2 },
  { left: 35, top: 5, duration: 2.5, delay: 0.5 },
  { left: 65, top: 35, duration: 3.1, delay: 0.3 },
  { left: 95, top: 50, duration: 2.8, delay: 0.8 },
  { left: 12, top: 22, duration: 3.3, delay: 0.1 },
];

type GamePhase = "locked" | "intro" | "opening" | "game" | "celebration";

// Countdown timer interface
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// ============================================
// SOUND EFFECTS - 8-bit style using Web Audio API
// ============================================
const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Play a simple beep/tone
  const playTone = (frequency: number, duration: number, type: OscillatorType = "square", volume = 0.3) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  // Hover sound - short high beep
  const playHover = () => playTone(800, 0.05, "square", 0.15);

  // Pickup/drag sound - rising pitch
  const playPickup = () => {
    playTone(400, 0.1, "square", 0.2);
    setTimeout(() => playTone(600, 0.1, "square", 0.2), 50);
  };

  // Equip success sound - two note chime
  const playEquip = () => {
    playTone(523, 0.15, "square", 0.25); // C5
    setTimeout(() => playTone(784, 0.2, "square", 0.25), 100); // G5
  };

  // Victory fanfare - multiple notes
  const playVictory = () => {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, "square", 0.3), i * 150);
    });
  };

  // Box open sound - descending sweep
  const playBoxOpen = () => {
    playTone(1000, 0.1, "sawtooth", 0.2);
    setTimeout(() => playTone(800, 0.1, "sawtooth", 0.2), 50);
    setTimeout(() => playTone(600, 0.15, "sawtooth", 0.2), 100);
  };

  // Background music refs
  const bgMusicRef = useRef<{ stop: () => void } | null>(null);

  // GAME MUSIC - Cute retro game loop
  const startGameMusic = () => {
    if (bgMusicRef.current) return;

    try {
      const ctx = getAudioContext();
      let isPlaying = true;

      // Cute game-style melody loop
      const gameMelody = [
        { freq: 523, dur: 0.15 }, // C5
        { freq: 587, dur: 0.15 }, // D5
        { freq: 659, dur: 0.15 }, // E5
        { freq: 523, dur: 0.15 }, // C5
        { freq: 0, dur: 0.1 },
        { freq: 659, dur: 0.15 }, // E5
        { freq: 698, dur: 0.15 }, // F5
        { freq: 784, dur: 0.3 },  // G5
        { freq: 0, dur: 0.1 },
        { freq: 784, dur: 0.15 }, // G5
        { freq: 698, dur: 0.15 }, // F5
        { freq: 659, dur: 0.15 }, // E5
        { freq: 587, dur: 0.15 }, // D5
        { freq: 0, dur: 0.1 },
        { freq: 523, dur: 0.15 }, // C5
        { freq: 392, dur: 0.15 }, // G4
        { freq: 523, dur: 0.3 },  // C5
        { freq: 0, dur: 0.2 },
      ];

      const playLoop = () => {
        if (!isPlaying) return;

        let time = ctx.currentTime;
        gameMelody.forEach((note) => {
          if (note.freq > 0) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "square";
            osc.frequency.setValueAtTime(note.freq, time);
            gain.gain.setValueAtTime(0.06, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + note.dur * 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + note.dur);
          }
          time += note.dur;
        });

        const totalDuration = gameMelody.reduce((sum, n) => sum + n.dur, 0) * 1000;
        setTimeout(() => {
          if (isPlaying) playLoop();
        }, totalDuration);
      };

      playLoop();

      bgMusicRef.current = {
        stop: () => {
          isPlaying = false;
          bgMusicRef.current = null;
        },
      };
    } catch (e) {
      console.log("Game music not supported");
    }
  };

  // HAPPY BIRTHDAY - Plays once on victory, then calls onComplete
  const playHappyBirthday = (onComplete: () => void) => {
    try {
      const ctx = getAudioContext();

      // Full Happy Birthday melody
      const melody = [
        // Line 1
        { freq: 392, dur: 0.25 }, { freq: 392, dur: 0.25 },
        { freq: 440, dur: 0.5 }, { freq: 392, dur: 0.5 },
        { freq: 523, dur: 0.5 }, { freq: 494, dur: 1.0 },
        { freq: 0, dur: 0.25 },
        // Line 2
        { freq: 392, dur: 0.25 }, { freq: 392, dur: 0.25 },
        { freq: 440, dur: 0.5 }, { freq: 392, dur: 0.5 },
        { freq: 587, dur: 0.5 }, { freq: 523, dur: 1.0 },
        { freq: 0, dur: 0.25 },
        // Line 3: "Happy birthday dear Farah"
        { freq: 392, dur: 0.25 }, { freq: 392, dur: 0.25 },
        { freq: 784, dur: 0.5 }, { freq: 659, dur: 0.5 },
        { freq: 523, dur: 0.5 }, { freq: 494, dur: 0.5 },
        { freq: 440, dur: 1.0 },
        { freq: 0, dur: 0.25 },
        // Line 4
        { freq: 698, dur: 0.25 }, { freq: 698, dur: 0.25 },
        { freq: 659, dur: 0.5 }, { freq: 523, dur: 0.5 },
        { freq: 587, dur: 0.5 }, { freq: 523, dur: 1.5 },
      ];

      let time = ctx.currentTime;
      melody.forEach((note) => {
        if (note.freq > 0) {
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = "square";
          osc1.frequency.setValueAtTime(note.freq, time);
          gain1.gain.setValueAtTime(0.12, time);
          gain1.gain.exponentialRampToValueAtTime(0.02, time + note.dur * 0.85);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(time);
          osc1.stop(time + note.dur);

          // Harmony
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "triangle";
          osc2.frequency.setValueAtTime(note.freq / 2, time);
          gain2.gain.setValueAtTime(0.06, time);
          gain2.gain.exponentialRampToValueAtTime(0.01, time + note.dur * 0.9);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(time);
          osc2.stop(time + note.dur);
        }
        time += note.dur;
      });

      // Call onComplete after song finishes
      const totalDuration = melody.reduce((sum, n) => sum + n.dur, 0) * 1000;
      setTimeout(onComplete, totalDuration + 500);
    } catch (e) {
      console.log("Happy birthday not supported");
      setTimeout(onComplete, 1000);
    }
  };

  const stopGameMusic = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.stop();
    }
  };

  return { playHover, playPickup, playEquip, playVictory, playBoxOpen, startGameMusic, stopGameMusic, playHappyBirthday };
};

export default function BirthdayMakeoverGame() {
  // Sound effects
  const { playHover, playPickup, playEquip, playVictory, playBoxOpen, startGameMusic, stopGameMusic, playHappyBirthday } = useSoundEffects();

  // Lock screen state
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Calculate time remaining
  const calculateTimeLeft = useCallback((): TimeLeft => {
    const now = new Date();
    const difference = UNLOCK_DATE.getTime() - now.getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  }, []);

  // Check if unlock date has passed and setup countdown timer
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      if (now >= UNLOCK_DATE) {
        setIsTimeUp(true);
        setGamePhase("intro");
      } else {
        setTimeLeft(calculateTimeLeft());
      }
    };

    // Initial check
    checkTime();

    // Update every second
    const timer = setInterval(checkTime, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  // Handle password submission
  const handlePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log("Submitted password:", passwordInput, "Expected:", SECRET_PASSWORD);
    if (passwordInput.toLowerCase().trim() === SECRET_PASSWORD) {
      console.log("Password correct! Unlocking...");
      playEquip();
      setGamePhase("intro");
    } else {
      console.log("Wrong password!");
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 1500);
    }
  };

  // Game phase - starts as locked
  const [gamePhase, setGamePhase] = useState<GamePhase>("locked");

  // State management
  const [isGlassesEquipped, setIsGlassesEquipped] = useState(false);
  const [isShoesEquipped, setIsShoesEquipped] = useState(false);
  const [isWinTriggered, setIsWinTriggered] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // Refs
  const roomRef = useRef<HTMLDivElement>(null);

  // Get character image based on equipped items
  const getCharacterImage = () => {
    if (showCelebration) return ASSETS.happy;
    if (isGlassesEquipped && isShoesEquipped) return ASSETS.happy;
    if (isGlassesEquipped) return ASSETS.withGlasses;
    if (isShoesEquipped) return ASSETS.withShoes;
    return ASSETS.idle;
  };

  // Handle intro click
  const handleIntroClick = () => {
    if (gamePhase === "intro") {
      playBoxOpen(); // Play box open sound
      startGameMusic(); // Start game background music
      setGamePhase("opening");
      // Wait for box opening animation, then start game
      setTimeout(() => {
        setGamePhase("game");
      }, 1500);
    }
  };

  // Check win condition
  useEffect(() => {
    if (isGlassesEquipped && isShoesEquipped && !isWinTriggered) {
      setIsWinTriggered(true);

      // Stop game music
      stopGameMusic();

      // Win sequence - flash
      setTimeout(() => {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 200);
      }, 500);

      // Show celebration
      setTimeout(() => {
        setShowCelebration(true);
        setGamePhase("celebration");

        // Play Happy Birthday, then show video after song finishes
        playHappyBirthday(() => {
          setShowVideo(true);
        });
      }, 700);
    }
  }, [isGlassesEquipped, isShoesEquipped, isWinTriggered, stopGameMusic, playHappyBirthday]);

  // Handle drop logic - more forgiving detection
  const handleDragEnd = (
    item: "glasses" | "shoes",
    info: { point: { x: number; y: number } }
  ) => {
    if (!roomRef.current) return;

    const roomRect = roomRef.current.getBoundingClientRect();
    const { x, y } = info.point;

    // Check if dropped anywhere on the left half of screen (room area)
    if (x <= window.innerWidth / 2 + 100) {
      playEquip(); // Play equip sound
      if (item === "glasses") {
        setIsGlassesEquipped(true);
      } else {
        setIsShoesEquipped(true);
      }
    }
  };

  // Reset game
  const resetGame = () => {
    stopGameMusic(); // Stop music
    setGamePhase("intro");
    setIsGlassesEquipped(false);
    setIsShoesEquipped(false);
    setIsWinTriggered(false);
    setShowCelebration(false);
    setShowVideo(false);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-mono">
      {/* Retro scanlines overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
        }}
      />

      {/* Flash effect */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-white"
          />
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* LOCK SCREEN - Countdown Timer */}
      {/* ============================================ */}
      <AnimatePresence>
        {gamePhase === "locked" && !isTimeUp && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.5 }}
          >
            {/* Retro grid background */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(138, 43, 226, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(138, 43, 226, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />

            {/* Floating pixel stars */}
            {SPARKLE_POSITIONS.map((sparkle, i) => (
              <motion.div
                key={`lock-sparkle-${i}`}
                className="absolute h-2 w-2"
                style={{
                  left: `${sparkle.left}%`,
                  top: `${sparkle.top}%`,
                  backgroundColor: i % 2 === 0 ? "#a855f7" : "#ec4899",
                  boxShadow: `0 0 10px ${i % 2 === 0 ? "#a855f7" : "#ec4899"}`,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: sparkle.duration,
                  repeat: Infinity,
                  delay: sparkle.delay,
                }}
              />
            ))}

            {/* Lock Icon - 16-bit style */}
            <motion.div
              className="relative z-10 mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <div className="relative">
                {/* Lock body */}
                <div className="h-20 w-24 rounded-sm border-4 border-purple-400 bg-purple-600 shadow-lg shadow-purple-500/50">
                  {/* Keyhole */}
                  <div className="mx-auto mt-4 h-4 w-4 rounded-full bg-purple-900" />
                  <div className="mx-auto h-6 w-2 bg-purple-900" />
                </div>
                {/* Lock shackle */}
                <div className="absolute -top-8 left-1/2 h-10 w-16 -translate-x-1/2 rounded-t-full border-4 border-b-0 border-purple-400 bg-transparent" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              className="relative z-10 mb-2 text-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h1
                className="text-3xl font-bold tracking-wider text-purple-300 md:text-4xl"
                style={{
                  textShadow: "0 0 20px rgba(168, 85, 247, 0.8), 4px 4px 0 #1a1a2e",
                  fontFamily: "monospace",
                }}
              >
                🔒 LOCKED 🔒
              </h1>
              <p className="mt-2 text-sm text-purple-400/80">
                A surprise is being prepared...
              </p>
            </motion.div>

            {/* Countdown Timer */}
            <motion.div
              className="relative z-10 my-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex gap-4">
                {/* Days */}
                <div className="flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border-4 border-pink-500/50 bg-pink-900/50 shadow-lg shadow-pink-500/30">
                    <span
                      className="text-4xl font-bold text-pink-300"
                      style={{ fontFamily: "monospace" }}
                    >
                      {String(timeLeft.days).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="mt-2 text-xs text-pink-400">DAYS</span>
                </div>

                <span className="flex items-center text-3xl text-purple-400">:</span>

                {/* Hours */}
                <div className="flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border-4 border-purple-500/50 bg-purple-900/50 shadow-lg shadow-purple-500/30">
                    <span
                      className="text-4xl font-bold text-purple-300"
                      style={{ fontFamily: "monospace" }}
                    >
                      {String(timeLeft.hours).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="mt-2 text-xs text-purple-400">HOURS</span>
                </div>

                <span className="flex items-center text-3xl text-purple-400">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border-4 border-blue-500/50 bg-blue-900/50 shadow-lg shadow-blue-500/30">
                    <span
                      className="text-4xl font-bold text-blue-300"
                      style={{ fontFamily: "monospace" }}
                    >
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="mt-2 text-xs text-blue-400">MINUTES</span>
                </div>

                <span className="flex items-center text-3xl text-purple-400">:</span>

                {/* Seconds */}
                <motion.div
                  className="flex flex-col items-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border-4 border-cyan-500/50 bg-cyan-900/50 shadow-lg shadow-cyan-500/30">
                    <span
                      className="text-4xl font-bold text-cyan-300"
                      style={{ fontFamily: "monospace" }}
                    >
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="mt-2 text-xs text-cyan-400">SECONDS</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Unlock Date Info */}
            <motion.p
              className="relative z-10 mb-8 text-center text-sm text-purple-400/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Unlocks on December 28, 2025 at 00:00 WIB
            </motion.p>

            {/* Password Form */}
            <motion.form
              onSubmit={handlePasswordSubmit}
              className="relative z-10 flex flex-col items-center gap-4"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-sm text-purple-300">
                🔑 Or enter the secret password:
              </p>
              <div className="flex gap-2">
                <motion.input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password..."
                  className="w-48 rounded-lg border-4 border-purple-600/50 bg-purple-950/50 px-4 py-3 text-center font-mono text-purple-200 placeholder-purple-600 outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/30"
                  animate={passwordError ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                />
                <motion.button
                  type="submit"
                  onClick={() => handlePasswordSubmit()}
                  className="rounded-lg border-4 border-pink-500/50 bg-pink-600 px-6 py-3 font-bold text-white transition-all hover:bg-pink-500"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🎁
                </motion.button>
              </div>
              {passwordError && (
                <motion.p
                  className="text-sm text-red-400"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  ❌ Wrong password! Try again~
                </motion.p>
              )}
            </motion.form>

            {/* Pixel art decoration - bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-purple-900/50">
              <div className="flex h-full w-full">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={`pixel-${i}`}
                    className="h-full flex-1"
                    style={{
                      backgroundColor: i % 2 === 0 ? "#4c1d95" : "#581c87",
                    }}
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* INTRO SCREEN - Dreamy Pixel Art Background */}
      {/* ============================================ */}
      <AnimatePresence>
        {(gamePhase === "intro" || gamePhase === "opening") && (
          <motion.div
            className="fixed inset-0 z-30 flex cursor-pointer flex-col items-center justify-center overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #E8D5F2 0%, #F5E6E8 30%, #FFE4EC 60%, #FFECD2 100%)",
            }}
            onClick={handleIntroClick}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            {/* ===== PIXEL CLOUDS ===== */}
            {/* Cloud 1 - Large left */}
            <motion.div
              className="absolute"
              style={{ left: "5%", top: "15%" }}
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex gap-1">
                <div className="h-6 w-6 rounded-sm bg-white/90 shadow-lg" />
                <div className="h-8 w-8 rounded-sm bg-white shadow-lg" />
                <div className="h-10 w-10 rounded-sm bg-white shadow-lg" />
                <div className="h-8 w-8 rounded-sm bg-white shadow-lg" />
                <div className="h-6 w-6 rounded-sm bg-white/90 shadow-lg" />
              </div>
              <div className="ml-2 flex gap-1">
                <div className="h-6 w-8 rounded-sm bg-white/80 shadow-lg" />
                <div className="h-6 w-10 rounded-sm bg-white/90 shadow-lg" />
                <div className="h-6 w-8 rounded-sm bg-white/80 shadow-lg" />
              </div>
            </motion.div>

            {/* Cloud 2 - Medium right */}
            <motion.div
              className="absolute"
              style={{ right: "10%", top: "20%" }}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="flex gap-1">
                <div className="h-5 w-5 rounded-sm bg-white/90 shadow-lg" />
                <div className="h-7 w-7 rounded-sm bg-white shadow-lg" />
                <div className="h-8 w-8 rounded-sm bg-white shadow-lg" />
                <div className="h-6 w-6 rounded-sm bg-white/90 shadow-lg" />
              </div>
              <div className="ml-1 flex gap-1">
                <div className="h-4 w-6 rounded-sm bg-white/80 shadow-lg" />
                <div className="h-4 w-8 rounded-sm bg-white/85 shadow-lg" />
              </div>
            </motion.div>

            {/* Cloud 3 - Small bottom left */}
            <motion.div
              className="absolute"
              style={{ left: "15%", bottom: "25%" }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="flex gap-1">
                <div className="h-4 w-4 rounded-sm bg-white/85 shadow-md" />
                <div className="h-5 w-5 rounded-sm bg-white/90 shadow-md" />
                <div className="h-6 w-6 rounded-sm bg-white shadow-md" />
                <div className="h-4 w-4 rounded-sm bg-white/85 shadow-md" />
              </div>
            </motion.div>

            {/* Cloud 4 - Medium bottom right */}
            <motion.div
              className="absolute"
              style={{ right: "8%", bottom: "30%" }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            >
              <div className="flex gap-1">
                <div className="h-5 w-5 rounded-sm bg-white/90 shadow-md" />
                <div className="h-7 w-7 rounded-sm bg-white shadow-md" />
                <div className="h-6 w-6 rounded-sm bg-white/95 shadow-md" />
                <div className="h-5 w-5 rounded-sm bg-white/85 shadow-md" />
              </div>
              <div className="ml-2 flex gap-1">
                <div className="h-4 w-6 rounded-sm bg-white/80 shadow-md" />
                <div className="h-4 w-5 rounded-sm bg-white/75 shadow-md" />
              </div>
            </motion.div>

            {/* ===== PIXEL STARS ===== */}
            {[
              { left: "20%", top: "10%", size: 12, delay: 0 },
              { left: "75%", top: "12%", size: 10, delay: 0.3 },
              { left: "85%", top: "40%", size: 14, delay: 0.6 },
              { left: "10%", top: "45%", size: 11, delay: 0.9 },
              { left: "30%", top: "75%", size: 10, delay: 0.2 },
              { left: "70%", top: "70%", size: 13, delay: 0.5 },
              { left: "50%", top: "8%", size: 12, delay: 0.7 },
              { left: "90%", top: "60%", size: 9, delay: 0.4 },
            ].map((star, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute"
                style={{
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                }}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.8, 1.2, 0.8],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2 + star.delay,
                  repeat: Infinity,
                  delay: star.delay,
                }}
              >
                {/* 8-bit star shape */}
                <div className="relative h-full w-full">
                  <div className="absolute left-1/2 top-0 h-1/3 w-1/5 -translate-x-1/2 bg-yellow-300" />
                  <div className="absolute left-0 top-1/2 h-1/5 w-1/3 -translate-y-1/2 bg-yellow-300" />
                  <div className="absolute right-0 top-1/2 h-1/5 w-1/3 -translate-y-1/2 bg-yellow-300" />
                  <div className="absolute bottom-0 left-1/2 h-1/3 w-1/5 -translate-x-1/2 bg-yellow-300" />
                  <div className="absolute left-1/2 top-1/2 h-2/5 w-2/5 -translate-x-1/2 -translate-y-1/2 bg-yellow-200" />
                </div>
              </motion.div>
            ))}

            {/* ===== SPARKLES ===== */}
            {SPARKLE_POSITIONS.slice(0, 15).map((sparkle, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{
                  left: `${sparkle.left}%`,
                  top: `${sparkle.top}%`,
                  backgroundColor: i % 3 === 0 ? "#FFE4A0" : "#FFFFFF",
                  boxShadow: "0 0 4px rgba(255,255,255,0.8)",
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: sparkle.duration,
                  repeat: Infinity,
                  delay: sparkle.delay,
                }}
              />
            ))}

            {/* ===== BIRTHDAY TEXT (z-50) ===== */}
            <motion.div
              className="relative z-50 mb-12 text-center"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <motion.p
                className="mb-2 text-2xl font-medium text-purple-600"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ textShadow: "0 2px 10px rgba(168, 85, 247, 0.3)" }}
              >
                ✨ Happy Birthday 26th ✨
              </motion.p>
              <h1
                className="text-5xl font-bold tracking-wider text-purple-700 md:text-7xl"
                style={{
                  textShadow: "0 4px 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(236, 72, 153, 0.3)",
                  WebkitTextStroke: "1px rgba(255,255,255,0.5)",
                }}
              >
                FARAH NABILLAH
              </h1>
            </motion.div>

            {/* ===== SURPRISE BOX (z-50) ===== */}
            <motion.div
              className="relative z-50"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            >
              <motion.div
                animate={
                  gamePhase === "intro"
                    ? {
                      y: [0, -15, 0],
                      rotate: [-3, 3, -3],
                    }
                    : {}
                }
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src={
                    gamePhase === "opening"
                      ? ASSETS.surpriseOpen
                      : ASSETS.surpriseClose
                  }
                  alt="Surprise Box"
                  width={250}
                  height={250}
                  style={{ imageRendering: "pixelated" }}
                  priority
                />
              </motion.div>

              {/* Glow effect - softer pastel */}
              <div
                className="absolute inset-0 -z-10 animate-pulse rounded-full blur-3xl"
                style={{ backgroundColor: "rgba(244, 114, 182, 0.4)" }}
              />
            </motion.div>

            {/* ===== CLICK INSTRUCTION (z-50) ===== */}
            {gamePhase === "intro" && (
              <motion.p
                className="relative z-50 mt-12 text-lg font-medium text-purple-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎁 Click anywhere to open 🎁
              </motion.p>
            )}

            {/* Opening text */}
            {gamePhase === "opening" && (
              <motion.p
                className="relative z-50 mt-12 text-2xl font-bold text-pink-500"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                🎉 Opening... 🎉
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* GAME SCREEN */}
      {/* ============================================ */}
      {(gamePhase === "game" || gamePhase === "celebration") && (
        <div className="relative flex h-full w-full">
          {/* LEFT SIDE - THE ROOM */}
          <motion.div
            ref={roomRef}
            className="relative flex h-full items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              width: showCelebration ? "100%" : "50%",
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${ASSETS.background}')` }}
            />

            {/* Dark overlay for contrast */}
            <motion.div
              className="absolute inset-0 bg-black"
              animate={{
                opacity: showCelebration ? 0.6 : 0.45,
              }}
            />

            {/* Character container */}
            <motion.div
              className="relative z-10 flex items-center justify-center"
              animate={
                showCelebration
                  ? {
                    scale: [1, 1.3, 1.2, 1.35, 1.25, 1.3],
                    y: [0, -50, 0, -40, 0, -30, 0],
                  }
                  : { scale: 1 }
              }
              transition={
                showCelebration
                  ? {
                    duration: 3,
                    ease: "easeInOut",
                    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  }
                  : {}
              }
            >
              {/* Character image with idle animation - changes based on equipped items */}
              <motion.div
                className="relative"
                style={{ width: "200px", height: "350px" }}
                animate={
                  !showCelebration
                    ? {
                      y: [0, -4, 0, -4, 0],
                      scaleY: [1, 1.01, 1, 0.99, 1],
                    }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src={getCharacterImage()}
                  alt="Character"
                  fill
                  className="object-contain"
                  style={{ imageRendering: "pixelated" }}
                  priority
                />
              </motion.div>

              {/* Sparkle effects on celebration */}
              {showCelebration && (
                <>
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute h-4 w-4 rounded-full bg-yellow-400"
                      style={{
                        left: "50%",
                        top: "50%",
                      }}
                      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                      animate={{
                        scale: [0, 1.5, 0],
                        x: Math.cos((i * Math.PI * 2) / 12) * 200,
                        y: Math.sin((i * Math.PI * 2) / 12) * 200,
                        opacity: [1, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.15,
                        ease: "easeOut",
                        repeat: 2,
                        repeatDelay: 0.5,
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>

            {/* Drop zone indicator */}
            {!isWinTriggered && (
              <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-lg border-2 border-dashed border-purple-500/50 bg-purple-900/20 px-6 py-3">
                <p className="text-center text-sm text-purple-300">
                  🎯 DROP ITEMS HERE
                </p>
              </div>
            )}
          </motion.div>

          {/* RIGHT SIDE - INVENTORY */}
          <AnimatePresence>
            {!showCelebration && (
              <motion.div
                className="relative flex h-full w-1/2 flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-8"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{
                  x: "100%",
                  opacity: 0,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                {/* Title */}
                <div className="text-center">
                  <h1
                    className="mb-2 text-2xl font-bold tracking-wider text-purple-300"
                    style={{ textShadow: "0 0 20px rgba(168, 85, 247, 0.5)" }}
                  >
                    ✨ INVENTORY ✨
                  </h1>
                  <p className="text-sm text-purple-400/70">
                    Drag items to dress up Farah Nabillah!
                  </p>
                </div>

                {/* Items container - stacked vertically */}
                <div className="flex flex-col items-center gap-8">
                  {/* Glasses - disappears when equipped */}
                  {!isGlassesEquipped && (
                    <motion.div
                      className="cursor-grab active:cursor-grabbing"
                      drag
                      dragSnapToOrigin
                      onDragEnd={(_, info) => handleDragEnd("glasses", info)}
                      onDragStart={() => playPickup()}
                      onHoverStart={() => playHover()}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        y: [0, -8, 0],
                      }}
                      transition={{
                        y: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <div className="rounded-xl border-4 border-purple-500/50 bg-purple-900/30 p-4 shadow-lg shadow-purple-500/20">
                        <Image
                          src={ASSETS.glasses}
                          alt="Glasses"
                          width={100}
                          height={50}
                          style={{ imageRendering: "pixelated" }}
                        />
                        <p className="mt-2 text-center text-xs text-purple-300">
                          👓 GLASSES
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Shoes - disappears when equipped */}
                  {!isShoesEquipped && (
                    <motion.div
                      className="cursor-grab active:cursor-grabbing"
                      drag
                      dragSnapToOrigin
                      onDragEnd={(_, info) => handleDragEnd("shoes", info)}
                      onDragStart={() => playPickup()}
                      onHoverStart={() => playHover()}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        y: [0, -8, 0],
                      }}
                      transition={{
                        y: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5,
                        },
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <div className="rounded-xl border-4 border-purple-500/50 bg-purple-900/30 p-4 shadow-lg shadow-purple-500/20">
                        <Image
                          src={ASSETS.shoes}
                          alt="Shoes"
                          width={120}
                          height={60}
                          style={{ imageRendering: "pixelated" }}
                        />
                        <p className="mt-2 text-center text-xs text-purple-300">
                          👟 SHOES
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* All equipped message */}
                  {isGlassesEquipped && isShoesEquipped && (
                    <motion.p
                      className="text-xl text-green-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      ✨ All items equipped! ✨
                    </motion.p>
                  )}
                </div>

                {/* Status */}
                <div className="flex flex-col gap-2">
                  <div
                    className={`rounded-lg px-4 py-2 text-center text-sm ${isGlassesEquipped
                      ? "bg-green-500/20 text-green-400"
                      : "bg-slate-800 text-slate-500"
                      }`}
                  >
                    👓 {isGlassesEquipped ? "EQUIPPED ✓" : "NOT EQUIPPED"}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 text-center text-sm ${isShoesEquipped
                      ? "bg-green-500/20 text-green-400"
                      : "bg-slate-800 text-slate-500"
                      }`}
                  >
                    👟 {isShoesEquipped ? "EQUIPPED ✓" : "NOT EQUIPPED"}
                  </div>
                </div>

                {/* Retro pixel border decoration */}
                <div className="pointer-events-none absolute inset-4 border-4 border-dashed border-purple-800/30" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Victory text */}
      <AnimatePresence>
        {showCelebration && !showVideo && (
          <motion.div
            className="fixed inset-x-0 top-16 z-30 text-center"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <motion.h1
              className="text-5xl font-bold tracking-widest text-yellow-400 md:text-6xl"
              style={{
                textShadow:
                  "0 0 30px rgba(250, 204, 21, 0.8), 0 0 60px rgba(250, 204, 21, 0.4)",
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              ✨ VOILA! ✨
            </motion.h1>
            <motion.p
              className="mt-4 text-xl text-pink-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Happy Birthday, Farah Nabillah! 🎂
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video overlay (placeholder - dimmed) */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              {/* Video element - Cloudinary hosted */}
              <video
                className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-2xl shadow-pink-500/30"
                autoPlay
                playsInline
                controls
              >
                <source
                  src="https://res.cloudinary.com/dx01dcz8k/video/upload/WhatsApp_Video_2025-12-27_at_22.28.31_bcklvq.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>

              {/* Replay button */}
              <motion.div
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={resetGame}
                  className="rounded-lg bg-pink-600 px-8 py-3 font-bold text-white transition-colors hover:bg-pink-500"
                >
                  🔄 PLAY AGAIN
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
