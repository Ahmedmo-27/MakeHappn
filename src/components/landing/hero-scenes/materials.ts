import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { NUDE, damp, type SceneBuilder, type Three } from "./types";

/** Procedural 256px textures, so nothing has to be downloaded. */
function texture(THREE: Three, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  draw(c.getContext("2d")!, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 8 · Material samples: marble, brushed metal, acrylic, fabric and timber slabs that fan apart near the pointer. */
const build: SceneBuilder = ({ THREE, scene, camera, renderer, pointer, ...ctx }) => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 1.4;
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.PointLight(NUDE, 8, 10, 1.6);
  rim.position.set(-3, 1, -2);
  scene.add(rim);

  const marble = texture(THREE, (g, s) => {
    g.fillStyle = "#ebe7df";
    g.fillRect(0, 0, s, s);
    g.strokeStyle = "rgba(90,90,85,0.45)";
    for (let v = 0; v < 7; v++) {
      g.lineWidth = Math.random() * 2 + 0.5;
      g.beginPath();
      let y = Math.random() * s;
      g.moveTo(0, y);
      for (let x = 0; x <= s; x += 16) {
        y += (Math.random() - 0.5) * 22;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });
  const brushed = texture(THREE, (g, s) => {
    g.fillStyle = "#9a9a96";
    g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
      g.fillRect(0, y, s, 1);
    }
  });
  const fabric = texture(THREE, (g, s) => {
    g.fillStyle = "#7a3b2a";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 4) {
      g.fillStyle = "rgba(0,0,0,0.18)";
      g.fillRect(i, 0, 2, s);
      g.fillStyle = "rgba(255,220,200,0.08)";
      g.fillRect(0, i, s, 2);
    }
  });
  const timber = texture(THREE, (g, s) => {
    g.fillStyle = "#8a5a33";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(50,25,10,${0.15 + Math.random() * 0.2})`;
      g.lineWidth = Math.random() * 2 + 0.5;
      g.beginPath();
      const y0 = (i / 40) * s;
      g.moveTo(0, y0);
      g.bezierCurveTo(s * 0.3, y0 + 10 * Math.sin(i), s * 0.6, y0 - 10 * Math.cos(i), s, y0 + 4);
      g.stroke();
    }
  });

  const slabs = [
    { mat: new THREE.MeshStandardMaterial({ map: marble, roughness: 0.25, metalness: 0 }), size: [1.7, 0.16, 1.1] },
    { mat: new THREE.MeshStandardMaterial({ map: brushed, roughness: 0.35, metalness: 1 }), size: [1.5, 0.08, 1.0] },
    { mat: new THREE.MeshPhysicalMaterial({ color: NUDE, roughness: 0.05, transparent: true, opacity: 0.55, clearcoat: 1 }), size: [1.4, 0.1, 1.1] },
    { mat: new THREE.MeshStandardMaterial({ map: fabric, roughness: 0.95 }), size: [1.6, 0.12, 1.05] },
    { mat: new THREE.MeshStandardMaterial({ map: timber, roughness: 0.6 }), size: [1.8, 0.2, 1.0] },
  ].map((s, i) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(s.size[0], s.size[1], s.size[2], 3, 0.03), s.mat);
    scene.add(mesh);
    return {
      mesh,
      baseY: 1.0 - i * 0.5,
      baseRot: [0.35 + (Math.random() - 0.5) * 0.3, (i - 2) * 0.35, (Math.random() - 0.5) * 0.3],
      phase: i * 1.3,
    };
  });

  camera.position.set(0, 3.6, 6.4);
  camera.lookAt(0, 0, 0);
  let spread = 0;

  return {
    update(t, dt) {
      spread = damp(spread, ctx.hover, 3, dt);
      slabs.forEach((s, i) => {
        const fan = 1 + spread * 0.9;
        s.mesh.position.set(
          (i - 2) * 0.12 * fan + Math.sin(t * 0.4 + s.phase) * 0.06 + spread * (i % 2 ? 0.45 : -0.45),
          s.baseY * fan + Math.sin(t * 0.8 + s.phase) * 0.06,
          0,
        );
        s.mesh.rotation.set(
          s.baseRot[0] + pointer.y * 0.25 + spread * 0.3,
          s.baseRot[1] + t * 0.1 + pointer.x * 0.5,
          s.baseRot[2] + Math.sin(t * 0.5 + s.phase) * 0.05,
        );
      });
    },
    dispose() {
      env.dispose();
    },
  };
};

export default build;
