import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CATEGORY, PARTS, PART_BY_ID, type PartId } from "@/lib/parts";

/**
 * A graphics card built from simple shapes, close enough to the real thing to
 * recognise each part.
 *
 * Axes: X runs along the card (display bracket at -X, power stage at +X),
 * Z runs across it (the PCIe edge is at +Z), Y is up.
 *
 * For speed, every static piece is merged into one mesh per (part, material),
 * so the whole card is a few dozen draw calls. Each part is its own group, so
 * it can still be highlighted, faded and lifted away in the exploded view.
 */

export type PartNode = {
  id: PartId;
  group: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
  meshes: THREE.Mesh[];
  /** how far the part moves when the card is fully opened up */
  explode: THREE.Vector3;
};

export type GpuModel = {
  root: THREE.Group;
  parts: Record<PartId, PartNode>;
  pickables: THREE.Object3D[];
  setExplode: (f: number) => void;
  setHighlight: (id: PartId, level: number) => void;
  /** fade every part except `keep` (or restore all when `keep` is null) */
  setGhost: (keep: PartId | null) => void;
  centerOf: (id: PartId) => { center: THREE.Vector3; radius: number };
  boxOf: (id: PartId) => THREE.Box3;
  /** returns true when something moved and a new frame is needed */
  tick: (time: number) => boolean;
  dispose: () => void;
};

/* ---------- layout ---------- */

const PCB = { w: 11, d: 5, t: 0.1 };
const PCB_TOP = PCB.t / 2;
const DIE = { x: -0.8, z: -0.15, size: 2.9 };
const PKG = 3.5;
const DIE_TOP = PCB_TOP + 0.24;
const FAN_X = [-2.4, 2.4];

const EXPLODE: Record<PartId, [number, number, number]> = {
  host: [0, -0.2, 0.9],
  pcie: [0, 0, 0.45],
  cmd: [0, 0.55, 0],
  sched: [0, 0.55, 0],
  cores: [0, 0.95, 0],
  cache: [0, 0.55, 0],
  memctl: [0, 0.55, 0],
  raster: [0, 0.55, 0],
  display: [0, 0.55, 0],
  vram: [0, 0.5, 0],
  ports: [-1.0, 0, 0],
  vrm: [0, 0.45, 0],
  cooler: [0, 3.6, 0],
};

/* ---------- printed board artwork ---------- */

function boardTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const W = 2048;
  const H = Math.round((W * PCB.d) / PCB.w);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return null;

  const X = (x: number) => ((x + PCB.w / 2) / PCB.w) * W;
  const Z = (z: number) => ((z + PCB.d / 2) / PCB.d) * H;
  const S = W / PCB.w;

  g.clearRect(0, 0, W, H);

  // copper traces under the solder mask
  g.lineCap = "round";
  g.strokeStyle = "rgba(140, 214, 170, 0.32)";
  g.lineWidth = 2.2;
  const bundle = (
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    count: number,
    spread: number,
    horizontal: boolean,
  ) => {
    for (let i = 0; i < count; i++) {
      const o = (i - (count - 1) / 2) * spread;
      g.beginPath();
      if (horizontal) {
        const mid = (x0 + x1) / 2;
        g.moveTo(X(x0), Z(z0 + o));
        g.lineTo(X(mid - Math.abs(o) * 0.6), Z(z0 + o));
        g.lineTo(X(mid + Math.abs(o) * 0.6), Z(z1 + o));
        g.lineTo(X(x1), Z(z1 + o));
      } else {
        const mid = (z0 + z1) / 2;
        g.moveTo(X(x0 + o), Z(z0));
        g.lineTo(X(x0 + o), Z(mid - Math.abs(o) * 0.6));
        g.lineTo(X(x1 + o), Z(mid + Math.abs(o) * 0.6));
        g.lineTo(X(x1 + o), Z(z1));
      }
      g.stroke();
    }
  };
  // die to memory (right, left, top) and to the PCIe edge
  for (const z of [-1.3, -0.2, 0.9]) {
    bundle(DIE.x + PKG / 2, DIE.z + z * 0.55, 1.1, z, 9, 0.045, true);
    bundle(DIE.x - PKG / 2, DIE.z + z * 0.55, -2.95, z, 9, 0.045, true);
  }
  for (const x of [-1.95, -0.8, 0.35]) bundle(DIE.x + (x - DIE.x) * 0.6, DIE.z - PKG / 2, x, -1.9, 9, 0.045, false);
  bundle(DIE.x - 0.4, DIE.z + PKG / 2, -1.9, 2.45, 22, 0.06, false);
  // power planes from the VRM to the chip
  g.strokeStyle = "rgba(140, 214, 170, 0.18)";
  g.lineWidth = 16;
  for (const z of [-1.2, -0.2, 0.8]) {
    g.beginPath();
    g.moveTo(X(2.1), Z(z));
    g.lineTo(X(DIE.x + PKG / 2 + 0.1), Z(DIE.z + z * 0.4));
    g.stroke();
  }

  // vias
  g.fillStyle = "rgba(205, 225, 210, 0.55)";
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 520; i++) {
    const x = -5.3 + rand() * 10.6;
    const z = -2.35 + rand() * 4.6;
    const onDie = Math.abs(x - DIE.x) < PKG / 2 + 0.1 && Math.abs(z - DIE.z) < PKG / 2 + 0.1;
    if (onDie) continue;
    g.beginPath();
    g.arc(X(x), Z(z), 2.6, 0, Math.PI * 2);
    g.fill();
  }

  // silkscreen: part outlines and labels
  g.strokeStyle = "rgba(255, 255, 255, 0.78)";
  g.fillStyle = "rgba(255, 255, 255, 0.82)";
  g.lineWidth = 2.5;
  const outline = (x: number, z: number, w: number, d: number) =>
    g.strokeRect(X(x - w / 2) - 6, Z(z - d / 2) - 6, w * S + 12, d * S + 12);
  outline(DIE.x, DIE.z, PKG, PKG);
  for (const z of [-1.3, -0.2, 0.9]) {
    outline(1.42, z, 0.62, 0.95);
    outline(-3.02, z, 0.62, 0.95);
  }
  for (const x of [-1.95, -0.8, 0.35]) outline(x, -2.12, 0.95, 0.5);

  const label = (text: string, x: number, z: number, size = 34, align: CanvasTextAlign = "center") => {
    g.font = `600 ${size}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
    g.textAlign = align;
    g.textBaseline = "middle";
    g.fillText(text, X(x), Z(z));
  };
  label("GPU", DIE.x, DIE.z + PKG / 2 + 0.2, 30);
  label("GDDR6", 1.42, 1.65, 26);
  label("GDDR6", -3.02, 1.65, 26);
  label("VRM", 3.2, 1.75, 34);
  label("PCIe x16", -1.9, 2.25, 30);
  label("12V", 4.55, -1.55, 26);
  label("GPU EXPLORER  ·  REV 1.0", 5.2, 2.2, 22, "right");
  for (let i = 0; i < 6; i++) label(`L${i + 1}`, 2.4, -1.6 + i * 0.64 + 0.27, 18);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------- builder ---------- */

export function buildGpuModel(): GpuModel {
  const root = new THREE.Group();
  const pickables: THREE.Object3D[] = [];
  const parts = {} as Record<PartId, PartNode>;
  const disposables: { dispose: () => void }[] = [];
  const baseMaterials: THREE.MeshStandardMaterial[] = [];
  const baseMeshes: THREE.Mesh[] = [];

  for (const p of PARTS) {
    const group = new THREE.Group();
    group.name = p.id;
    root.add(group);
    parts[p.id] = {
      id: p.id,
      group,
      materials: [],
      meshes: [],
      explode: new THREE.Vector3(...EXPLODE[p.id]),
    };
  }

  /* materials */
  type MatOpts = {
    metal?: number;
    rough?: number;
    clearcoat?: number;
    map?: THREE.Texture | null;
    transparent?: boolean;
  };
  const make = (color: THREE.ColorRepresentation, o: MatOpts = {}) => {
    const m = new THREE.MeshPhysicalMaterial({
      color,
      metalness: o.metal ?? 0.05,
      roughness: o.rough ?? 0.6,
      clearcoat: o.clearcoat ?? 0,
      clearcoatRoughness: 0.35,
      map: o.map ?? null,
      transparent: o.transparent ?? false,
    });
    disposables.push(m);
    return m;
  };
  const partMat = (id: PartId, color: THREE.ColorRepresentation, o?: MatOpts) => {
    const m = make(color, o);
    parts[id].materials.push(m);
    return m;
  };
  const baseMat = (color: THREE.ColorRepresentation, o?: MatOpts) => {
    const m = make(color, o);
    baseMaterials.push(m);
    return m;
  };

  /* geometry buckets: one merged mesh per (part, material) */
  const buckets = new Map<string, { id: PartId | null; mat: THREE.Material; geos: THREE.BufferGeometry[] }>();
  const tmp = new THREE.Object3D();
  const put = (
    id: PartId | null,
    mat: THREE.Material,
    geometry: THREE.BufferGeometry,
    pos: [number, number, number],
    rot: [number, number, number] = [0, 0, 0],
  ) => {
    tmp.position.set(...pos);
    tmp.rotation.set(...rot);
    tmp.scale.set(1, 1, 1);
    tmp.updateMatrix();
    let g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    g.applyMatrix4(tmp.matrix);
    for (const name of Object.keys(g.attributes)) {
      if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
    }
    if (!g.attributes.uv) {
      g = g.clone();
      g.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(new Float32Array((g.attributes.position.count ?? 0) * 2), 2),
      );
    }
    const key = `${id ?? "_"}|${mat.uuid}`;
    let b = buckets.get(key);
    if (!b) {
      b = { id, mat, geos: [] };
      buckets.set(key, b);
    }
    b.geos.push(g);
  };

  // shared shapes
  const shapes = new Map<string, THREE.BufferGeometry>();
  const rbox = (w: number, h: number, d: number, r = 0.03) => {
    const key = `rb${w}|${h}|${d}|${r}`;
    let g = shapes.get(key);
    if (!g) {
      g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2));
      shapes.set(key, g);
    }
    return g;
  };
  const cyl = (r: number, h: number, seg = 24) => {
    const key = `cy${r}|${h}|${seg}`;
    let g = shapes.get(key);
    if (!g) {
      g = new THREE.CylinderGeometry(r, r, h, seg);
      shapes.set(key, g);
    }
    return g;
  };

  const tint = (id: PartId, towardsWhite = 0.18) =>
    new THREE.Color(CATEGORY[PART_BY_ID[id].cat].color).lerp(new THREE.Color("#ffffff"), towardsWhite);

  /* ---------- circuit board, backplate, package (not selectable) ---------- */

  const board = baseMat("#1c4a38", { rough: 0.42, clearcoat: 0.55 });
  put(null, board, rbox(PCB.w, PCB.t, PCB.d, 0.04), [0, 0, 0]);
  const backplate = baseMat("#2a2c31", { metal: 0.75, rough: 0.42 });
  put(null, backplate, rbox(PCB.w - 0.1, 0.06, PCB.d - 0.1, 0.03), [0, -0.12, 0]);

  const art = boardTexture();
  let artMesh: THREE.Mesh | null = null;
  if (art) {
    disposables.push(art);
    const artMat = new THREE.MeshBasicMaterial({ map: art, transparent: true, depthWrite: false });
    baseMaterials.push(artMat as unknown as THREE.MeshStandardMaterial);
    disposables.push(artMat);
    const plane = new THREE.PlaneGeometry(PCB.w, PCB.d);
    disposables.push(plane);
    artMesh = new THREE.Mesh(plane, artMat);
    artMesh.rotation.x = -Math.PI / 2;
    artMesh.position.y = PCB_TOP + 0.002;
    artMesh.renderOrder = 1;
    root.add(artMesh);
  }

  put(null, baseMat("#3a5249", { rough: 0.5, clearcoat: 0.3 }), rbox(PKG, 0.06, PKG, 0.05), [
    DIE.x,
    PCB_TOP + 0.03,
    DIE.z,
  ]);
  // small capacitors around the package
  const smd = baseMat("#b9a27c", { rough: 0.45, metal: 0.3 });
  for (let i = 0; i < 14; i++) {
    const t = -PKG / 2 + 0.25 + (i * (PKG - 0.5)) / 13;
    put(null, smd, rbox(0.07, 0.04, 0.12, 0.01), [DIE.x + t, PCB_TOP + 0.08, DIE.z + PKG / 2 - 0.12]);
    put(null, smd, rbox(0.12, 0.04, 0.07, 0.01), [DIE.x - PKG / 2 + 0.12, PCB_TOP + 0.08, DIE.z + t]);
  }
  const dieBody = baseMat("#16171a", { metal: 0.55, rough: 0.28, clearcoat: 0.8 });
  put(null, dieBody, rbox(DIE.size, 0.14, DIE.size, 0.03), [DIE.x, PCB_TOP + 0.13, DIE.z]);

  /* ---------- regions inside the chip ---------- */

  const tile = (id: PartId, x0: number, x1: number, z0: number, z1: number) =>
    put(
      id,
      partMat(id, tint(id, 0.08), { rough: 0.35, metal: 0.25, clearcoat: 0.6 }),
      rbox(x1 - x0, 0.06, z1 - z0, 0.02),
      [DIE.x + (x0 + x1) / 2, DIE_TOP + 0.03, DIE.z + (z0 + z1) / 2],
    );
  tile("cmd", -1.32, -0.6, -1.32, -0.52);
  tile("sched", -1.32, -0.6, -0.44, 0.32);
  tile("cache", 0.66, 1.32, -1.32, -0.52);
  tile("memctl", 0.66, 1.32, -0.44, 0.32);
  tile("raster", -1.32, -0.04, 0.42, 1.32);
  tile("display", 0.04, 1.32, 0.42, 1.32);

  // compute cores: a plate holding a grid of small processors (animated, so kept separate)
  put(
    "cores",
    partMat("cores", tint("cores", 0).multiplyScalar(0.5), { rough: 0.45, clearcoat: 0.5 }),
    rbox(1.18, 0.05, 1.7, 0.02),
    [DIE.x + 0.03, DIE_TOP + 0.025, DIE.z - 0.5],
  );
  const COLS = 5;
  const ROWS = 8;
  const coreMat = partMat("cores", "#ffffff", { rough: 0.3, metal: 0.2, clearcoat: 0.6 });
  const coreGeo = new RoundedBoxGeometry(0.16, 0.08, 0.16, 2, 0.025);
  disposables.push(coreGeo);
  const coreMesh = new THREE.InstancedMesh(coreGeo, coreMat, COLS * ROWS);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < COLS * ROWS; i++) {
    m4.makeTranslation(
      DIE.x + 0.03 - 0.42 + (i % COLS) * 0.21,
      DIE_TOP + 0.05 + 0.04,
      DIE.z - 0.5 - 0.735 + Math.floor(i / COLS) * 0.21,
    );
    coreMesh.setMatrixAt(i, m4);
  }
  const coreDim = tint("cores", 0).multiplyScalar(0.65);
  const coreBright = tint("cores", 0.6);
  const coreColor = new THREE.Color();
  for (let i = 0; i < COLS * ROWS; i++) coreMesh.setColorAt(i, coreDim);

  /* ---------- VRAM ---------- */

  const vramBody = partMat("vram", "#1b1c1f", { rough: 0.38, metal: 0.25, clearcoat: 0.4 });
  const vramMark = partMat("vram", tint("vram", 0.15), { rough: 0.5 });
  const vramChip = (x: number, z: number, w: number, d: number) => {
    put("vram", vramBody, rbox(w, 0.12, d, 0.025), [x, PCB_TOP + 0.06, z]);
    put("vram", vramMark, rbox(w * 0.5, 0.01, d * 0.18, 0.004), [x, PCB_TOP + 0.125, z - d * 0.22]);
    put("vram", vramMark, rbox(w * 0.3, 0.01, d * 0.1, 0.004), [x, PCB_TOP + 0.125, z + d * 0.05]);
  };
  for (const z of [-1.3, -0.2, 0.9]) {
    vramChip(1.42, z, 0.62, 0.95);
    vramChip(-3.02, z, 0.62, 0.95);
  }
  for (const x of [-1.95, -0.8, 0.35]) vramChip(x, -2.12, 0.95, 0.5);

  /* ---------- power delivery ---------- */

  const fet = partMat("vrm", "#232427", { rough: 0.45, metal: 0.35 });
  const choke = partMat("vrm", "#6e6f75", { rough: 0.5, metal: 0.55 });
  const chokeTop = partMat("vrm", "#9a9ba1", { rough: 0.4, metal: 0.7 });
  const capBody = partMat("vrm", "#2a2b30", { rough: 0.35, metal: 0.5 });
  const capTop = partMat("vrm", "#d0d0d5", { rough: 0.25, metal: 0.85 });
  const connector = partMat("vrm", "#141416", { rough: 0.7 });
  const pins = partMat("vrm", "#c9a646", { rough: 0.3, metal: 0.9 });
  for (let i = 0; i < 6; i++) {
    const z = -1.6 + i * 0.64;
    put("vrm", fet, rbox(0.32, 0.07, 0.36, 0.015), [2.25, PCB_TOP + 0.035, z]);
    put("vrm", choke, rbox(0.46, 0.38, 0.46, 0.05), [2.88, PCB_TOP + 0.19, z]);
    put("vrm", chokeTop, rbox(0.3, 0.012, 0.3, 0.01), [2.88, PCB_TOP + 0.386, z]);
    for (const x of [3.52, 3.9]) {
      put("vrm", capBody, cyl(0.13, 0.38), [x, PCB_TOP + 0.19, z]);
      put("vrm", capTop, cyl(0.118, 0.02), [x, PCB_TOP + 0.39, z]);
    }
  }
  // 12 V power connector on the top edge
  put("vrm", connector, rbox(1.25, 0.5, 0.55, 0.04), [4.55, PCB_TOP + 0.25, -2.12]);
  for (let i = 0; i < 6; i++)
    for (let r = 0; r < 2; r++)
      put("vrm", pins, cyl(0.045, 0.02, 10), [4.1 + i * 0.18, PCB_TOP + 0.51, -2.25 + r * 0.24]);
  put("vrm", partMat("vrm", tint("vrm", 0.1), { rough: 0.5 }), rbox(0.55, 0.06, 0.55, 0.02), [
    4.62,
    PCB_TOP + 0.03,
    0.4,
  ]);

  /* ---------- PCIe edge connector ---------- */

  put("pcie", partMat("pcie", "#1c4a38", { rough: 0.42, clearcoat: 0.55 }), rbox(4.7, PCB.t, 0.62, 0.03), [
    -1.9,
    0,
    PCB.d / 2 + 0.3,
  ]);
  const gold = partMat("pcie", "#e2b13c", { rough: 0.22, metal: 1 });
  for (let i = 0; i < 34; i++) {
    const x = -4.12 + i * 0.128 + (i > 6 ? 0.14 : 0);
    put("pcie", gold, rbox(0.085, 0.012, 0.46, 0.004), [x, PCB_TOP + 0.006, PCB.d / 2 + 0.33]);
  }

  /* ---------- display outputs and bracket ---------- */

  const steel = partMat("ports", "#c7c8cd", { rough: 0.3, metal: 0.9 });
  const shell = partMat("ports", "#a3a4a9", { rough: 0.35, metal: 0.85 });
  const socket = partMat("ports", "#111113", { rough: 0.7 });
  put("ports", steel, rbox(0.05, 2.25, 5.3, 0.02), [-5.6, 0.95, 0]);
  put("ports", steel, rbox(0.5, 0.05, 0.6, 0.02), [-5.35, 2.06, -2.1]);
  for (let i = 0; i < 4; i++) {
    const z = -1.65 + i * 1.1;
    put("ports", shell, rbox(0.72, 0.42, 0.9, 0.04), [-5.15, PCB_TOP + 0.21, z]);
    put("ports", socket, rbox(0.04, 0.24, 0.66, 0.02), [-5.62, PCB_TOP + 0.21, z]);
  }
  // vent slots in the bracket
  for (let i = 0; i < 9; i++) put("ports", socket, rbox(0.03, 0.08, 4.4, 0.02), [-5.62, 0.9 + i * 0.13, 0]);

  /* ---------- cooler ---------- */

  const copper = partMat("cooler", "#c8794a", { rough: 0.25, metal: 1 });
  const alu = partMat("cooler", "#d7d8dc", { rough: 0.32, metal: 0.85 });
  const shroudMat = partMat("cooler", "#2b2d33", { rough: 0.38, metal: 0.55, clearcoat: 0.6 });
  const trim = partMat("cooler", "#b9bac0", { rough: 0.25, metal: 0.95 });
  const bladeMat = partMat("cooler", "#202125", { rough: 0.55, metal: 0.1 });
  const hubMat = partMat("cooler", "#2f3137", { rough: 0.35, metal: 0.6, clearcoat: 0.6 });

  put("cooler", copper, rbox(DIE.size + 0.1, 0.09, DIE.size + 0.1, 0.03), [DIE.x, DIE_TOP + 0.16, DIE.z]);

  // heat pipes: run across the cold plate, then bend up into the fins
  const pipeY = DIE_TOP + 0.25;
  for (const [k, z] of [-1.05, -0.35, 0.35, 1.05].entries()) {
    const zz = DIE.z + z;
    const left = k % 2 === 0 ? -4.65 : -4.3;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(left, 1.08, zz),
      new THREE.Vector3(-3.1, 1.08, zz),
      new THREE.Vector3(-2.45, pipeY + 0.06, zz),
      new THREE.Vector3(-1.4, pipeY, zz),
      new THREE.Vector3(0.0, pipeY, zz),
      new THREE.Vector3(0.95, pipeY + 0.06, zz),
      new THREE.Vector3(1.75, 1.0, zz),
      new THREE.Vector3(4.65, 1.0, zz),
    ]);
    const tube = new THREE.TubeGeometry(curve, 80, 0.075, 12, false);
    put("cooler", copper, tube, [0, 0, 0]);
    tube.dispose();
  }

  // fin stack
  const FINS = 64;
  const finGeo = new THREE.BoxGeometry(0.022, 0.74, 4.45);
  disposables.push(finGeo);
  const fins = new THREE.InstancedMesh(finGeo, alu, FINS);
  for (let i = 0; i < FINS; i++) {
    m4.makeTranslation(-4.75 + (i * 9.5) / (FINS - 1), 1.16, 0);
    fins.setMatrixAt(i, m4);
  }

  // shroud with two fan openings
  const outline = new THREE.Shape();
  const hw = 4.95;
  const hd = 2.42;
  const rr = 0.45;
  outline.moveTo(-hw + rr, -hd);
  outline.lineTo(hw - rr, -hd);
  outline.quadraticCurveTo(hw, -hd, hw, -hd + rr);
  outline.lineTo(hw, hd - rr);
  outline.quadraticCurveTo(hw, hd, hw - rr, hd);
  outline.lineTo(-hw + rr, hd);
  outline.quadraticCurveTo(-hw, hd, -hw, hd - rr);
  outline.lineTo(-hw, -hd + rr);
  outline.quadraticCurveTo(-hw, -hd, -hw + rr, -hd);
  for (const x of FAN_X) {
    const hole = new THREE.Path();
    hole.absarc(x, 0, 1.82, 0, Math.PI * 2, true);
    outline.holes.push(hole);
  }
  const shroudGeo = new THREE.ExtrudeGeometry(outline, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 48,
  });
  disposables.push(shroudGeo);
  put("cooler", shroudMat, shroudGeo, [0, 1.6, 0], [-Math.PI / 2, 0, 0]);
  // side walls and a metal trim line
  put("cooler", shroudMat, rbox(9.9, 0.42, 0.06, 0.02), [0, 1.42, 2.39]);
  put("cooler", shroudMat, rbox(9.9, 0.42, 0.06, 0.02), [0, 1.42, -2.39]);
  put("cooler", trim, rbox(9.4, 0.03, 0.02, 0.01), [0, 1.52, 2.43]);
  for (const x of FAN_X) {
    const ring = new THREE.TorusGeometry(1.8, 0.05, 10, 64);
    put("cooler", trim, ring, [x, 1.75, 0], [Math.PI / 2, 0, 0]);
    ring.dispose();
  }

  // fans: curved blades around a hub (animated, so kept as their own groups)
  const blade = new THREE.Shape();
  blade.moveTo(0.44, -0.06);
  blade.bezierCurveTo(0.95, -0.2, 1.42, -0.12, 1.74, 0.16);
  blade.bezierCurveTo(1.58, 0.36, 1.05, 0.34, 0.44, 0.15);
  blade.lineTo(0.44, -0.06);
  const bladeGeo = new THREE.ExtrudeGeometry(blade, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 1,
    curveSegments: 16,
  });
  bladeGeo.rotateX(-Math.PI / 2);
  disposables.push(bladeGeo);
  const hubGeo = new THREE.CylinderGeometry(0.44, 0.47, 0.18, 40);
  const capGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.02, 40);
  disposables.push(hubGeo, capGeo);
  const capMat = partMat("cooler", tint("cooler", 0.1), { rough: 0.4 });

  const fans: THREE.Group[] = [];
  const BLADES = 11;
  for (const x of FAN_X) {
    const fan = new THREE.Group();
    fan.position.set(x, 1.68, 0);
    const hub = new THREE.Mesh(hubGeo, hubMat);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.1;
    fan.add(hub, cap);
    const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, BLADES);
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    for (let b = 0; b < BLADES; b++) {
      e.set(0.3, (b / BLADES) * Math.PI * 2, 0, "YXZ");
      q.setFromEuler(e);
      m4.compose(new THREE.Vector3(0, 0, 0), q, new THREE.Vector3(1, 1, 1));
      blades.setMatrixAt(b, m4);
    }
    fan.add(blades);
    for (const o of [hub, cap, blades]) {
      o.userData.part = "cooler";
      o.castShadow = true;
      pickables.push(o);
      parts.cooler.meshes.push(o as THREE.Mesh);
    }
    parts.cooler.group.add(fan);
    fans.push(fan);
  }

  /* ---------- the rest of the computer ---------- */

  const HOST_Y = -0.42;
  put("host", partMat("host", "#232a3d", { rough: 0.45, clearcoat: 0.4 }), rbox(11.4, 0.1, 3.1, 0.04), [
    -0.1,
    HOST_Y,
    4.55,
  ]);
  put("host", partMat("host", "#141518", { rough: 0.6 }), rbox(5.2, 0.34, 0.32, 0.04), [
    -1.9,
    HOST_Y + 0.22,
    PCB.d / 2 + 0.33,
  ]);
  put("host", partMat("host", "#8f9096", { rough: 0.35, metal: 0.8 }), rbox(1.8, 0.1, 1.8, 0.04), [
    2.4,
    HOST_Y + 0.1,
    4.7,
  ]);
  put("host", partMat("host", "#dcdde2", { rough: 0.22, metal: 0.95 }), rbox(1.3, 0.12, 1.3, 0.05), [
    2.4,
    HOST_Y + 0.21,
    4.7,
  ]);
  const ram = partMat("host", "#2c2f38", { rough: 0.4, metal: 0.5, clearcoat: 0.3 });
  const ramLabel = partMat("host", tint("host", 0.25), { rough: 0.5 });
  const ramSlot = partMat("host", "#141518", { rough: 0.6 });
  for (const x of [4.45, 4.85]) {
    put("host", ramSlot, rbox(0.16, 0.12, 2.6, 0.02), [x, HOST_Y + 0.11, 4.55]);
    put("host", ram, rbox(0.08, 0.62, 2.35, 0.02), [x, HOST_Y + 0.46, 4.55]);
    put("host", ramLabel, rbox(0.085, 0.18, 1.2, 0.01), [x, HOST_Y + 0.5, 4.55]);
  }

  /* ---------- turn buckets into meshes ---------- */

  for (const b of buckets.values()) {
    const merged = mergeGeometries(b.geos, false);
    b.geos.forEach((g) => g.dispose());
    if (!merged) continue;
    disposables.push(merged);
    const mesh = new THREE.Mesh(merged, b.mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (b.id) {
      mesh.userData.part = b.id;
      parts[b.id].group.add(mesh);
      parts[b.id].meshes.push(mesh);
      pickables.push(mesh);
    } else {
      root.add(mesh);
      baseMeshes.push(mesh);
    }
  }
  shapes.forEach((g) => g.dispose());

  for (const [mesh, id] of [
    [coreMesh, "cores"],
    [fins, "cooler"],
  ] as const) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.part = id;
    parts[id].group.add(mesh);
    parts[id].meshes.push(mesh);
    pickables.push(mesh);
  }

  /* ---------- behaviour ---------- */

  for (const p of PARTS) {
    const c = new THREE.Color(CATEGORY[p.cat].color);
    parts[p.id].materials.forEach((m) => {
      m.emissive = c.clone();
      m.emissiveIntensity = 0;
    });
  }

  const setOpacity = (m: THREE.MeshStandardMaterial, opacity: number) => {
    const ghost = opacity < 1;
    if (m.transparent !== ghost && m !== (artMesh?.material as unknown)) {
      m.transparent = ghost;
      m.needsUpdate = true;
    }
    m.opacity = opacity;
    if (m !== (artMesh?.material as unknown)) m.depthWrite = !ghost;
  };

  const box3 = new THREE.Box3();
  const sphere = new THREE.Sphere();
  let lastTime = -1;

  return {
    root,
    parts,
    pickables,
    setExplode(f) {
      for (const p of PARTS) parts[p.id].group.position.copy(parts[p.id].explode).multiplyScalar(f);
    },
    setHighlight(id, level) {
      parts[id].materials.forEach((m) => {
        m.emissiveIntensity = level;
      });
    },
    setGhost(keep) {
      for (const p of PARTS) {
        const faded = !!keep && p.id !== keep;
        parts[p.id].materials.forEach((m) => setOpacity(m, faded ? 0.08 : 1));
        parts[p.id].meshes.forEach((m) => {
          m.castShadow = !faded;
        });
      }
      baseMaterials.forEach((m) => setOpacity(m, keep ? 0.2 : 1));
      baseMeshes.forEach((m) => {
        m.castShadow = !keep;
      });
    },
    centerOf(id) {
      box3.setFromObject(parts[id].group).getBoundingSphere(sphere);
      return { center: sphere.center.clone(), radius: sphere.radius };
    },
    boxOf(id) {
      return new THREE.Box3().setFromObject(parts[id].group);
    },
    tick(time) {
      if (time === lastTime) return false;
      lastTime = time;
      fans.forEach((f, i) => {
        f.rotation.y = -time * (4.2 + i * 0.35);
      });
      for (let i = 0; i < COLS * ROWS; i++) {
        const k = 0.5 + 0.5 * Math.sin(time * 3 + i * 1.7);
        coreMesh.setColorAt(i, coreColor.copy(coreDim).lerp(coreBright, k * k));
      }
      if (coreMesh.instanceColor) coreMesh.instanceColor.needsUpdate = true;
      return true;
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
