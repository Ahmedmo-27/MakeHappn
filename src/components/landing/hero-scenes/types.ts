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

/** Nude #E1DCD8. Scenes used to call this lime. */
export const NUDE = 0xe1dcd8;
export const INK = 0xffffff;
export const BG = 0x000000;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
export const damp = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt));

/** The display font family that next/font registered (falls back to serif). */
export function displayFont() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
  return v || "serif";
}

/** The UI font family that next/font registered (falls back to sans-serif). */
export function uiFont() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim();
  return v || "sans-serif";
}
