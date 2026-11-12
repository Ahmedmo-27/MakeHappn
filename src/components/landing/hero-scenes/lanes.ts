import { INK, NUDE, damp, type SceneBuilder } from "./types";

/** 3 · Three lanes, one record: three ribbons braid into one strand with projects travelling along them. */
const build: SceneBuilder = ({ THREE, scene, camera, pointer, ...ctx }) => {
  const group = new THREE.Group();
  scene.add(group);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(3, 4, 5);
  scene.add(key);

  class Braid extends THREE.Curve<import("three").Vector3> {
    constructor(private phase: number) {
      super();
    }
    getPoint(t: number, target = new THREE.Vector3()) {
      const a = t * Math.PI * 5 + this.phase;
      const r = 0.95 * (1 - t * 0.88);
      return target.set(Math.cos(a) * r, (t - 0.5) * 4.4, Math.sin(a) * r);
    }
  }

  const lanes = [
    { color: NUDE, phase: 0, wire: false },
    { color: 0xffffff, phase: (Math.PI * 2) / 3, wire: false },
    { color: 0xffffff, phase: (Math.PI * 4) / 3, wire: true },
  ].map(({ color, phase, wire }) => {
    const curve = new Braid(phase);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 320, 0.045, 10, false),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.2,
        emissive: color,
        emissiveIntensity: wire ? 0 : 0.35,
        wireframe: wire,
      }),
    );
    group.add(tube);
    const dotGeo = new THREE.SphereGeometry(0.075, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: INK });
    const dots = Array.from({ length: 4 }, (_, i) => {
      const d = new THREE.Mesh(dotGeo, dotMat);
      group.add(d);
      return { mesh: d, offset: i / 4 };
    });
    return { curve, dots };
  });

  // the single strand the lanes resolve into
  const strand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: INK, emissive: INK, emissiveIntensity: 0.3 }),
  );
  strand.position.y = 2.65;
  group.add(strand);

  camera.position.set(0, 0, 7.5);
  group.rotation.z = -0.35;
  let spread = 1;
  const tmp = new THREE.Vector3();

  return {
    update(t, dt) {
      spread = damp(spread, 1 + ctx.hover * 0.9, 4, dt);
      group.scale.set(spread, 1, spread);
      group.rotation.y = t * 0.25 + pointer.x * 0.6;
      group.rotation.x = damp(group.rotation.x, pointer.y * 0.25, 3, dt);
      for (const lane of lanes) {
        for (const d of lane.dots) {
          const u = (t * 0.07 + d.offset) % 1;
          d.mesh.position.copy(lane.curve.getPoint(u, tmp));
          d.mesh.scale.set(1 / spread, 1, 1 / spread);
        }
      }
      camera.lookAt(0, 0, 0);
    },
  };
};

export default build;
