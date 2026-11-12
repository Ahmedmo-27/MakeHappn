"use client";

import { useEffect, useRef } from "react";
import type { Material, Object3D, Texture } from "three";
import type { SceneBuilder, SceneCtx } from "./types";

/**
 * Shared WebGL host for the hero scenes: lazy-loads three.js and the chosen
 * scene, caps the pixel ratio, pauses when off-screen or the tab is hidden,
 * and disposes every geometry, material and texture on unmount.
 */
export function HeroStage({
  load,
  label,
  full = false,
}: {
  load: () => Promise<{ default: SceneBuilder }>;
  label: string;
  /** Fill the whole hero background instead of the square on the right. */
  full?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const [THREE, mod] = await Promise.all([import("three"), load()]);
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        el.dataset.fallback = "true";
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0, 6);

      const ctx: SceneCtx = {
        THREE,
        scene,
        camera,
        renderer,
        el,
        pointer: { x: 0, y: 0 },
        local: { x: 0, y: 0 },
        hover: 0,
        scroll: window.scrollY / window.innerHeight,
        reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      };
      const handle = mod.default(ctx);

      const resize = () => {
        const { width, height } = el.getBoundingClientRect();
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        handle.resize?.(width, height);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      let tx = 0, ty = 0, targetHover = 0;
      const onMove = (e: PointerEvent) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 2;
        ty = (e.clientY / window.innerHeight - 0.5) * 2;
        const r = el.getBoundingClientRect();
        ctx.local.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        ctx.local.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
        const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        targetHover = Math.max(0, 1 - dist / (Math.min(r.width, r.height) / 2));
      };
      const onScroll = () => {
        ctx.scroll = window.scrollY / window.innerHeight;
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      io.observe(el);

      let raf = 0;
      let last = performance.now();
      let t = 0;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!visible || document.hidden) return;
        t += ctx.reduce ? dt * 0.25 : dt;
        const k = 1 - Math.exp(-6 * dt);
        ctx.pointer.x += (tx - ctx.pointer.x) * k;
        ctx.pointer.y += (ty - ctx.pointer.y) * k;
        ctx.hover += (targetHover - ctx.hover) * k;
        handle.update?.(t, dt);
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(frame);
      el.dataset.ready = "true";

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", onScroll);
        io.disconnect();
        ro.disconnect();
        handle.dispose?.();
        scene.traverse((obj: Object3D) => {
          const o = obj as Object3D & { geometry?: { dispose(): void }; material?: Material | Material[] };
          o.geometry?.dispose();
          const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
          for (const m of mats) {
            for (const value of Object.values(m)) {
              if (value && (value as Texture).isTexture) (value as Texture).dispose();
            }
            m.dispose();
          }
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [load]);

  return <div ref={host} className={full ? "hero-orb is-full" : "hero-orb"} role="img" aria-label={label} />;
}
