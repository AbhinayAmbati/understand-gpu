import * as THREE from "three";
import { CATEGORY, PARTS, PART_BY_ID, type PartId } from "@/lib/parts";

/**
 * A simplified graphics card built from primitive shapes.
 * Axes: X runs along the card (display bracket at -X, power stage at +X),
 * Z runs across it (the PCIe edge is at +Z), Y is up.
 * Every part is its own group so it can be highlighted, ghosted and lifted
 * away from the board in the exploded view.
 */

export type PartNode = {
  id: PartId;
  group: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
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
  tick: (time: number, animate: boolean) => void;
  dispose: () => void;
};

const PCB_TOP = 0.06;
const DIE = { x: -0.8, z: -0.2 };

const EXPLODE: Record<PartId, [number, number, number]> = {
  host: [0, 0, 1.3],
  pcie: [0, 0, 0.35],
  cmd: [0, 0.6, 0],
  sched: [0, 0.6, 0],
  cores: [0, 1.05, 0],
  cache: [0, 0.6, 0],
  memctl: [0, 0.6, 0],
  raster: [0, 0.6, 0],
  display: [0, 0.6, 0],
  vram: [0, 0.6, 0],
  ports: [-0.9, 0, 0],
  vrm: [0, 0.5, 0],
  cooler: [0, 3.5, 0],
};

export function buildGpuModel(): GpuModel {
  const root = new THREE.Group();
  const pickables: THREE.Object3D[] = [];
  const baseMaterials: THREE.MeshStandardMaterial[] = [];
  const parts = {} as Record<PartId, PartNode>;
  const disposables: { dispose: () => void }[] = [];

  for (const p of PARTS) {
    const group = new THREE.Group();
    group.name = p.id;
    root.add(group);
    parts[p.id] = { id: p.id, group, materials: [], explode: new THREE.Vector3(...EXPLODE[p.id]) };
  }

  const std = (
    color: THREE.ColorRepresentation,
    opts: { metal?: number; rough?: number } = {},
  ) =>
    new THREE.MeshStandardMaterial({
      color,
      metalness: opts.metal ?? 0.1,
      roughness: opts.rough ?? 0.6,
    });

  /** material owned by one part */
  const partMat = (
    id: PartId,
    color: THREE.ColorRepresentation,
    opts?: { metal?: number; rough?: number },
  ) => {
    const m = std(color, opts);
    parts[id].materials.push(m);
    disposables.push(m);
    return m;
  };

  const baseMat = (color: THREE.ColorRepresentation, opts?: { metal?: number; rough?: number }) => {
    const m = std(color, opts);
    baseMaterials.push(m);
    disposables.push(m);
    return m;
  };

  const geo = <T extends THREE.BufferGeometry>(g: T) => {
    disposables.push(g);
    return g;
  };

  const addTo = (id: PartId | null, mesh: THREE.Object3D) => {
    if (id) {
      mesh.userData.part = id;
      parts[id].group.add(mesh);
      pickables.push(mesh);
    } else {
      root.add(mesh);
    }
    return mesh;
  };

  const box = (
    id: PartId | null,
    material: THREE.Material,
    size: [number, number, number],
    pos: [number, number, number],
  ) => {
    const mesh = new THREE.Mesh(geo(new THREE.BoxGeometry(...size)), material);
    mesh.position.set(...pos);
    return addTo(id, mesh) as THREE.Mesh;
  };

  const cylinder = (
    id: PartId | null,
    material: THREE.Material,
    radius: number,
    height: number,
    pos: [number, number, number],
  ) => {
    const mesh = new THREE.Mesh(geo(new THREE.CylinderGeometry(radius, radius, height, 28)), material);
    mesh.position.set(...pos);
    return addTo(id, mesh) as THREE.Mesh;
  };

  const tint = (id: PartId, towardsWhite = 0.18) =>
    new THREE.Color(CATEGORY[PART_BY_ID[id].cat].color).lerp(new THREE.Color("#ffffff"), towardsWhite);

  /* ---------- circuit board and chip body (not selectable) ---------- */

  const pcb = baseMat("#1b4a37", { rough: 0.75 });
  box(null, pcb, [11, 0.12, 5], [0, 0, 0]);
  box(null, baseMat("#4c6b60", { rough: 0.7 }), [3.3, 0.08, 3.3], [DIE.x, PCB_TOP + 0.04, DIE.z]);
  box(null, baseMat("#232326", { rough: 0.35, metal: 0.4 }), [2.9, 0.14, 2.9], [DIE.x, PCB_TOP + 0.15, DIE.z]);
  const dieTop = PCB_TOP + 0.22;

  /* ---------- blocks inside the chip ---------- */

  const tile = (id: PartId, x0: number, x1: number, z0: number, z1: number) =>
    box(
      id,
      partMat(id, tint(id), { rough: 0.4, metal: 0.2 }),
      [x1 - x0, 0.09, z1 - z0],
      [DIE.x + (x0 + x1) / 2, dieTop + 0.045, DIE.z + (z0 + z1) / 2],
    );

  tile("cmd", -1.32, -0.56, -1.32, -0.52);
  tile("sched", -1.32, -0.56, -0.44, 0.32);
  tile("cache", 0.64, 1.32, -1.32, -0.52);
  tile("memctl", 0.64, 1.32, -0.44, 0.32);
  tile("raster", -1.32, -0.04, 0.4, 1.32);
  tile("display", 0.04, 1.32, 0.4, 1.32);

  // compute cores: a base plate with a grid of small processors on it
  box(
    "cores",
    partMat("cores", tint("cores", 0).multiplyScalar(0.55), { rough: 0.5 }),
    [1.12, 0.06, 1.64],
    [DIE.x + 0.04, dieTop + 0.03, DIE.z - 0.5],
  );
  const COLS = 5;
  const ROWS = 8;
  const coreMat = partMat("cores", "#ffffff", { rough: 0.35, metal: 0.15 });
  const coreMesh = new THREE.InstancedMesh(
    geo(new THREE.BoxGeometry(0.15, 0.13, 0.15)),
    coreMat,
    COLS * ROWS,
  );
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < COLS * ROWS; i++) {
    const cx = DIE.x + 0.04 - 0.4 + (i % COLS) * 0.2;
    const cz = DIE.z - 0.5 - 0.7 + Math.floor(i / COLS) * 0.2;
    m4.makeTranslation(cx, dieTop + 0.06 + 0.065, cz);
    coreMesh.setMatrixAt(i, m4);
  }
  const coreDim = tint("cores", 0).multiplyScalar(0.7);
  const coreBright = tint("cores", 0.55);
  const coreColor = new THREE.Color();
  for (let i = 0; i < COLS * ROWS; i++) coreMesh.setColorAt(i, coreDim);
  addTo("cores", coreMesh);
  disposables.push(coreMesh);

  /* ---------- VRAM chips around the GPU ---------- */

  const vramBody = partMat("vram", "#2a2a2e", { rough: 0.45, metal: 0.3 });
  const vramMark = partMat("vram", tint("vram", 0.1), { rough: 0.5 });
  const vramChip = (x: number, z: number, w: number, d: number) => {
    box("vram", vramBody, [w, 0.14, d], [x, PCB_TOP + 0.07, z]);
    box("vram", vramMark, [w * 0.55, 0.012, d * 0.3], [x, PCB_TOP + 0.146, z]);
  };
  [-1.3, -0.2, 0.9].forEach((z) => vramChip(1.42, z, 0.62, 0.95));
  [-1.95, -0.8, 0.35].forEach((x) => vramChip(x, -2.14, 0.95, 0.5));

  /* ---------- power delivery ---------- */

  const fet = partMat("vrm", "#2a2a2e", { rough: 0.5, metal: 0.3 });
  const choke = partMat("vrm", "#77777d", { rough: 0.55, metal: 0.5 });
  const capBody = partMat("vrm", "#2b2b30", { rough: 0.4, metal: 0.4 });
  const capTop = partMat("vrm", "#c9c9ce", { rough: 0.3, metal: 0.8 });
  for (let i = 0; i < 6; i++) {
    const z = -1.6 + i * 0.64;
    box("vrm", fet, [0.3, 0.08, 0.34], [2.25, PCB_TOP + 0.04, z]);
    box("vrm", choke, [0.44, 0.4, 0.44], [2.85, PCB_TOP + 0.2, z]);
    for (const x of [3.5, 3.88]) {
      cylinder("vrm", capBody, 0.13, 0.4, [x, PCB_TOP + 0.2, z]);
      cylinder("vrm", capTop, 0.115, 0.02, [x, PCB_TOP + 0.41, z]);
    }
  }
  box("vrm", partMat("vrm", "#1d1d1f", { rough: 0.6 }), [1.3, 0.55, 0.5], [4.55, PCB_TOP + 0.275, -2.1]);
  box("vrm", partMat("vrm", tint("vrm", 0.1), { rough: 0.5 }), [0.55, 0.08, 0.55], [4.6, PCB_TOP + 0.04, 0.4]);

  /* ---------- PCIe edge connector ---------- */

  box("pcie", partMat("pcie", "#1b4a37", { rough: 0.75 }), [4.6, 0.12, 0.6], [-1.9, 0, 2.8]);
  const gold = partMat("pcie", "#e0ac2b", { rough: 0.28, metal: 0.95 });
  const fingers = new THREE.InstancedMesh(geo(new THREE.BoxGeometry(0.085, 0.02, 0.46)), gold, 32);
  for (let i = 0; i < 32; i++) {
    // a gap after the first few fingers, like the notch in a real connector
    const x = -4.05 + i * 0.135 + (i > 5 ? 0.14 : 0);
    m4.makeTranslation(x, PCB_TOP + 0.01, 2.85);
    fingers.setMatrixAt(i, m4);
  }
  addTo("pcie", fingers);
  disposables.push(fingers);

  /* ---------- display outputs and bracket ---------- */

  const steel = partMat("ports", "#b9b9be", { rough: 0.35, metal: 0.85 });
  const housing = partMat("ports", "#8e8e93", { rough: 0.4, metal: 0.8 });
  const socket = partMat("ports", "#1d1d1f", { rough: 0.6 });
  box("ports", steel, [0.06, 2.3, 5.2], [-5.56, 0.95, 0]);
  for (let i = 0; i < 4; i++) {
    const z = -1.65 + i * 1.1;
    box("ports", housing, [0.72, 0.42, 0.92], [-5.16, PCB_TOP + 0.21, z]);
    box("ports", socket, [0.03, 0.24, 0.7], [-5.6, PCB_TOP + 0.21, z]);
  }

  /* ---------- cooler: cold plate, heat pipes, fins, shroud, fans ---------- */

  const copper = partMat("cooler", "#c77c48", { rough: 0.3, metal: 0.9 });
  const alu = partMat("cooler", "#d3d3d8", { rough: 0.35, metal: 0.75 });
  const shroudMat = partMat("cooler", "#2c2c2e", { rough: 0.55, metal: 0.2 });
  const bladeMat = partMat("cooler", "#3a3a3d", { rough: 0.5, metal: 0.2 });

  box("cooler", copper, [3.3, 0.12, 3.3], [DIE.x, 0.62, DIE.z]);
  for (const z of [-0.95, 0, 0.95]) {
    const pipe = cylinder("cooler", copper, 0.085, 9.3, [0, 0.76, z]);
    pipe.rotation.z = Math.PI / 2;
  }
  const FINS = 42;
  const fins = new THREE.InstancedMesh(geo(new THREE.BoxGeometry(0.035, 0.86, 4.5)), alu, FINS);
  for (let i = 0; i < FINS; i++) {
    m4.makeTranslation(-4.6 + (i * 9.2) / (FINS - 1), 1.15, 0);
    fins.setMatrixAt(i, m4);
  }
  addTo("cooler", fins);
  disposables.push(fins);

  const FAN_X = [-2.35, 2.35];
  const outline = new THREE.Shape();
  const hw = 4.8;
  const hd = 2.4;
  const r = 0.35;
  outline.moveTo(-hw + r, -hd);
  outline.lineTo(hw - r, -hd);
  outline.quadraticCurveTo(hw, -hd, hw, -hd + r);
  outline.lineTo(hw, hd - r);
  outline.quadraticCurveTo(hw, hd, hw - r, hd);
  outline.lineTo(-hw + r, hd);
  outline.quadraticCurveTo(-hw, hd, -hw, hd - r);
  outline.lineTo(-hw, -hd + r);
  outline.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  for (const x of FAN_X) {
    const hole = new THREE.Path();
    hole.absarc(x, 0, 1.78, 0, Math.PI * 2, true);
    outline.holes.push(hole);
  }
  const shroud = new THREE.Mesh(
    geo(new THREE.ExtrudeGeometry(outline, { depth: 0.1, bevelEnabled: false, curveSegments: 40 })),
    shroudMat,
  );
  shroud.rotation.x = -Math.PI / 2;
  shroud.position.y = 1.62;
  addTo("cooler", shroud);

  const fans: THREE.Group[] = [];
  const bladeGeo = geo(new THREE.BoxGeometry(1.2, 0.025, 0.46));
  const hubGeo = geo(new THREE.CylinderGeometry(0.46, 0.46, 0.2, 32));
  for (const x of FAN_X) {
    const fan = new THREE.Group();
    fan.position.set(x, 1.66, 0);
    const hub = new THREE.Mesh(hubGeo, shroudMat);
    hub.userData.part = "cooler";
    fan.add(hub);
    pickables.push(hub);
    for (let b = 0; b < 9; b++) {
      const arm = new THREE.Group();
      arm.rotation.y = (b / 9) * Math.PI * 2;
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.x = 1.02;
      blade.rotation.x = 0.5;
      blade.userData.part = "cooler";
      arm.add(blade);
      pickables.push(blade);
      fan.add(arm);
    }
    parts.cooler.group.add(fan);
    fans.push(fan);
  }

  /* ---------- the rest of the computer: motherboard, CPU, RAM ---------- */

  const HOST_Y = -0.2;
  box("host", partMat("host", "#27314d", { rough: 0.75 }), [11.6, 0.12, 2.9], [-0.1, HOST_Y, 4.75]);
  box("host", partMat("host", "#1d1d1f", { rough: 0.6 }), [5.1, 0.34, 0.3], [-1.9, HOST_Y + 0.23, 3.5]);
  box("host", partMat("host", "#9a9aa0", { rough: 0.4, metal: 0.8 }), [1.7, 0.1, 1.7], [2.4, HOST_Y + 0.11, 4.9]);
  box("host", partMat("host", "#dcdce1", { rough: 0.25, metal: 0.9 }), [1.25, 0.12, 1.25], [2.4, HOST_Y + 0.22, 4.9]);
  const ram = partMat("host", tint("host", 0.05), { rough: 0.5 });
  for (const x of [4.5, 4.9]) box("host", ram, [0.1, 0.62, 2.3], [x, HOST_Y + 0.37, 4.75]);

  /* ---------- behaviour ---------- */

  const allPartMaterials = PARTS.flatMap((p) => parts[p.id].materials);
  for (const p of PARTS) {
    const c = new THREE.Color(CATEGORY[p.cat].color);
    parts[p.id].materials.forEach((m) => {
      m.emissive = c.clone();
      m.emissiveIntensity = 0;
    });
  }

  const setOpacity = (m: THREE.MeshStandardMaterial, opacity: number) => {
    const ghost = opacity < 1;
    if (m.transparent !== ghost) {
      m.transparent = ghost;
      m.needsUpdate = true;
    }
    m.opacity = opacity;
    m.depthWrite = !ghost;
  };

  const box3 = new THREE.Box3();
  const sphere = new THREE.Sphere();

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
        const opacity = keep && p.id !== keep ? 0.07 : 1;
        parts[p.id].materials.forEach((m) => setOpacity(m, opacity));
      }
      baseMaterials.forEach((m) => setOpacity(m, keep ? 0.22 : 1));
    },
    centerOf(id) {
      box3.setFromObject(parts[id].group).getBoundingSphere(sphere);
      return { center: sphere.center.clone(), radius: sphere.radius };
    },
    tick(time, animate) {
      if (!animate) return;
      fans.forEach((f) => {
        f.rotation.y = -time * 5;
      });
      for (let i = 0; i < COLS * ROWS; i++) {
        const k = 0.5 + 0.5 * Math.sin(time * 3.2 + i * 1.7);
        coreMesh.setColorAt(i, coreColor.copy(coreDim).lerp(coreBright, k * k));
      }
      if (coreMesh.instanceColor) coreMesh.instanceColor.needsUpdate = true;
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
      allPartMaterials.length = 0;
    },
  };
}
