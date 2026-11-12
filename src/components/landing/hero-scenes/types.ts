import type * as THREE_NS from "three";

export type Three = typeof THREE_NS;

export interface SceneCtx {
  THREE: Three;
  scene: THREE_NS.Scene;
  camera: THREE_NS.PerspectiveCamera;
  renderer: THREE_NS.WebGLRenderer;
  el: HTMLElement;
  /** Pointer relative to the window, -1..1 (y down), smoothed. */
  pointer: { x: number; y: number };
  /** Pointer relative to the canvas, -1..1 (y up, NDC), raw. */
  local: { x: number; y: number };
  /** 0..1: how close the pointer is to the canvas centre, smoothed. */
  hover: number;
  /** Page scroll in viewport heights. */
  scroll: number;
  reduce: boolean;
}

export interface SceneHandle {
  update?: (t: number, dt: number) => void;
  resize?: (width: number, height: number) => void;
  dispose?: () => void;
}

export type SceneBuilder = (ctx: SceneCtx) => SceneHandle;

export const LIME = 0xd4ff3a;
export const INK = 0xf2efe8;
export const BG = 0x0d0d0b;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
export const damp = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt));

/** The display font family that next/font registered (falls back to sans-serif). */
export function displayFont() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
  return v || "sans-serif";
}
