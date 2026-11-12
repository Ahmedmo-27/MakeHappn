import type { BufferGeometry, Material, Object3D, Vector3 } from "three";
import { LIME, damp, easeOut, type SceneBuilder } from "./types";

/**
 * 2 · The pavilion that builds itself: a full event pavilion (deck, slatted roof,
 * LED wall, stage with truss and speakers, bar, lounge, planters, pendant and
 * string lights, signage and guests) assembles piece by piece; the pointer orbits it.
 */
const build: SceneBuilder = ({ THREE, scene, camera, pointer }) => {
  const root = new THREE.Group();
  root.position.y = -1.15;
  scene.add(root);

  // ---------- lighting ----------
  scene.add(new THREE.HemisphereLight(0xf2efe8, 0x0d0d0b, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(5, 8, 4);
  scene.add(key);
  const rim = new THREE.PointLight(LIME, 10, 12, 1.4);
  rim.position.set(-3.5, 3, -3);
  scene.add(rim);
  const warm = new THREE.PointLight(0xffc98a, 4, 6, 1.6);
  warm.position.set(0, 2.1, 0.2);
  scene.add(warm);

  // ---------- materials ----------
  const M = {
    dark: new THREE.MeshStandardMaterial({ color: 0x1d1d1a, roughness: 0.75, metalness: 0.1 }),
    bone: new THREE.MeshStandardMaterial({ color: 0xe6e1d4, roughness: 0.55 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x7a5233, roughness: 0.7 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0xa5764a, roughness: 0.65 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8c8c86, roughness: 0.3, metalness: 0.85 }),
    lime: new THREE.MeshStandardMaterial({ color: LIME, roughness: 0.4, emissive: LIME, emissiveIntensity: 0.3 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0x8a3f2c, roughness: 0.95 }),
    rug: new THREE.MeshStandardMaterial({ color: 0x2c2b27, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3d5a32, roughness: 0.8, flatShading: true }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffe7b8 }),
    limeGlow: new THREE.MeshBasicMaterial({ color: LIME }),
    person: new THREE.MeshStandardMaterial({ color: 0xbdb8ab, roughness: 0.8 }),
    personAlt: new THREE.MeshStandardMaterial({ color: 0x5b5a54, roughness: 0.8 }),
  };
  const edgeMat = new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.45 });

  // LED wall texture
  const led = (() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, "#0d0d0b");
    grad.addColorStop(1, "#23300a");
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = "#d4ff3a";
    for (let i = 0; i < 26; i++) g.fillRect(20 + i * 18, 200 - Math.abs(Math.sin(i * 0.7)) * 70, 10, 4);
    g.font = "800 54px sans-serif";
    g.fillStyle = "#f2efe8";
    g.fillText("MAKE IT", 26, 82);
    g.fillStyle = "#d4ff3a";
    g.fillText("HAPPEN.", 26, 140);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const screenMat = new THREE.MeshBasicMaterial({ map: led });

  // ---------- assembly bookkeeping ----------
  type Part = { obj: Object3D; target: Vector3; from: Vector3; delay: number };
  const parts: Part[] = [];
  const part = (obj: Object3D, x: number, y: number, z: number, lift = 3) => {
    const target = new THREE.Vector3(x, y, z);
    const from = new THREE.Vector3(x * 1.25, y + lift + parts.length * 0.03, z * 1.25);
    obj.position.copy(from);
    obj.scale.setScalar(0.001);
    root.add(obj);
    parts.push({ obj, target, from, delay: 0.2 + parts.length * 0.075 });
    return obj;
  };
  const mesh = (geo: BufferGeometry, mat: Material, edges = false) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, mat));
    if (edges) g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), edgeMat));
    return g;
  };
  const at = (obj: Object3D, x: number, y: number, z: number, ry = 0) => {
    obj.position.set(x, y, z);
    obj.rotation.y = ry;
    return obj;
  };
  const box = (w: number, h: number, d: number, mat: Material, edges = false) => mesh(new THREE.BoxGeometry(w, h, d), mat, edges);
  const cyl = (rt: number, rb: number, h: number, mat: Material, seg = 20) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);

  // ---------- ground ----------
  const grid = new THREE.GridHelper(12, 48, LIME, 0x24241f);
  const gm = grid.material as Material;
  gm.transparent = true;
  gm.opacity = 0.28;
  root.add(grid);
  const path = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.6, 0.005, 5.5), new THREE.Vector3(0.6, 0.005, 2.3)]),
    new THREE.LineDashedMaterial({ color: LIME, dashSize: 0.12, gapSize: 0.08 }),
  );
  path.computeLineDistances();
  root.add(path);

  // ---------- platform, deck, steps, ramp ----------
  part(box(5.2, 0.22, 3.6, M.dark, true), 0, 0.11, 0);
  const deck = new THREE.Group();
  for (let i = 0; i < 13; i++) deck.add(at(box(5.1, 0.025, 0.25, i % 2 ? M.wood : M.woodLight), 0, 0, -1.68 + i * 0.28));
  part(deck, 0, 0.235, 0);
  for (let s = 0; s < 3; s++) part(box(1.3, (s + 1) * 0.075, 0.26, M.dark, true), 0.6, ((s + 1) * 0.075) / 2, 1.93 + (2 - s) * 0.26, 1.5);
  const ramp = box(1.6, 0.04, 0.8, M.metal);
  ramp.rotation.z = Math.atan2(0.22, 1.6);
  part(ramp, 3.35, 0.11, 1.1, 1.5);

  // ---------- columns ----------
  for (const x of [-2.45, 2.45]) {
    for (const z of [-1.65, 0, 1.65]) {
      const col = new THREE.Group();
      col.add(cyl(0.055, 0.055, 2.7, M.metal, 12));
      col.add(at(box(0.24, 0.03, 0.24, M.dark), 0, -1.35, 0));
      part(col, x, 1.6, z, 2);
    }
  }

  // ---------- roof: frame, slats, fascia ----------
  part(box(5.5, 0.1, 3.9, M.dark, true), 0, 2.98, 0, 2);
  const slats = new THREE.Group();
  for (let i = 0; i < 22; i++) slats.add(at(box(0.07, 0.07, 3.9, M.woodLight), -2.6 + i * 0.248, 0, 0));
  part(slats, 0, 3.07, 0, 2);
  part(box(5.6, 0.22, 0.05, M.lime), 0, 2.86, 1.98, 2);
  part(box(0.05, 0.22, 3.95, M.lime), -2.78, 2.86, 0, 2);
  part(box(0.05, 0.22, 3.95, M.lime), 2.78, 2.86, 0, 2);

  // ---------- back wall + LED screen + logo ----------
  part(box(4.8, 2.5, 0.1, M.bone, true), 0, 1.5, -1.72);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), screenMat);
  part(screen, 0, 1.75, -1.66);
  part(box(2.75, 1.45, 0.04, M.dark), 0, 1.75, -1.69);

  // ---------- stage, truss, speakers, mic ----------
  part(box(2.6, 0.32, 1.1, M.dark, true), 0, 0.39, -1.05);
  const truss = new THREE.Group();
  const post = (x: number) => {
    const p = new THREE.Group();
    for (const [dx, dz] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) p.add(at(box(0.015, 2.2, 0.015, M.metal), dx, 0, dz));
    const zig: Vector3[] = [];
    for (let i = 0; i <= 14; i++) zig.push(new THREE.Vector3(i % 2 ? 0.06 : -0.06, -1.1 + i * (2.2 / 14), 0.06));
    p.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(zig), new THREE.LineBasicMaterial({ color: 0x8c8c86 })));
    return at(p, x, 0, 0);
  };
  truss.add(post(-1.35), post(1.35));
  truss.add(at(box(2.85, 0.13, 0.13, M.metal), 0, 1.1, 0));
  for (const x of [-0.8, 0, 0.8]) {
    const spot = cyl(0.05, 0.08, 0.16, M.dark, 12);
    spot.rotation.x = 0.6;
    truss.add(at(spot, x, 0.98, 0.08));
  }
  part(truss, 0, 1.65, -0.62, 2);
  for (const x of [-1.15, 1.15]) {
    const stack = new THREE.Group();
    stack.add(at(box(0.36, 0.5, 0.34, M.dark, true), 0, 0, 0));
    stack.add(at(box(0.3, 0.36, 0.3, M.dark, true), 0, 0.43, 0));
    const cone = mesh(new THREE.CircleGeometry(0.11, 20), M.metal);
    cone.position.set(0, 0, 0.175);
    stack.add(cone);
    part(stack, x, 0.8, -0.7);
  }
  const mic = new THREE.Group();
  mic.add(at(cyl(0.012, 0.012, 0.75, M.metal, 8), 0, 0.37, 0));
  mic.add(at(cyl(0.11, 0.11, 0.02, M.metal), 0, 0, 0));
  mic.add(at(mesh(new THREE.SphereGeometry(0.035, 12, 12), M.dark), 0, 0.77, 0));
  part(mic, 0.35, 0.56, -0.75);

  // ---------- bar with back shelf, bottles, stools ----------
  part(box(1.5, 0.95, 0.45, M.bone, true), 1.55, 0.72, 0.55);
  part(box(1.62, 0.05, 0.58, M.lime), 1.55, 1.22, 0.55);
  part(box(1.4, 0.05, 0.25, M.wood), 1.55, 1.25, -0.25);
  const bottles = new THREE.Group();
  const bottleMats = [M.lime, M.bone, M.fabric, M.metal];
  for (let i = 0; i < 9; i++) {
    const b = cyl(0.03, 0.035, 0.2 + (i % 3) * 0.04, bottleMats[i % 4], 10);
    bottles.add(at(b, -0.62 + i * 0.155, 0.12, 0));
  }
  part(bottles, 1.55, 1.27, -0.25);
  for (let i = 0; i < 3; i++) {
    const stool = new THREE.Group();
    stool.add(at(cyl(0.13, 0.13, 0.05, M.dark), 0, 0.62, 0));
    stool.add(at(cyl(0.02, 0.02, 0.6, M.metal, 8), 0, 0.31, 0));
    stool.add(at(cyl(0.12, 0.12, 0.02, M.metal), 0, 0, 0));
    part(stool, 1.05 + i * 0.5, 0.25, 1.1);
  }

  // ---------- lounge: rug, sofa, table, poufs ----------
  part(box(2.0, 0.015, 1.5, M.rug), -1.45, 0.255, 0.6);
  const sofa = new THREE.Group();
  sofa.add(at(box(1.5, 0.22, 0.55, M.fabric), 0, 0, 0));
  sofa.add(at(box(1.5, 0.35, 0.14, M.fabric), 0, 0.2, -0.22));
  sofa.add(at(box(0.14, 0.3, 0.55, M.fabric), -0.75, 0.08, 0));
  sofa.add(at(box(0.14, 0.3, 0.55, M.fabric), 0.75, 0.08, 0));
  part(sofa, -1.45, 0.38, 0.15);
  const table = new THREE.Group();
  table.add(at(cyl(0.32, 0.32, 0.04, M.lime, 28), 0, 0.2, 0));
  table.add(at(cyl(0.05, 0.12, 0.2, M.metal, 12), 0, 0.09, 0));
  part(table, -1.45, 0.26, 0.85);
  for (const x of [-2.1, -0.8]) part(cyl(0.16, 0.18, 0.24, M.bone, 18), x, 0.37, 1.05);

  // ---------- planters ----------
  for (const [x, z, s] of [[-2.3, -1.4, 1], [2.3, 1.45, 0.85], [-2.3, 1.5, 0.75], [2.25, -1.35, 0.9]] as const) {
    const plant = new THREE.Group();
    plant.add(at(cyl(0.16 * s, 0.12 * s, 0.32 * s, M.dark, 16), 0, 0.16 * s, 0));
    plant.add(at(mesh(new THREE.IcosahedronGeometry(0.3 * s, 0), M.leaf), 0, 0.5 * s, 0));
    plant.add(at(mesh(new THREE.IcosahedronGeometry(0.2 * s, 0), M.leaf), 0.08 * s, 0.78 * s, 0.05));
    part(plant, x, 0.24, z);
  }

  // ---------- pendant lights + string lights ----------
  const pendants = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const x = -1.6 + i * 0.8;
    const drop = 0.55 + (i % 2) * 0.2;
    pendants.add(at(cyl(0.006, 0.006, drop, M.dark, 4), x, -drop / 2, 0.4));
    pendants.add(at(mesh(new THREE.SphereGeometry(0.075, 16, 16), M.glow), x, -drop, 0.4));
  }
  part(pendants, 0, 2.93, 0, 1.2);
  const string = new THREE.Group();
  const bulbs: Object3D[] = [];
  for (let i = 0; i < 18; i++) {
    const u = i / 17;
    const x = -2.6 + u * 5.2;
    const sag = Math.sin(u * Math.PI * 3) ** 2 * 0.16;
    const b = at(mesh(new THREE.SphereGeometry(0.035, 10, 10), M.limeGlow), x, -sag, 0);
    bulbs.push(b);
    string.add(b);
  }
  part(string, 0, 2.7, 2.02, 1.2);

  // ---------- signage totem ----------
  const sign = (() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#d4ff3a";
    g.fillRect(0, 0, 128, 512);
    g.save();
    g.translate(84, 490);
    g.rotate(-Math.PI / 2);
    g.fillStyle = "#0d0d0b";
    g.font = "800 62px sans-serif";
    g.fillText("makehappn.", 0, 0);
    g.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const totem = new THREE.Group();
  totem.add(box(0.42, 2.0, 0.16, M.dark, true));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 1.86), new THREE.MeshBasicMaterial({ map: sign }));
  face.position.z = 0.085;
  totem.add(face);
  part(totem, -3.4, 1.0, 1.9);

  // ---------- guests ----------
  const guests: Object3D[] = [];
  for (const [x, z, alt] of [[0.7, 3.2, 0], [1.3, 1.25, 1], [-0.4, 0.4, 0], [-2.0, 0.45, 1], [0.2, -0.5, 1], [3.0, 2.6, 0]] as const) {
    const p = new THREE.Group();
    const mat = alt ? M.personAlt : M.person;
    p.add(at(mesh(new THREE.CapsuleGeometry(0.085, 0.42, 4, 10), mat), 0, 0.3, 0));
    p.add(at(mesh(new THREE.SphereGeometry(0.075, 14, 14), mat), 0, 0.64, 0));
    const onDeck = Math.abs(x) < 2.6 && Math.abs(z) < 1.8;
    guests.push(part(p, x, onDeck ? 0.25 : 0, z, 1.2));
  }

  camera.position.set(0, 4.4, 12.6);
  let yaw = -0.55;

  return {
    update(t, dt) {
      for (const p of parts) {
        const k = easeOut((t - p.delay) / 0.85);
        p.obj.position.lerpVectors(p.from, p.target, k);
        p.obj.scale.setScalar(Math.max(0.001, k));
      }
      // life: twinkling string lights, pulsing LED, swaying guests
      bulbs.forEach((b, i) => b.scale.setScalar(0.7 + 0.5 * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7))));
      screenMat.color.setScalar(0.8 + 0.2 * Math.sin(t * 1.4));
      guests.forEach((g, i) => (g.rotation.y = Math.sin(t * 0.6 + i) * 0.6));
      warm.intensity = 4 + Math.sin(t * 2.1) * 0.6;

      yaw = damp(yaw, -0.55 + pointer.x * 0.9 + Math.sin(t * 0.15) * 0.15, 3, dt);
      root.rotation.y = yaw;
      root.rotation.x = damp(root.rotation.x, pointer.y * 0.1, 3, dt);
      camera.lookAt(0, 0.1, 0);
    },
  };
};

export default build;
