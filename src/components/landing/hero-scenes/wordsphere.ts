import { PROJECT_STAGES, STAGE_LABELS, STUDIO_PRODUCTS, STUDIO_PRODUCT_LABELS } from "@/lib/domain";
import { INK, LIME, damp, displayFont, type SceneBuilder } from "./types";

/** 7 · Word sphere: the 11 stages and 6 products orbit on a slow globe; the word nearest the pointer lights up. */
const build: SceneBuilder = ({ THREE, scene, camera, pointer, ...ctx }) => {
  const group = new THREE.Group();
  scene.add(group);

  const words = [
    ...PROJECT_STAGES.map((s) => STAGE_LABELS[s].short),
    ...STUDIO_PRODUCTS.map((p) => STUDIO_PRODUCT_LABELS[p]),
  ];

  const font = displayFont();
  const R = 2.05;
  const items = words.map((word, i) => {
    const c = document.createElement("canvas");
    const g = c.getContext("2d")!;
    g.font = `700 64px ${font}`;
    const w = Math.ceil(g.measureText(word).width) + 24;
    c.width = w;
    c.height = 96;
    g.font = `700 64px ${font}`;
    g.fillStyle = "#fff";
    g.textBaseline = "middle";
    g.fillText(word, 12, 50);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, color: INK, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    const base = 0.22;
    sprite.scale.set((w / 96) * base, base, 1);
    // fibonacci sphere
    const y = 1 - (i / (words.length - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const phi = i * Math.PI * (3 - Math.sqrt(5));
    sprite.position.set(Math.cos(phi) * r * R, y * R, Math.sin(phi) * r * R);
    group.add(sprite);
    return { sprite, mat, aspect: w / 96, base, glow: 0 };
  });

  // faint wire globe + lime equator for structure
  const globe = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 0.82, 2)),
    new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.06 }),
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(R * 1.12, 0.004, 6, 160),
    new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0.4 }),
  );
  ring.rotation.x = Math.PI / 2.3;
  group.add(globe);
  scene.add(ring);

  camera.position.set(0, 0, 9.6);
  const world = new THREE.Vector3();
  const lime = new THREE.Color(LIME);
  const ink = new THREE.Color(INK);

  return {
    update(t, dt) {
      group.rotation.y += dt * 0.12 + pointer.x * dt * 0.25;
      group.rotation.x = damp(group.rotation.x, pointer.y * 0.35, 3, dt);
      ring.rotation.z = t * 0.06;

      let nearest = -1;
      let best = 0.32;
      items.forEach((it, i) => {
        it.sprite.getWorldPosition(world);
        const depth = (world.z / R + 1) / 2; // 0 back .. 1 front
        world.project(camera);
        const d = Math.hypot(world.x - ctx.local.x, world.y - ctx.local.y);
        if (depth > 0.45 && d < best) {
          best = d;
          nearest = i;
        }
        it.mat.opacity = 0.15 + depth * 0.85;
      });
      items.forEach((it, i) => {
        it.glow = damp(it.glow, i === nearest ? 1 : 0, 8, dt);
        const s = it.base * (1 + it.glow * 0.7);
        it.sprite.scale.set(it.aspect * s, s, 1);
        it.mat.color.copy(ink).lerp(lime, it.glow);
      });
    },
  };
};

export default build;
