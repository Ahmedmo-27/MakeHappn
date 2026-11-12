import { displayFont, INK, LIME, damp, type SceneBuilder } from "./types";

/** 1 · The 11 gates: a curved corridor of glass panels; the active gate walks forward, scroll flies through. */
const build: SceneBuilder = ({ THREE, scene, camera, pointer, ...ctx }) => {
  const COUNT = 11;
  const group = new THREE.Group();
  scene.add(group);

  const panel = new THREE.PlaneGeometry(1.5, 2.3);
  const edges = new THREE.EdgesGeometry(panel);

  const label = (n: number) => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff";
    g.font = `800 92px ${displayFont()}`;
    g.textBaseline = "middle";
    g.fillText(String(n).padStart(2, "0"), 8, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const gates = Array.from({ length: COUNT }, (_, i) => {
    const g = new THREE.Group();
    const fillMat = new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.03, side: THREE.DoubleSide, depthWrite: false });
    const lineMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.3 });
    const numMat = new THREE.MeshBasicMaterial({ map: label(i + 1), transparent: true, opacity: 0.5, depthWrite: false });
    const fill = new THREE.Mesh(panel, fillMat);
    const line = new THREE.LineSegments(edges, lineMat);
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), numMat);
    num.position.set(-0.42, 1.38, 0);
    g.add(fill, line, num);
    const a = i * 0.32;
    g.position.set(Math.sin(a) * 1.1 - 0.4, 0, -i * 1.05);
    g.rotation.y = -Math.cos(a) * 0.35 + 0.25;
    group.add(g);
    return { fillMat, lineMat, numMat, g };
  });

  // a lime floor line running through the corridor
  const pts = Array.from({ length: COUNT }, (_, i) => new THREE.Vector3(Math.sin(i * 0.32) * 1.1 - 0.4, -1.15, -i * 1.05));
  const floor = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(pts).getPoints(120)),
    new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.55 }),
  );
  group.add(floor);

  scene.fog = new THREE.Fog(0x0d0d0b, 4, 14);
  let camZ = 4.6;

  return {
    update(t, dt) {
      const active = Math.floor(t / 1.1) % COUNT;
      gates.forEach((gate, i) => {
        const isActive = i === active;
        const done = i < active;
        const targetFill = isActive ? 0.16 : done ? 0.06 : 0.025;
        gate.fillMat.color.setHex(isActive ? LIME : INK);
        gate.lineMat.color.setHex(isActive ? LIME : INK);
        gate.numMat.color.setHex(isActive ? LIME : INK);
        gate.fillMat.opacity = damp(gate.fillMat.opacity, targetFill, 8, dt);
        gate.lineMat.opacity = damp(gate.lineMat.opacity, isActive ? 1 : done ? 0.55 : 0.25, 8, dt);
        gate.numMat.opacity = damp(gate.numMat.opacity, isActive ? 1 : 0.35, 8, dt);
        gate.g.position.y = isActive ? damp(gate.g.position.y, 0.12, 6, dt) : damp(gate.g.position.y, 0, 6, dt);
      });
      const target = 4.6 - Math.min(ctx.scroll, 1.2) * 6;
      camZ = damp(camZ, target, 4, dt);
      camera.position.set(0.9 + pointer.x * 0.5, 0.35 - pointer.y * 0.3, camZ);
      camera.lookAt(-0.6, 0, camZ - 9);
    },
  };
};

export default build;
