"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Site-wide interaction layer. Progressive enhancement only: every effect is
 * cosmetic, so pages render and work fully without it.
 *  - spotlight: cards track the pointer (--mx / --my) for a moving glow
 *  - magnetic:  primary buttons lean toward the pointer
 *  - count-up:  numeric KPIs roll up when they scroll into view
 *  - cursor:    a soft accent halo follows the pointer on fine-pointer devices
 */
const SPOT = ".card, .panel, .form-card, .kpi, .spot, .task-card, .column, .event-card, .login-card";
const MAGNET = ".btn-primary, [data-magnetic]";
const COUNT = "[data-countup], .kpi-value, .stat";

export function Interactions() {
  const pathname = usePathname();

  // Pointer-driven effects (bound once)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    const halo = document.createElement("div");
    halo.className = "cursor-halo";
    if (fine && !reduce) document.body.appendChild(halo);

    let magnet: HTMLElement | null = null;
    let raf = 0;
    let hx = -200, hy = -200, tx = -200, ty = -200;

    const animated = fine && !reduce;
    // the halo loop only runs while the halo is catching up with the pointer
    const loop = () => {
      hx += (tx - hx) * 0.18;
      hy += (ty - hy) * 0.18;
      halo.style.transform = `translate3d(${hx}px, ${hy}px, 0)`;
      raf = Math.abs(tx - hx) + Math.abs(ty - hy) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (animated && !raf) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      wake();
      const target = e.target as Element | null;
      if (!target || !(target instanceof Element)) return;

      const spot = target.closest<HTMLElement>(SPOT);
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      }

      halo.classList.toggle("is-active", !!target.closest("a, button, summary, [role=button], input, select, textarea"));

      if (reduce || !fine) return;
      const m = target.closest<HTMLElement>(MAGNET);
      if (magnet && magnet !== m) {
        magnet.style.transform = "";
        magnet = null;
      }
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        m.style.transform = `translate(${dx * 4}px, ${dy * 3}px)`;
        magnet = m;
      }
    };
    const onLeave = () => {
      tx = -200;
      ty = -200;
      wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      halo.remove();
    };
  }, []);

  // Count-up numbers (re-scanned on every navigation and DOM change)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const seen = new WeakSet<Element>();

    // Streamed (Suspense) content is server HTML until React hydrates it; touching
    // its text before then causes a hydration mismatch, so wait for React to own it.
    const hydrated = (el: Element) => Object.keys(el).some((k) => k.startsWith("__reactFiber"));
    const animate = (el: Element, tries = 0) => {
      if (!el.isConnected) return;
      if (!hydrated(el)) {
        if (tries < 120) setTimeout(() => animate(el, tries + 1), 50);
        return;
      }
      const node = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && /\d/.test(n.nodeValue ?? ""));
      if (!node) return;
      const original = node.nodeValue ?? "";
      const match = original.match(/-?[\d,]+(\.\d+)?/);
      if (!match) return;
      const target = parseFloat(match[0].replace(/,/g, ""));
      if (!Number.isFinite(target) || target === 0) return;
      const decimals = match[1] ? match[1].length - 1 : 0;
      const grouped = match[0].includes(",");
      const fmt = (v: number) =>
        grouped
          ? v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
          : v.toFixed(decimals);
      const start = performance.now();
      const duration = 1100;
      const step = (now: number) => {
        // Stop if React has re-rendered this node with different text
        if (!node.isConnected) return;
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        node.nodeValue = original.replace(match[0], fmt(target * eased));
        if (t < 1) requestAnimationFrame(step);
        else node.nodeValue = original;
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.unobserve(entry.target);
            animate(entry.target);
          }
        }
      },
      { threshold: 0.4 },
    );

    const scan = () => {
      document.querySelectorAll(COUNT).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
