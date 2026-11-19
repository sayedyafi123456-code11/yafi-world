import * as THREE from 'three';
import './style.css';

const app = document.querySelector('#app');
const loading = document.querySelector('#loading');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb9c8);
scene.fog = new THREE.Fog(0x9bb9c8, 65, 230);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 5, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdceeff, 0x52604d, 2.0));
const sun = new THREE.DirectionalLight(0xffedcf, 2.5);
sun.position.set(-35, 65, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -85;
sun.shadow.camera.right = 85;
sun.shadow.camera.top = 85;
sun.shadow.camera.bottom = -85;
scene.add(sun);

const mat = (color, roughness = 0.9) => new THREE.MeshStandardMaterial({ color, roughness });
const grassMat = mat(0x557b4b);
const roadMat = mat(0x303536);
const sidewalkMat = mat(0x9a9b91);
const lineMat = mat(0xe8d9a5);
const buildingMats = [0xd8c49a, 0xe3d7bd, 0xc6b58e, 0xb8c5a0, 0xd6bca0].map(c => mat(c));
const roofMat = mat(0x8d3e2d);
const waterMat = new THREE.MeshStandardMaterial({ color: 0x397f91, roughness: 0.24, metalness: 0.18 });
const windowMat = new THREE.MeshStandardMaterial({ color: 0x9cc4d4, roughness: 0.28, metalness: 0.15 });

function addBox(w, h, d, material, x, y, z, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// Ground and a simple crossroad city grid.
addBox(500, 1, 500, grassMat, 0, -0.55, 0, false);
for (let i = -2; i <= 2; i++) {
  addBox(12, 0.08, 500, roadMat, i * 42, 0.02, 0, false);
  addBox(500, 0.08, 12, roadMat, 0, 0.025, i * 42, false);
  addBox(0.16, 0.02, 500, lineMat, i * 42, 0.08, 0, false);
  addBox(500, 0.02, 0.16, lineMat, 0, 0.08, i * 42, false);
}
for (let i = -2; i <= 2; i++) {
  for (let j = -2; j <= 2; j++) {
    if (i === 0 && j === 0) continue;
    const cx = i * 42;
    const cz = j * 42;
    addBox(16, 0.35, 16, sidewalkMat, cx + 13, 0.12, cz + 13, false);
    // Buildings stay outside the roads, with varied heights and setbacks.
    for (let bx = 0; bx < 2; bx++) {
      for (let bz = 0; bz < 2; bz++) {
        const x = cx + (bx ? 1 : -1) * (12 + Math.random() * 4);
        const z = cz + (bz ? 1 : -1) * (12 + Math.random() * 4);
        const w = 8 + Math.random() * 3;
        const d = 8 + Math.random() * 3;
        const h = 4.2 + Math.random() * 5.5;
        const building = addBox(w, h, d, buildingMats[Math.floor(Math.random() * buildingMats.length)], x, h / 2, z);
        // A few broad window bands give the blocks some city detail.
        for (let level = 1; level < Math.floor(h / 4); level++) {
          const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.58, 0.38, 0.08), windowMat);
          strip.position.set(x, level * 3.2, z + d / 2 + 0.045);
          scene.add(strip);
        }
        building.userData.isBuilding = true;
      }
    }
  }
}

// Malappuram-inspired Kerala neighbourhood: tiled-roof homes, palms, river and green hills.
const houseWallMats = [0xe5d8bd, 0xd8c8a7, 0xd8dfc9, 0xd6bca4].map(c => mat(c));
for (let i = 0; i < 18; i++) {
  const x = -82 + (i % 6) * 31 + (Math.random() - 0.5) * 8;
  const z = -28 + Math.floor(i / 6) * 27 + (Math.random() - 0.5) * 7;
  if (Math.abs(x) < 18 && Math.abs(z) < 18) continue;
  const w = 7 + Math.random() * 2;
  const d = 7 + Math.random() * 2;
  const walls = addBox(w, 3.4, d, houseWallMats[i % houseWallMats.length], x, 1.7, z);
  // Two sloping terracotta roof panels form a simple Kerala-style tiled roof.
  const roofA = new THREE.Mesh(new THREE.BoxGeometry(w * 0.76, 0.28, d + 1.2), roofMat);
  roofA.position.set(x - w * 0.22, 3.75, z);
  roofA.rotation.z = -0.48;
  roofA.castShadow = true; scene.add(roofA);
  const roofB = new THREE.Mesh(new THREE.BoxGeometry(w * 0.76, 0.28, d + 1.2), roofMat);
  roofB.position.set(x + w * 0.22, 3.75, z);
  roofB.rotation.z = 0.48;
  roofB.castShadow = true; scene.add(roofB);
  addBox(1.2, 2.2, 0.12, mat(0x68452e), x, 1.1, z + d / 2 + 0.07, false);
}

// Backwater-like river ribbon at the edge of the playable town, with grassy banks.
addBox(190, 0.22, 11, waterMat, 0, -0.12, -91, false);
addBox(190, 0.28, 2.2, mat(0x78915b), 0, 0.02, -97.2, false);
addBox(190, 0.28, 2.2, mat(0x78915b), 0, 0.02, -84.8, false);
// Low-poly green hills on the distant horizon.
const hillMat = mat(0x456c45);
for (let i = 0; i < 13; i++) {
  const hill = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), hillMat);
  hill.position.set(-125 + i * 21, -1.2, -132 - Math.random() * 12);
  hill.scale.set(17 + Math.random() * 12, 11 + Math.random() * 9, 20 + Math.random() * 10);
  hill.receiveShadow = true; scene.add(hill);
}

// Coconut palms with curved-looking fronds, kept lightweight for mobile.
const palmTrunkMat = mat(0x765437);
const palmLeafMat = mat(0x28633b);
function addPalm(x, z, height = 8) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.32, height, 7), palmTrunkMat);
  trunk.position.set(x, height / 2, z);
  trunk.rotation.z = (Math.random() - 0.5) * 0.13;
  trunk.castShadow = true; scene.add(trunk);
  const top = new THREE.Vector3(x, height, z);
  for (let k = 0; k < 7; k++) {
    const angle = (k / 7) * Math.PI * 2;
    const end = new THREE.Vector3(x + Math.cos(angle) * 3.4, height - 1.15 + Math.sin(k * 2) * 0.35, z + Math.sin(angle) * 3.4);
    const mid = top.clone().lerp(end, 0.52);
    const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.12, mid.distanceTo(end) * 1.45, 5), palmLeafMat);
    leaf.position.copy(mid).lerp(end, 0.35);
    leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(top).normalize());
    leaf.castShadow = true; scene.add(leaf);
  }
}
for (let i = 0; i < 34; i++) {
  const x = -94 + Math.random() * 188;
  const z = -78 + Math.random() * 155;
  if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;
  addPalm(x, z, 7 + Math.random() * 3);
}

// Street trees: simple low-cost shapes.
const trunkMat = mat(0x594532);
const leafMat = mat(0x315c3d);
for (let i = -4; i <= 4; i++) {
  for (let j = -4; j <= 4; j++) {
    if (Math.abs(i) < 1 && Math.abs(j) < 1) continue;
    const x = i * 21 + (i % 2 ? 3 : -3);
    const z = j * 21 + (j % 2 ? -3 : 3);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.3, 6), trunkMat);
    trunk.position.set(x, 1.15, z);
    scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1), leafMat);
    crown.position.set(x, 3, z);
    crown.scale.set(1, 1.15, 1);
    scene.add(crown);
  }
}


// CINEMATIC WORLD DETAIL PASS — roads, street furniture, parked traffic and sky.
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(460, 24, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x315b82) },
      horizonColor: { value: new THREE.Color(0xd8b98d) }
    },
    vertexShader: `varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }`,
    fragmentShader: `uniform vec3 topColor;
      uniform vec3 horizonColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float blend = smoothstep(-0.08, 0.52, h);
        vec3 color = mix(horizonColor, topColor, blend);
        gl_FragColor = vec4(color, 1.0);
      }`
  })
);
sky.renderOrder = -10;
scene.add(sky);

const roadDashMat = new THREE.MeshStandardMaterial({ color: 0xe7dfc5, roughness: 0.85 });
const lampMetal = mat(0x29343a, 0.55);
const lampGlow = new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffc45d, emissiveIntensity: 1.8 });
const carPaints = [0x263e53, 0x8e3027, 0xb6b9b4, 0x252a2d, 0xc5a65d].map(c => new THREE.MeshStandardMaterial({ color: c, metalness: 0.42, roughness: 0.32 }));
const rubber = mat(0x17191a, 0.98);
const glass = new THREE.MeshStandardMaterial({ color: 0x253e4c, metalness: 0.25, roughness: 0.2 });

function addStreetLamp(x, z, rot = 0) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, 5.5, 7), lampMetal);
  pole.position.set(x, 2.75, z);
  pole.castShadow = true;
  scene.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.09, 0.09), lampMetal);
  arm.position.set(x + Math.cos(rot) * 0.48, 5.35, z + Math.sin(rot) * 0.48);
  arm.rotation.y = -rot;
  scene.add(arm);
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.13, 0.28), lampGlow);
  bulb.position.set(x + Math.cos(rot) * 0.92, 5.27, z + Math.sin(rot) * 0.92);
  scene.add(bulb);
}
function addParkedCar(x, z, rotation = 0, colorIndex = 0) {
  const car = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.72, 4.1), carPaints[colorIndex % carPaints.length]);
  shell.position.y = 0.72;
  shell.castShadow = true;
  shell.receiveShadow = true;
  car.add(shell);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.72, 2.0), glass);
  cabin.position.set(0, 1.38, -0.12);
  cabin.castShadow = true;
  car.add(cabin);
  for (const wx of [-1.04, 1.04]) {
    for (const wz of [-1.35, 1.35]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 12), rubber);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.43, wz);
      car.add(wheel);
    }
  }
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd98a, emissiveIntensity: 0.5 });
  for (const lx of [-0.68, 0.68]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.06), headlightMat);
    light.position.set(lx, 0.82, 2.08);
    car.add(light);
  }
  car.position.set(x, 0.08, z);
  car.rotation.y = rotation;
  scene.add(car);
}
function addRoadDash(x, z, horizontal) {
  const dash = new THREE.Mesh(new THREE.BoxGeometry(horizontal ? 3.2 : 0.16, 0.025, horizontal ? 0.16 : 3.2), roadDashMat);
  dash.position.set(x, 0.09, z);
  scene.add(dash);
}

// Dashed lane markings replace the empty stretches of asphalt with readable road detail.
for (let road = -2; road <= 2; road++) {
  for (let p = -240; p <= 240; p += 12) {
    addRoadDash(road * 42, p, false);
    addRoadDash(p, road * 42, true);
  }
}
// Lamps and a few parked vehicles give the streets a lived-in scale.
for (let road = -2; road <= 2; road++) {
  for (let p = -168; p <= 168; p += 42) {
    addStreetLamp(road * 42 + 7.7, p + 8, 0);
    addStreetLamp(p - 8, road * 42 - 7.7, Math.PI / 2);
  }
}
const parked = [
  [-7.8, 17, 0, 1], [7.8, -24, Math.PI, 2], [-49.8, 7, Math.PI / 2, 0],
  [49.8, -33, -Math.PI / 2, 3], [91.8, 50, Math.PI / 2, 4],
  [-91.8, -75, -Math.PI / 2, 1], [33.8, 91, 0, 2]
];
for (const [x, z, r, c] of parked) addParkedCar(x, z, r, c);

// A warm low sun and soft ambient fill make the Kerala-inspired town feel less flat.
const sunDisc = new THREE.Mesh(
  new THREE.SphereGeometry(5.5, 20, 16),
  new THREE.MeshBasicMaterial({ color: 0xffd9a1 })
);
sunDisc.position.set(-105, 72, -205);
scene.add(sunDisc);

// Player placeholder: original low-poly explorer character.
const player = new THREE.Group();
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.9, 4, 8), mat(0x263b52));
body.position.y = 1.05;
body.castShadow = true;
player.add(body);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mat(0xc89570));
head.position.y = 1.95;
head.castShadow = true;
player.add(head);
player.position.set(0, 0, 0);
scene.add(player);

const keys = new Set();
addEventListener('keydown', e => keys.add(e.key.toLowerCase()));
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

let yaw = 0;
let pitch = -0.16;
let dragging = false;
let lastX = 0;
let lastY = 0;
renderer.domElement.addEventListener('pointerdown', e => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointerup', () => dragging = false);
renderer.domElement.addEventListener('pointercancel', () => dragging = false);
renderer.domElement.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  yaw -= dx * 0.004;
  pitch = THREE.MathUtils.clamp(pitch - dy * 0.003, -0.8, 0.25);
  lastX = e.clientX; lastY = e.clientY;
});

const touchMoves = new Set();
document.querySelectorAll('[data-move]').forEach(button => {
  const move = button.dataset.move;
  button.addEventListener('pointerdown', e => { e.preventDefault(); touchMoves.add(move); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(type => button.addEventListener(type, () => touchMoves.delete(move)));
});

const clock = new THREE.Clock();
const direction = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
function update(dt) {
  const forwardInput = (keys.has('w') || keys.has('arrowup') || touchMoves.has('forward') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') || touchMoves.has('back') ? 1 : 0);
  const sideInput = (keys.has('d') || keys.has('arrowright') || touchMoves.has('right') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') || touchMoves.has('left') ? 1 : 0);
  forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  right.set(Math.cos(yaw), 0, -Math.sin(yaw));
  direction.copy(forward).multiplyScalar(forwardInput).addScaledVector(right, sideInput);
  if (direction.lengthSq() > 0) {
    direction.normalize();
    player.position.addScaledVector(direction, 8 * dt);
    player.rotation.y = Math.atan2(direction.x, direction.z);
  }
  player.position.x = THREE.MathUtils.clamp(player.position.x, -95, 95);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -95, 95);
  const target = player.position.clone().add(new THREE.Vector3(0, 1.45, 0));
  const camOffset = new THREE.Vector3(Math.sin(yaw) * 7, 3.2 + pitch * 2, Math.cos(yaw) * 7);
  camera.position.lerp(target.clone().add(camOffset), 1 - Math.pow(0.001, dt));
  camera.lookAt(target);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  update(dt);
  renderer.render(scene, camera);
}
animate();
loading.classList.add('hidden');

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setSize(innerWidth, innerHeight);
});
