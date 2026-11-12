import { LIME, damp, displayFont, type SceneBuilder } from "./types";

/** 5 · A 3D wordmark: a thick stone "M" built from stacked layers, turning toward the cursor, with a bouncing lime dot. */
const build: SceneBuilder = ({ THREE, scene, camera, pointer }) => {
  const group = new THREE.Group();
  scene.add(group);

  const glyph = (stroke: boolean) => {
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const g = c.getContext("2d")!;
    g.font = `800 860px ${displayFont()}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    if (stroke) {
      g.strokeStyle = "#fff";
      g.lineWidth = 16;
      g.strokeText("M", 512, 560);
    } else {
      g.fillStyle = "#fff";
      g.fillText("M", 512, 560);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  };

  const fillTex = glyph(false);
  const strokeTex = glyph(true);
  const plane = new THREE.PlaneGeometry(2.8, 2.8);
  const LAYERS = 36;
  const depth = 0.55;
  const dark = new THREE.Color(0x16160f);
  const lit = new THREE.Color(0x77746a);
  for (let i = 0; i < LAYERS; i++) {
    const k = i / (LAYERS - 1);
    const mat = new THREE.MeshBasicMaterial({ map: fillTex, transparent: true, alphaTest: 0.5, color: dark.clone().lerp(lit, k * k) });
    const layer = new THREE.Mesh(plane, mat);
    layer.position.z = -depth + k * depth;
    group.add(layer);
  }
  // front face + lime edge outline (front and back)
  const face = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ map: fillTex, transparent: true, alphaTest: 0.5, color: 0x4a4840 }));
  face.position.z = 0.002;
  const edge = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ map: strokeTex, transparent: true, color: LIME, depthWrite: false }));
  edge.position.z = 0.004;
  const backEdge = edge.clone();
  backEdge.material = new THREE.MeshBasicMaterial({ map: strokeTex, transparent: true, color: LIME, opacity: 0.35, depthWrite: false });
  backEdge.position.z = -depth - 0.002;
  group.add(face, edge, backEdge);

  // the lime dot, bouncing with squash and stretch
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 32, 32),
    new THREE.MeshBasicMaterial({ color: LIME }),
  );
  group.add(dot);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 32),
    new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0.25, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(1.6, -0.9, -0.25);
  group.add(shadow);

  camera.position.set(0, 0, 7.2);
  return {
    update(t, dt) {
      group.rotation.y = damp(group.rotation.y, -0.38 + pointer.x * 0.55 + Math.sin(t * 0.5) * 0.06, 4, dt);
      group.rotation.x = damp(group.rotation.x, 0.08 + pointer.y * 0.3, 4, dt);
      const b = Math.abs(Math.sin(t * 2.4));
      const squash = b < 0.15 ? 1 - (0.15 - b) * 2 : 1;
      dot.position.set(1.6, -0.64 + b * 1.0, -0.25);
      dot.scale.set(2 - squash, squash, 2 - squash);
      shadow.scale.setScalar(1.1 - b * 0.6);
      (shadow.material as import("three").MeshBasicMaterial).opacity = 0.3 - b * 0.22;
    },
  };
};

export default build;
