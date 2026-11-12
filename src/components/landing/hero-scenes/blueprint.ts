import type { BufferGeometry, Material, SpriteMaterial, Vector3 } from "three";
import { LIME, damp, displayFont, type SceneBuilder } from "./types";

/**
 * 4 · Blueprint to reality: a full exhibition booth (truss, fascia, LED wall,
 * shelving with products, curved reception desk, lounge, plinths, plants,
 * hanging banner, visitors) rises from lime blueprint lines into a solid model.
 * Dimension lines and drawing labels show while it is still a blueprint; hover completes it.
 */
const build: SceneBuilder = ({ THREE, scene, camera, renderer, pointer, ...ctx }) => {
  renderer.localClippingEnabled = true;
  const BASE_Y = -1.15;
  const root = new THREE.Group();
  root.position.y = BASE_Y;
  scene.add(root);

  scene.add(new THREE.HemisphereLight(0xf2efe8, 0x0d0d0b, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(4, 7, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(LIME, 0.6);
  fill.position.set(-5, 2, -2);
  scene.add(fill);

  const solidClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const wireClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const clip = { clippingPlanes: [solidClip] };

  const M = {
    dark: new THREE.MeshStandardMaterial({ color: 0x23231f, roughness: 0.6, ...clip }),
    bone: new THREE.MeshStandardMaterial({ color: 0xe9e4d8, roughness: 0.5, ...clip }),
    lime: new THREE.MeshStandardMaterial({ color: LIME, roughness: 0.35, emissive: LIME, emissiveIntensity: 0.25, ...clip }),
    wood: new THREE.MeshStandardMaterial({ color: 0x9a6b42, roughness: 0.65, ...clip }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8c8c86, roughness: 0.3, metalness: 0.85, ...clip }),
    glass: new THREE.MeshStandardMaterial({ color: 0xbfd6e6, roughness: 0.05, transparent: true, opacity: 0.25, ...clip }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3d5a32, roughness: 0.8, flatShading: true, ...clip }),
    terracotta: new THREE.MeshStandardMaterial({ color: 0xa04a30, roughness: 0.9, ...clip }),
    person: new THREE.MeshStandardMaterial({ color: 0xbdb8ab, roughness: 0.8, ...clip }),
    personAlt: new THREE.MeshStandardMaterial({ color: 0x5b5a54, roughness: 0.8, ...clip }),
  };
  const wireMat = new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.85, clippingPlanes: [wireClip] });

  const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
  const font = displayFont();

  /** Adds a solid (clipped below the scan line) and its blueprint edges (clipped above it). */
  const add = (geo: BufferGeometry, mat: Material, x: number, y: number, z: number, rot: [number, number, number] = [0, 0, 0]) => {
    const solid = new THREE.Mesh(geo, mat);
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), wireMat);
    for (const o of [solid, lines]) {
      o.position.set(x, y, z);
      o.rotation.set(...rot);
      root.add(o);
    }
    return solid;
  };
  const box = (w: number, h: number, d: number, mat: Material, x: number, y: number, z: number, rot?: [number, number, number]) =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rot);
  const cyl = (rt: number, rb: number, h: number, mat: Material, x: number, y: number, z: number, seg = 20) =>
    add(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);

  // ---------- ground grid ----------
  const grid = new THREE.GridHelper(9, 36, LIME, 0x24241f);
  const gm = grid.material as Material;
  gm.transparent = true;
  gm.opacity = 0.22;
  root.add(grid);

  // ---------- floor, walls, glass ----------
  box(3.8, 0.12, 2.8, M.dark, 0, 0.06, 0);
  box(3.8, 0.03, 0.04, M.lime, 0, 0.1, 1.41); // edge light strip
  box(3.8, 2.4, 0.1, M.bone, 0, 1.32, -1.35);
  box(0.1, 2.4, 2.8, M.bone, -1.85, 1.32, 0);
  box(0.04, 1.6, 1.2, M.glass, 1.88, 0.92, -0.7);

  // ---------- truss frame + fascia + spotlights ----------
  for (const [x, z] of [[1.85, 1.35], [1.85, -1.35], [-1.85, 1.35]] as const) box(0.08, 2.75, 0.08, M.metal, x, 1.5, z);
  box(3.8, 0.08, 0.08, M.metal, 0, 2.86, 1.35);
  box(0.08, 0.08, 2.8, M.metal, 1.85, 2.86, 0);
  box(0.08, 0.08, 2.8, M.metal, -1.85, 2.86, 0);
  const fasciaTex = canvasTex(1024, 96, (g) => {
    g.fillStyle = "#d4ff3a";
    g.fillRect(0, 0, 1024, 96);
    g.fillStyle = "#0d0d0b";
    g.font = `800 60px ${font}`;
    g.textBaseline = "middle";
    g.fillText("makehappn.", 32, 50);
    g.font = "600 26px monospace";
    g.fillText("HALL 3 · STAND B-14", 720, 50);
  });
  box(3.8, 0.32, 0.06, M.lime, 0, 2.66, 1.38);
  const fascia = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 0.3), new THREE.MeshBasicMaterial({ map: fasciaTex, ...clip }));
  fascia.position.set(0, 2.66, 1.415);
  root.add(fascia);
  for (const x of [-1.2, -0.4, 0.4, 1.2]) {
    const s = cyl(0.05, 0.08, 0.16, M.dark, x, 2.74, 1.25, 12);
    s.rotation.x = 0.7;
  }

  // ---------- LED wall + logo disc ----------
  const ledTex = canvasTex(512, 256, (g) => {
    const grad = g.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, "#0d0d0b");
    grad.addColorStop(1, "#2a3a0b");
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 256);
    g.strokeStyle = "rgba(212,255,58,0.6)";
    g.lineWidth = 3;
    g.beginPath();
    for (let x = 0; x <= 512; x += 8) g.lineTo(x, 170 - Math.sin(x / 40) * 40 - x / 8);
    g.stroke();
    g.fillStyle = "#f2efe8";
    g.font = `800 46px ${font}`;
    g.fillText("Ideas, built.", 28, 70);
  });
  box(1.9, 1.1, 0.05, M.dark, 0.35, 1.55, -1.28);
  const led = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), new THREE.MeshBasicMaterial({ map: ledTex, ...clip }));
  led.position.set(0.35, 1.55, -1.25);
  root.add(led);
  add(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 40), M.lime, -1.05, 1.9, -1.27, [Math.PI / 2, 0, 0]);

  // ---------- shelving with products on the side wall ----------
  for (const z of [-0.9, 0.1]) box(0.05, 1.8, 0.05, M.metal, -1.62, 1.02, z);
  const productMats = [M.lime, M.bone, M.terracotta, M.dark];
  for (let s = 0; s < 4; s++) {
    const y = 0.45 + s * 0.42;
    box(0.36, 0.03, 1.1, M.wood, -1.62, y, -0.4);
    for (let p = 0; p < 4; p++) {
      const h = 0.12 + ((s + p) % 3) * 0.05;
      box(0.16, h, 0.14, productMats[(s + p) % 4], -1.62, y + 0.015 + h / 2, -0.82 + p * 0.27);
    }
  }

  // ---------- curved reception desk ----------
  add(new THREE.CylinderGeometry(0.62, 0.62, 0.95, 32, 1, false, -Math.PI / 2, Math.PI), M.bone, 0.9, 0.595, 0.55);
  add(new THREE.CylinderGeometry(0.68, 0.68, 0.05, 32, 1, false, -Math.PI / 2, Math.PI), M.lime, 0.9, 1.095, 0.55);
  box(0.36, 0.22, 0.04, M.dark, 0.9, 1.24, 0.35, [-0.4, 0, 0]); // monitor

  // ---------- lounge: table, chairs, rug ----------
  box(1.2, 0.012, 1.0, M.terracotta, -0.75, 0.126, 0.65);
  cyl(0.3, 0.3, 0.04, M.wood, -0.75, 0.6, 0.65, 28);
  cyl(0.03, 0.03, 0.46, M.metal, -0.75, 0.36, 0.65, 10);
  for (const dx of [-0.5, 0.5]) {
    box(0.38, 0.06, 0.38, M.dark, -0.75 + dx, 0.45, 0.65);
    box(0.06, 0.38, 0.38, M.dark, -0.75 + dx + (dx < 0 ? -0.17 : 0.17), 0.66, 0.65);
    for (const [lx, lz] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) box(0.025, 0.32, 0.025, M.metal, -0.75 + dx + lx, 0.28, 0.65 + lz);
  }

  // ---------- plinths with display pieces ----------
  box(0.4, 0.9, 0.4, M.bone, 1.45, 0.57, -0.75);
  add(new THREE.TorusKnotGeometry(0.13, 0.045, 64, 10), M.lime, 1.45, 1.22, -0.75);
  box(0.34, 0.6, 0.34, M.dark, 0.95, 0.42, -0.95);
  add(new THREE.IcosahedronGeometry(0.16, 0), M.bone, 0.95, 0.88, -0.95);

  // ---------- plants ----------
  for (const [x, z, s] of [[-1.55, 1.15, 1], [1.6, 1.15, 0.8]] as const) {
    cyl(0.15 * s, 0.11 * s, 0.32 * s, M.dark, x, 0.12 + 0.16 * s, z, 14);
    add(new THREE.IcosahedronGeometry(0.28 * s, 0), M.leaf, x, 0.12 + 0.55 * s, z);
    add(new THREE.IcosahedronGeometry(0.18 * s, 0), M.leaf, x + 0.07, 0.12 + 0.82 * s, z + 0.04);
  }

  // ---------- hanging banner ----------
  for (const x of [-0.45, 0.45]) cyl(0.005, 0.005, 0.35, M.metal, x, 2.69, 0.2, 4);
  box(1.05, 0.5, 0.02, M.lime, 0, 2.27, 0.2);

  // ---------- visitors ----------
  const person = (x: number, z: number, alt: boolean) => {
    const mat = alt ? M.personAlt : M.person;
    add(new THREE.CapsuleGeometry(0.085, 0.42, 4, 10), mat, x, 0.42, z);
    add(new THREE.SphereGeometry(0.075, 14, 14), mat, x, 0.76, z);
  };
  person(0.2, 1.05, false);
  person(-0.3, -0.35, true);
  person(1.35, 0.95, true);
  person(2.6, 2.0, false);

  // ---------- drawing annotations (fade out as it gets built) ----------
  const annot = new THREE.Group();
  root.add(annot);
  const annotLine = new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.9 });
  const dim = (a: Vector3, b: Vector3, tickDir: Vector3) => {
    const t = tickDir.clone().multiplyScalar(0.08);
    const pts = [a, b, a.clone().add(t), a.clone().sub(t), b.clone().add(t), b.clone().sub(t)];
    annot.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), annotLine));
  };
  const labels: SpriteMaterial[] = [];
  const label = (text: string, pos: Vector3, size = 0.22) => {
    const measure = document.createElement("canvas").getContext("2d")!;
    measure.font = "500 52px monospace";
    const w = Math.ceil(measure.measureText(text).width) + 16;
    const tex = canvasTex(w, 96, (g) => {
      g.fillStyle = "#d4ff3a";
      g.font = "500 52px monospace";
      g.textBaseline = "middle";
      g.fillText(text, 8, 50);
    });
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const s = new THREE.Sprite(mat);
    s.scale.set(size * (w / 96), size, 1);
    s.position.copy(pos);
    s.center.set(0, 0.5);
    annot.add(s);
    labels.push(mat);
  };
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  dim(V(-1.9, 0.01, 1.75), V(1.9, 0.01, 1.75), V(0, 0, 1));
  label("6.00 m", V(-0.3, 0.12, 1.85));
  dim(V(2.25, 0.01, -1.4), V(2.25, 0.01, 1.4), V(1, 0, 0));
  label("4.00 m", V(2.35, 0.12, 0));
  dim(V(2.25, 0, -1.4), V(2.25, 2.9, -1.4), V(1, 0, 0));
  label("3.00 m", V(2.35, 1.5, -1.4));
  label("PLAN A-01 · STAND B-14", V(-1.9, 3.25, -1.35), 0.2);
  label("REV. 03 · SCALE 1:50", V(-1.9, 3.03, -1.35), 0.15);

  // glowing scan frame at the clip height
  const scan = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(4.2, 0.001, 3.2)),
    new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.9 }),
  );
  root.add(scan);

  camera.position.set(6.2, 4.6, 8.4);
  let level = 0;
  let yaw = 0;
  const MAX_H = 3.4;

  return {
    update(t, dt) {
      // auto ping-pong between blueprint and built, holding at each end; hover forces "built"
      const cycle = (Math.sin(t * 0.4 - Math.PI / 2) + 1) / 2;
      const auto = Math.min(1, Math.max(0, cycle * 1.3 - 0.15));
      const target = Math.max(auto, Math.min(1, ctx.hover * 1.6));
      level = damp(level, target, 2.5, dt);
      const local = -0.05 + level * MAX_H;
      const world = BASE_Y + local;
      solidClip.constant = world;
      wireClip.constant = -world;
      scan.position.y = local;
      (scan.material as import("three").LineBasicMaterial).opacity = level > 0.98 || level < 0.02 ? 0 : 0.9;
      const annotOpacity = Math.max(0, 1 - level * 1.6);
      annotLine.opacity = annotOpacity * 0.9;
      for (const m of labels) m.opacity = annotOpacity;
      annot.visible = annotOpacity > 0.01;

      yaw = damp(yaw, 0.1 + pointer.x * 0.6 + Math.sin(t * 0.2) * 0.12, 3, dt);
      root.rotation.y = yaw;
      camera.lookAt(0, 0, 0);
    },
  };
};

export default build;
