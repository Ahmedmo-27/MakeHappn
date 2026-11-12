import { INK, NUDE, damp, type SceneBuilder } from "./types";

/** 9 · Spotlight on an empty stage: a dark set where only the spotlight (following the cursor) reveals the props. */
const build: SceneBuilder = ({ THREE, scene, camera, renderer, ...ctx }) => {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  scene.add(new THREE.AmbientLight(0xffffff, 0.07));
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a3a34, roughness: 0.8 });
  const bone = new THREE.MeshStandardMaterial({ color: 0xe8e3d6, roughness: 0.55 });
  const lime = new THREE.MeshStandardMaterial({ color: NUDE, roughness: 0.4 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x8c8c86, roughness: 0.3, metalness: 0.8 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x8f8b80, roughness: 0.6 });

  const mesh = (geo: import("three").BufferGeometry, mat: import("three").Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };

  mesh(new THREE.PlaneGeometry(30, 14), dark, 0, 0, 0).rotation.x = -Math.PI / 2;
  mesh(new THREE.PlaneGeometry(30, 9), dark, 0, 4.5, -3);
  mesh(new THREE.BoxGeometry(4.2, 0.3, 2.4), dark, 0, 0.15, -1.4);
  // mic stand
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), metal, -0.6, 1.05, -0.9);
  mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 24), metal, -0.6, 0.315, -0.9);
  mesh(new THREE.SphereGeometry(0.07, 16, 16), metal, -0.6, 1.83, -0.9);
  // screen
  mesh(new THREE.BoxGeometry(2.2, 1.25, 0.06), screenMat, 0.7, 1.55, -2.5);
  // pedestals with objects
  mesh(new THREE.BoxGeometry(0.5, 0.9, 0.5), bone, 1.9, 0.45, 0.4);
  mesh(new THREE.SphereGeometry(0.22, 32, 32), lime, 1.9, 1.12, 0.4);
  mesh(new THREE.BoxGeometry(0.45, 0.6, 0.45), bone, -2.0, 0.3, 0.6);
  mesh(new THREE.TorusKnotGeometry(0.14, 0.05, 80, 12), lime, -2.0, 0.85, 0.6);
  // chair
  mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), metal, 0.3, 0.75, -0.9);
  mesh(new THREE.BoxGeometry(0.5, 0.55, 0.06), metal, 0.3, 1.05, -1.13);
  for (const [x, z] of [[0.08, -0.68], [0.52, -0.68], [0.08, -1.12], [0.52, -1.12]]) mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), metal, x, 0.52, z);

  const spot = new THREE.SpotLight(INK, 120, 20, 0.4, 0.55, 1.2);
  spot.position.set(0, 6, 3);
  spot.castShadow = true;
  spot.shadow.mapSize.set(512, 512);
  scene.add(spot, spot.target);

  // fake light cone: apex at the light, open base toward the target
  const coneGeo = new THREE.ConeGeometry(1, 1, 48, 1, true);
  coneGeo.translate(0, -0.5, 0);
  coneGeo.rotateX(-Math.PI / 2);
  const cone = new THREE.Mesh(
    coneGeo,
    new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  scene.add(cone);

  // full-bleed framing: look left of the set so the stage sits to the right of the headline
  const CAM_X = -2.4;
  camera.position.set(CAM_X, 2.4, 7.4);
  camera.lookAt(CAM_X, 0.8, -0.6);

  const ray = new THREE.Raycaster();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  const aim = new THREE.Vector3(0, 0, -0.6);
  const ndc = new THREE.Vector2();
  let lastLocal = "";
  let idle = 0;

  return {
    update(t, dt) {
      const key = `${ctx.local.x.toFixed(3)},${ctx.local.y.toFixed(3)}`;
      idle = key === lastLocal ? idle + dt : 0;
      lastLocal = key;
      let goal: import("three").Vector3;
      if (idle < 2.5) {
        ndc.set(Math.max(-1, Math.min(1, ctx.local.x)), Math.max(-1, Math.min(1, ctx.local.y)));
        ray.setFromCamera(ndc, camera);
        goal = ray.ray.intersectPlane(floor, hit) ?? aim;
      } else {
        goal = hit.set(Math.sin(t * 0.5) * 2.4 + 0.2, 0, Math.sin(t * 0.8) * 0.9 - 0.4);
      }
      goal.x = Math.max(-7.5, Math.min(4, goal.x));
      goal.z = Math.max(-2.6, Math.min(2.4, goal.z));
      const k = 1 - Math.exp(-4 * dt);
      aim.lerp(goal, k);
      spot.target.position.copy(aim);
      spot.position.x = damp(spot.position.x, aim.x * 0.7, 2, dt);

      const dist = spot.position.distanceTo(aim);
      const radius = Math.tan(spot.angle) * dist;
      cone.position.copy(spot.position);
      cone.lookAt(aim);
      cone.scale.set(radius, radius, dist);
    },
  };
};

export default build;
