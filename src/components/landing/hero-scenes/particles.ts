import { damp, type SceneBuilder } from "./types";

/** 6 · Idea cloud: thousands of points drift as a loose cloud ("ideas") and snap into a built pavilion ("happen") on hover or on a slow cycle. */
const build: SceneBuilder = ({ THREE, scene, camera, renderer, pointer, ...ctx }) => {
  const COUNT = 7000;

  // draw a pavilion elevation on an offscreen canvas and sample its pixels as targets
  const c = document.createElement("canvas");
  c.width = 1000;
  c.height = 900;
  const g = c.getContext("2d")!;
  g.strokeStyle = "#fff";
  g.fillStyle = "#fff";
  g.lineWidth = 16;
  g.lineJoin = "round";
  g.lineCap = "round";
  // canopy
  g.beginPath();
  g.moveTo(110, 250);
  g.lineTo(500, 110);
  g.lineTo(890, 250);
  g.closePath();
  g.stroke();
  g.fillRect(140, 250, 720, 26);
  // columns
  for (const x of [170, 380, 620, 830]) g.fillRect(x - 9, 276, 18, 430);
  // back screen and stage
  g.strokeRect(330, 360, 340, 190);
  g.fillRect(260, 610, 480, 22);
  // platform + steps
  g.fillRect(90, 706, 820, 30);
  g.fillRect(380, 736, 240, 22);
  g.fillRect(420, 758, 160, 22);
  // the dot: "it happened"
  g.beginPath();
  g.arc(500, 455, 34, 0, Math.PI * 2);
  g.fill();
  const data = g.getImageData(0, 0, c.width, c.height).data;
  const filled: number[] = [];
  for (let y = 0; y < c.height; y += 2) {
    for (let x = 0; x < c.width; x += 2) {
      if (data[(y * c.width + x) * 4 + 3] > 128) filled.push(x, y);
    }
  }
  const worldW = 3.6;
  const scale = worldW / c.width;

  const cloud = new Float32Array(COUNT * 3);
  const target = new Float32Array(COUNT * 3);
  const rand = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    // cloud: soft gaussian-ish blob
    const u = Math.random() * Math.PI * 2;
    const v = Math.acos(2 * Math.random() - 1);
    const r = 1.9 * Math.cbrt(Math.random());
    cloud[i * 3] = r * Math.sin(v) * Math.cos(u) * 1.25;
    cloud[i * 3 + 1] = r * Math.sin(v) * Math.sin(u);
    cloud[i * 3 + 2] = r * Math.cos(v);
    const p = filled.length ? Math.floor((Math.random() * filled.length) / 2) * 2 : 0;
    target[i * 3] = (filled[p] ?? 600) * scale - worldW / 2 + (Math.random() - 0.5) * 0.012;
    target[i * 3 + 1] = -((filled[p + 1] ?? 180) * scale - (c.height * scale) / 2);
    target[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    rand[i] = Math.random();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(cloud, 3));
  geo.setAttribute("aTarget", new THREE.BufferAttribute(target, 3));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));

  const uniforms = {
    uMix: { value: 0 },
    uTime: { value: 0 },
    uPixel: { value: renderer.getPixelRatio() },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uMix;
      uniform float uTime;
      uniform float uPixel;
      attribute vec3 aTarget;
      attribute float aRand;
      varying float vMix;
      void main() {
        float m = smoothstep(0.0, 1.0, clamp(uMix * 1.5 - aRand * 0.5, 0.0, 1.0));
        vMix = m;
        vec3 drift = vec3(
          sin(uTime * 0.6 + aRand * 40.0),
          cos(uTime * 0.5 + aRand * 30.0),
          sin(uTime * 0.4 + aRand * 20.0)
        ) * 0.12 * (1.0 - m);
        vec3 p = mix(position + drift, aTarget, m);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (mix(2.2, 1.6, m) + aRand * 1.4) * uPixel * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vMix;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = 1.0 - smoothstep(0.0, 0.5, d);
        vec3 ink = vec3(1.0, 1.0, 1.0);
        vec3 nude = vec3(0.882, 0.863, 0.847);
        gl_FragColor = vec4(mix(ink, nude, vMix), a * mix(0.55, 0.95, vMix));
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  camera.position.set(0, 0, 7);

  return {
    update(t, dt) {
      uniforms.uTime.value = t;
      // a slow automatic cycle so it reads without hovering; hover snaps it into the word
      const auto = Math.sin(t * 0.55) > 0.2 ? 1 : 0;
      const goal = ctx.hover > 0.25 ? 1 : auto;
      uniforms.uMix.value = damp(uniforms.uMix.value, goal, 2.2, dt);
      const loose = 1 - uniforms.uMix.value;
      points.rotation.y = damp(points.rotation.y, (Math.sin(t * 0.2) * 0.6 + pointer.x * 0.4) * loose, 3, dt);
      points.rotation.x = damp(points.rotation.x, pointer.y * 0.2 * loose, 3, dt);
    },
  };
};

export default build;
