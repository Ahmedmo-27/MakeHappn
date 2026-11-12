"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { HeroStage } from "./hero-stage";
import type { SceneBuilder } from "./types";

const HeroOrb = dynamic(() => import("../hero-orb").then((m) => m.HeroOrb), { ssr: false });

type Variant = { name: string; hint: string; full?: boolean; load?: () => Promise<{ default: SceneBuilder }> };

/** Temporary preview set: pick one, then the others get deleted. */
const VARIANTS: Variant[] = [
  { name: "Current orb", hint: "The original noise orb" },
  { name: "The 11 gates", hint: "Scroll down to fly through the gates", load: () => import("./gates") },
  { name: "Pavilion", hint: "Builds itself, move the pointer to orbit", load: () => import("./pavilion") },
  { name: "Three lanes", hint: "Hover near it to separate the lanes", load: () => import("./lanes") },
  { name: "Blueprint → reality", hint: "Hover to build it solid", load: () => import("./blueprint") },
  { name: "3D wordmark", hint: "Turns toward your cursor", load: () => import("./wordmark") },
  { name: "Idea particles", hint: "Hover to snap the cloud into a pavilion", load: () => import("./particles") },
  { name: "Word sphere", hint: "Point at a word to light it up", load: () => import("./wordsphere") },
  { name: "Material samples", hint: "Hover near them to fan the slabs out", load: () => import("./materials") },
  { name: "Spotlight stage", hint: "The light follows your cursor", full: true, load: () => import("./spotlight") },
];

export function useHeroVariant() {
  const params = useSearchParams();
  const n = Number(params.get("hero") ?? 0);
  return Number.isInteger(n) && n >= 0 && n < VARIANTS.length ? n : 0;
}

export function HeroVisual() {
  const variant = useHeroVariant();
  const v = VARIANTS[variant];
  if (!v.load) return <HeroOrb />;
  return <HeroStage key={variant} load={v.load} label={v.name} full={v.full} />;
}

export function HeroPicker() {
  const variant = useHeroVariant();
  const choose = (i: number) => window.history.replaceState(null, "", i === 0 ? "/" : `/?hero=${i}`);
  return (
    <div className="hero-picker" role="radiogroup" aria-label="Preview hero 3D option">
      <span className="hero-picker-label">Hero preview</span>
      <div className="hero-picker-nums">
        {VARIANTS.map((v, i) => (
          <button
            key={v.name}
            type="button"
            role="radio"
            aria-checked={i === variant}
            title={v.name}
            className={i === variant ? "active" : undefined}
            onClick={() => choose(i)}
          >
            {i}
          </button>
        ))}
      </div>
      <span className="hero-picker-name">
        <strong>{VARIANTS[variant].name}</strong>
        <em>{VARIANTS[variant].hint}</em>
      </span>
    </div>
  );
}
