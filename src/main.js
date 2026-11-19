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
const grassMat = mat(0x657c58);
const roadMat = mat(0x252b31);
const sidewalkMat = mat(0x9a9b91);
const lineMat = mat(0xe8d9a5);
const buildingMats = [0x9b9c98, 0x777f85, 0xb0a18d, 0x687b83, 0xaaa69a].map(c => mat(c));
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
        const w = 9 + Math.random() * 5;
        const d = 9 + Math.random() * 5;
        const h = 9 + Math.random() * 28;
        const building = addBox(w, h, d, buildingMats[Math.floor(Math.random() * buildingMats.length)], x, h / 2, z);
        // A few broad window bands give the blocks some city detail.
        for (let level = 1; level < Math.floor(h / 4); level++) {
          const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.65, 0.08), windowMat);
          strip.position.set(x, level * 3.2, z + d / 2 + 0.045);
          scene.add(strip);
        }
        building.userData.isBuilding = true;
      }
    }
  }
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
