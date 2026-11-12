"use client";

import Link from "next/link";
import { Suspense, useRef, useState } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { HeroPicker, HeroVisual } from "./hero-scenes/hero-visual";
import { PROJECT_STAGES, STAGE_LABELS, STUDIO_PRODUCT_LABELS, STUDIO_PRODUCTS } from "@/lib/domain";


const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------------------------------------------------------------------- */
/* Small building blocks                                                   */
/* ---------------------------------------------------------------------- */

function SplitWords({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="split-mask">
          <motion.span
            className="split-word"
            initial={{ y: "110%", rotate: 4 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 1, ease: EASE, delay: delay + i * 0.08 }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function Magnetic({ children, className, href }: { children: React.ReactNode; className: string; href: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 });
  const sy = useSpring(y, { stiffness: 260, damping: 18 });
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <motion.span style={{ x: sx, y: sy, display: "inline-block" }}>
      <Link
        ref={ref}
        href={href}
        className={className}
        onPointerMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
          y.set((e.clientY - (r.top + r.height / 2)) * 0.4);
        }}
        onPointerLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        {children}
      </Link>
    </motion.span>
  );
}

/** Marquee whose speed and direction react to scroll velocity. */
/** base = percent of the track moved per second (one loop is 50%, so 1.6 ≈ 30s per loop). */
function VelocityMarquee({ items, base = 1.6 }: { items: string[]; base?: number }) {
  const offset = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 300 });
  const factor = useTransform(velocity, [-2500, 0, 2500], [-3, 1, 3]);
  const direction = useRef(1);
  useAnimationFrame((_, rawDelta) => {
    // cap the frame gap so returning to the tab does not jump the track
    const delta = Math.min(rawDelta, 50);
    const f = factor.get();
    if (f < 0) direction.current = -1;
    else if (f > 0) direction.current = 1;
    let next = offset.get() - direction.current * (base / 1000) * delta * Math.max(1, Math.abs(f));
    if (next < -50) next += 50;
    if (next > 0) next -= 50;
    offset.set(next);
  });
  const x = useMotionTemplate`${offset}%`;
  const row = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <motion.div className="marquee-track" style={{ x }}>
        {[...row, ...row].map((item, i) => (
          <span key={i} className="marquee-item">
            {item}
            <span className="marquee-star">✺</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 20 });
  const sry = useSpring(ry, { stiffness: 200, damping: 20 });
  const ref = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry.set(px * 10);
        rx.set(-py * 10);
        ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`);
        ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/* Sections                                                                */
/* ---------------------------------------------------------------------- */

function Nav() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 120], ["rgba(13,13,11,0)", "rgba(13,13,11,0.78)"]);
  const border = useTransform(scrollY, [0, 120], ["rgba(242,239,232,0)", "rgba(242,239,232,0.08)"]);
  return (
    <motion.header className="lp-nav" style={{ backgroundColor: bg, borderColor: border }}>
      <Link href="/" className="wordmark lp-logo">
        makehappn<span className="dot">.</span>
      </Link>
      <nav className="lp-links" aria-label="Sections">
        <a href="#model">Model</a>
        <a href="#stages">Stages</a>
        <a href="#lanes">Lanes</a>
        <a href="#system">System</a>
      </nav>
      <Link href="/login" className="btn btn-primary lp-nav-cta">
        Sign in <span className="arrow" aria-hidden="true">→</span>
      </Link>
    </motion.header>
  );
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const orbY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-25%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="lp-hero">
      <motion.div className="lp-orb-wrap" style={{ y: orbY, scale: orbScale }}>
        <Suspense fallback={<div className="hero-orb" aria-hidden="true" />}>
          <HeroVisual />
        </Suspense>
      </motion.div>

      <motion.div className="lp-hero-copy" style={{ y: textY, opacity: fade }}>
        <motion.p
          className="kicker"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        >
          Creative studio · Cairo · Est. for experiences
        </motion.p>
        <h1 className="lp-title">
          <SplitWords text="We make" delay={0.15} />
          <br />
          <SplitWords text="ideas" delay={0.35} className="lp-title-outline" />{" "}
          <SplitWords text="happen." delay={0.45} className="lp-title-accent" />
        </h1>
        <motion.div
          className="lp-hero-foot"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.8 }}
        >
          <p className="lp-lede">
            The operating system behind MakeHappn. One connected record that follows every
            opportunity from first inquiry to final applause, and every dirham in between.
          </p>
          <div className="row" style={{ gap: "0.8rem" }}>
            <Magnetic href="/login" className="btn btn-primary lp-cta">
              Enter the studio <span className="arrow" aria-hidden="true">→</span>
            </Magnetic>
            <a href="#model" className="btn btn-ghost lp-cta">See how it works</a>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="lp-hero-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.1 }}
      >
        {[
          ["11", "Gated stages"],
          ["06", "Studio products"],
          ["03", "Connected lanes"],
          ["01", "Source of truth"],
        ].map(([n, label]) => (
          <div key={label} className="lp-stat">
            <span className="lp-stat-n">{n}</span>
            <span className="lp-stat-l">{label}</span>
          </div>
        ))}
      </motion.div>

      <div className="lp-scroll-hint" aria-hidden="true">
        <span />
        Scroll
      </div>
    </section>
  );
}

const PHASES = [
  {
    n: "01",
    title: "Client & Creative Brief",
    body: "Understand the ask, shape the vision, and set the budget and timeline together.",
    who: "Sama · Sara M.",
  },
  {
    n: "02",
    title: "Design Development",
    body: "Turn the brief into visual and spatial design, 2D and 3D in lockstep.",
    who: "Nadine · Sohila · Hamdy",
  },
  {
    n: "03",
    title: "Delivery & Production",
    body: "Fabricate, coordinate and execute on-site until the project is handed over.",
    who: "Sara M. · Mai · Production",
  },
  {
    n: "04",
    title: "Communication",
    body: "Share the work with the world. Documentation, content and storytelling, in parallel all the way.",
    who: "Mariam",
  },
];

function Model() {
  return (
    <section id="model" className="lp-section lp-model">
      <div className="lp-model-sticky">
        <p className="kicker">The model</p>
        <h2 className="lp-h2">
          One project lead. <br />
          One direction. <br />
          <span className="lp-muted">Clear handovers.</span>
        </h2>
        <p className="lp-lede">
          No step moves forward without alignment. Every phase knows who owns it, what it needs,
          and what it must hand over.
        </p>
      </div>
      <div className="lp-phase-list">
        {PHASES.map((phase, i) => (
          <PhaseRow key={phase.n} phase={phase} index={i} />
        ))}
      </div>
    </section>
  );
}

function PhaseRow({ phase, index }: { phase: (typeof PHASES)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 50%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const width = useTransform(progress, [0, 1], ["0%", "100%"]);
  return (
    <Reveal delay={index * 0.05}>
      <div ref={ref} className="lp-phase spot">
        <div className="lp-phase-top">
          <span className="lp-phase-n">{phase.n}</span>
          <span className="lp-phase-who">{phase.who}</span>
        </div>
        <h3 className="lp-phase-title">{phase.title}</h3>
        <p className="lp-phase-body">{phase.body}</p>
        <div className="lp-phase-bar">
          <motion.span style={{ width }} />
        </div>
      </div>
    </Reveal>
  );
}

function StageCard({ i, active }: { i: number; active: boolean }) {
  const stage = STAGE_LABELS[PROJECT_STAGES[i]];
  return (
    <article className={`lp-stage${active ? " is-active" : ""}`}>
      <span className="lp-stage-n">{stage.number}</span>
      <div>
        <p className="lp-stage-phase">{stage.macroPhase}</p>
        <h3 className="lp-stage-title">{stage.title}</h3>
        <p className="lp-stage-body">{stage.whatHappens}</p>
      </div>
      <p className="lp-stage-out">
        <span>Output</span>
        {stage.expectedOutput}
      </p>
    </article>
  );
}

/**
 * Sticky horizontal track driven straight from native scroll (no spring, so it
 * never lags or overshoots). Only the active index is React state, so cards
 * re-render once per stage change and fade with a CSS transition.
 */
function Stages() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-78%"]);
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(PROJECT_STAGES.length - 1, Math.max(0, Math.round(v * (PROJECT_STAGES.length - 1))));
    setActive((prev) => (prev === next ? prev : next));
  });
  return (
    <section id="stages" ref={ref} className="lp-stages">
      <div className="lp-stages-sticky">
        <div className="lp-stages-head">
          <div>
            <p className="kicker">The workflow</p>
            <h2 className="lp-h2">Eleven stages. <span className="lp-muted">Zero guesswork.</span></h2>
          </div>
          <div className="lp-stages-meta" aria-hidden="true">
            <span className="lp-stages-count">
              {String(active + 1).padStart(2, "0")} <i>/ {PROJECT_STAGES.length}</i>
            </span>
            <div className="lp-stages-progress">
              <motion.span style={{ scaleX: scrollYProgress }} />
            </div>
          </div>
        </div>
        <motion.div className="lp-stage-track" style={{ x }}>
          {PROJECT_STAGES.map((_, i) => (
            <StageCard key={i} i={i} active={i === active} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const LANES = [
  {
    name: "Vision & Design",
    tone: "lime",
    people: [
      ["Sara Dawoud", "Founder & Managing Director"],
      ["Sama", "Creative Lead"],
      ["Nadine", "Senior Graphic Designer"],
      ["Sohila", "Art Direction / Senior 3D"],
      ["Hamdy", "Spatial / 3D Visualizer"],
    ],
  },
  {
    name: "Project & Delivery",
    tone: "blue",
    people: [
      ["Sara M.", "Project & Delivery Lead"],
      ["Mai", "Design & Production Executive"],
      ["Production Intern", "Production Support (open role)"],
    ],
  },
  {
    name: "Communication",
    tone: "amber",
    people: [["Mariam", "Social Media Specialist"]],
  },
];

function Lanes() {
  return (
    <section id="lanes" className="lp-section">
      <Reveal className="lp-section-head">
        <p className="kicker">The people</p>
        <h2 className="lp-h2">
          Everyone has a lane. <br />
          <span className="lp-muted">Projects move across them.</span>
        </h2>
      </Reveal>
      <div className="lp-lanes">
        {LANES.map((lane, i) => (
          <Reveal key={lane.name} delay={i * 0.1}>
            <TiltCard className={`lp-lane spot tone-${lane.tone}`}>
              <div className="lp-lane-head">
                <span className="lp-lane-dot" />
                <h3>{lane.name}</h3>
                <span className="lp-lane-count">{String(lane.people.length).padStart(2, "0")}</span>
              </div>
              <ul>
                {lane.people.map(([name, role]) => (
                  <li key={name}>
                    <strong>{name}</strong>
                    <span>{role}</span>
                  </li>
                ))}
              </ul>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const SYSTEM = [
  {
    title: "Estimated · Committed · Actual",
    body: "Three cost lines that never blur into one. Know the margin before the invoice lands.",
    span: "wide",
    visual: "bars",
  },
  { title: "Gate approvals", body: "Every stage signed off with who, when and why.", visual: "gate" },
  { title: "Change requests", body: "Scope, cost and time impact recorded before anything moves.", visual: "delta" },
  { title: "The Collective", body: "Makers, partners and venues linked to the projects they shape.", visual: "nodes" },
  {
    title: "Exception radar",
    body: "Overdue tasks, late payments and at-risk projects surface on their own.",
    span: "wide",
    visual: "radar",
  },
];

function SystemVisual({ kind }: { kind: string }) {
  if (kind === "bars") {
    return (
      <div className="viz-bars">
        {[["Estimated", 82], ["Committed", 58], ["Actual", 41]].map(([label, value], i) => (
          <div key={label as string} className="viz-bar-row">
            <span>{label}</span>
            <div className="viz-bar">
              <motion.i
                initial={{ width: 0 }}
                whileInView={{ width: `${value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.2 + i * 0.15 }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "radar") {
    return (
      <div className="viz-radar">
        <span className="viz-sweep" />
        <i style={{ top: "28%", left: "62%" }} />
        <i style={{ top: "58%", left: "30%" }} className="warn" />
        <i style={{ top: "70%", left: "68%" }} />
      </div>
    );
  }
  if (kind === "gate") {
    return (
      <div className="viz-gate">
        {Array.from({ length: 11 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ scaleY: 0.2, opacity: 0.2 }}
            whileInView={{ scaleY: 1, opacity: i < 7 ? 1 : 0.25 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.05 }}
            className={i === 6 ? "on" : undefined}
          />
        ))}
      </div>
    );
  }
  if (kind === "delta") {
    return (
      <div className="viz-delta">
        <span>+ $6,500</span>
        <span className="neg">− $3,800</span>
        <span>+ 2d</span>
      </div>
    );
  }
  return (
    <svg className="viz-nodes" viewBox="0 0 200 90" aria-hidden="true">
      {[[30, 45], [90, 20], [100, 70], [160, 40]].map(([x, y], i, arr) =>
        arr.slice(i + 1).map(([x2, y2], j) => (
          <line key={`${i}-${j}`} x1={x} y1={y} x2={x2} y2={y2} />
        )),
      )}
      {[[30, 45], [90, 20], [100, 70], [160, 40]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 1 ? 7 : 5} className={i === 1 ? "on" : undefined} />
      ))}
    </svg>
  );
}

function System() {
  return (
    <section id="system" className="lp-section">
      <Reveal className="lp-section-head">
        <p className="kicker">The system</p>
        <h2 className="lp-h2">
          Built for the business <br />
          <span className="lp-muted">behind the magic.</span>
        </h2>
      </Reveal>
      <div className="lp-bento">
        {SYSTEM.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.06} className={item.span === "wide" ? "lp-bento-wide" : undefined}>
            <TiltCard className="lp-bento-card spot">
              <SystemVisual kind={item.visual} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Closing() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  return (
    <section
      className="lp-closing"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
    >
      <p className="kicker">Ready when you are</p>
      <h2
        className="lp-closing-title"
        style={{ "--px": `${pos.x}%`, "--py": `${pos.y}%` } as React.CSSProperties}
      >
        Make it <br />
        happen.
      </h2>
      <Magnetic href="/login" className="btn btn-primary lp-cta lp-cta-xl">
        Sign in to the studio <span className="arrow" aria-hidden="true">→</span>
      </Magnetic>
    </section>
  );
}

export function Landing() {
  const products = STUDIO_PRODUCTS.map((p) => STUDIO_PRODUCT_LABELS[p]);
  return (
    <div className="lp">
      <Nav />
      <main>
        <Hero />
        <Suspense fallback={null}>
          <HeroPicker />
        </Suspense>
        <VelocityMarquee items={products} />
        <Model />
        <Stages />
        <Lanes />
        <System />
        <Closing />
      </main>
      <footer className="lp-footer">
        <span className="wordmark">makehappn<span className="dot">.</span></span>
        <span>Brief · Design · Production · Communication</span>
        <span>© MakeHappn Studio · Cairo</span>
      </footer>
    </div>
  );
}
