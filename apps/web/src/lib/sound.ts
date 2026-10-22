"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Short sound effects, made with the Web Audio API as the game plays, so
 * there are no audio files to download or license.
 */
export type SoundName =
  | "tap"
  | "place"
  | "drop"
  | "flip"
  | "capture"
  | "match"
  | "miss"
  | "hit"
  | "splash"
  | "sunk"
  | "tick"
  | "go"
  | "buzz"
  | "win"
  | "lose"
  | "draw"
  | "roll"
  | "climb"
  | "slide"
  | "hop";

const KEY = "laro-tayo:sound";
const listeners = new Set<() => void>();
let cached: boolean | undefined;
let context: AudioContext | null = null;
let master: GainNode | null = null;

function readSetting(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

function snapshot(): boolean {
  if (cached === undefined) cached = readSetting();
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Whether sound is on. It's on unless the player turned it off. */
export function useSoundOn(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Without storage the choice still lasts until the page is closed.
  }
  cached = on;
  for (const listener of listeners) listener();
}

interface Tone {
  freq: number;
  /** Slide to this pitch by the end. */
  to?: number;
  type?: OscillatorType;
  /** Seconds from now. */
  start?: number;
  duration?: number;
  volume?: number;
}

function tone(
  ctx: AudioContext,
  out: AudioNode,
  { freq, to, type = "sine", start = 0, duration = 0.1, volume = 0.2 }: Tone,
) {
  const at = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

interface Noise {
  start?: number;
  duration?: number;
  volume?: number;
  /** The pitch the noise is centered on, or cut off above. */
  frequency?: number;
  filter?: BiquadFilterType;
}

/** A burst of filtered noise, for card flicks, splashes, and thuds. */
function noise(
  ctx: AudioContext,
  out: AudioNode,
  { start = 0, duration = 0.08, volume = 0.15, frequency = 2000, filter = "bandpass" }: Noise,
) {
  const at = ctx.currentTime + start;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const shape = ctx.createBiquadFilter();
  shape.type = filter;
  shape.frequency.value = frequency;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(shape).connect(gain).connect(out);
  source.start(at);
}

const notes = (ctx: AudioContext, out: AudioNode, freqs: number[], gap: number, length: number) =>
  freqs.forEach((freq, i) =>
    tone(ctx, out, { freq, type: "triangle", start: i * gap, duration: length, volume: 0.18 }),
  );

const SOUNDS: Record<SoundName, (ctx: AudioContext, out: AudioNode) => void> = {
  tap: (ctx, out) => tone(ctx, out, { freq: 700, duration: 0.05, volume: 0.1 }),
  place: (ctx, out) => tone(ctx, out, { freq: 420, to: 300, type: "triangle", duration: 0.1, volume: 0.25 }),
  drop: (ctx, out) => tone(ctx, out, { freq: 900 + Math.random() * 250, to: 650, duration: 0.04, volume: 0.07 }),
  flip: (ctx, out) => noise(ctx, out, { duration: 0.07, frequency: 3200, volume: 0.2 }),
  capture: (ctx, out) => {
    tone(ctx, out, { freq: 330, to: 165, type: "square", duration: 0.12, volume: 0.07 });
    noise(ctx, out, { duration: 0.06, frequency: 1200, volume: 0.12 });
  },
  match: (ctx, out) => {
    tone(ctx, out, { freq: 660, duration: 0.09, volume: 0.18 });
    tone(ctx, out, { freq: 990, start: 0.08, duration: 0.14, volume: 0.18 });
  },
  miss: (ctx, out) => tone(ctx, out, { freq: 250, to: 160, type: "triangle", duration: 0.16, volume: 0.18 }),
  hit: (ctx, out) => {
    noise(ctx, out, { duration: 0.2, frequency: 900, filter: "lowpass", volume: 0.35 });
    tone(ctx, out, { freq: 140, to: 60, duration: 0.22, volume: 0.3 });
  },
  splash: (ctx, out) => noise(ctx, out, { duration: 0.25, frequency: 1500, volume: 0.14 }),
  sunk: (ctx, out) => {
    tone(ctx, out, { freq: 300, to: 70, type: "sawtooth", duration: 0.55, volume: 0.1 });
    noise(ctx, out, { duration: 0.45, frequency: 600, filter: "lowpass", volume: 0.3 });
  },
  tick: (ctx, out) => tone(ctx, out, { freq: 1200, duration: 0.03, volume: 0.1 }),
  go: (ctx, out) => tone(ctx, out, { freq: 880, to: 1320, duration: 0.16, volume: 0.18 }),
  buzz: (ctx, out) => tone(ctx, out, { freq: 150, type: "sawtooth", duration: 0.45, volume: 0.12 }),
  win: (ctx, out) => notes(ctx, out, [523, 659, 784, 1047], 0.1, 0.2),
  lose: (ctx, out) => notes(ctx, out, [392, 330, 262], 0.15, 0.24),
  draw: (ctx, out) => notes(ctx, out, [440, 440], 0.15, 0.18),
  // A die rattling and landing.
  roll: (ctx, out) => {
    for (let i = 0; i < 5; i++) {
      noise(ctx, out, { start: i * 0.06, duration: 0.04, frequency: 2500 + i * 300, volume: 0.15 });
    }
    tone(ctx, out, { freq: 300, to: 220, type: "triangle", start: 0.32, duration: 0.08, volume: 0.2 });
  },
  climb: (ctx, out) => notes(ctx, out, [523, 587, 659, 784, 880], 0.06, 0.1),
  slide: (ctx, out) => tone(ctx, out, { freq: 900, to: 180, type: "triangle", duration: 0.5, volume: 0.18 }),
  // A piece hopping one square.
  hop: (ctx, out) => tone(ctx, out, { freq: 520, to: 780, type: "triangle", duration: 0.07, volume: 0.14 }),
};

/** Plays a sound, unless sound is off or the browser can't. */
export function playSound(name: SoundName) {
  if (!snapshot()) return;
  try {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.8;
      master.connect(context.destination);
    }
    // Browsers keep audio paused until the page has been tapped.
    if (context.state === "suspended") void context.resume();
    SOUNDS[name](context, master!);
  } catch {
    // No audio here. The game works the same without it.
  }
}

/** Plays a win, loss, or draw sound once, when a game ends. `you` is null in pass and play. */
export function useResultSound(winners: readonly number[] | null, you: number | null) {
  const played = useRef(false);
  const over = winners !== null;
  useEffect(() => {
    if (!over) {
      played.current = false;
      return;
    }
    if (played.current) return;
    const sound: SoundName = winners.length === 0 ? "draw" : you === null || winners.includes(you) ? "win" : "lose";
    const timer = setTimeout(() => {
      played.current = true;
      playSound(sound);
    }, 350);
    return () => clearTimeout(timer);
    // Only the end of the game matters, not each new array of winners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over, you]);
}
