"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { buildGpuModel, type GpuModel } from "@/lib/gpu3d";
import { CATEGORY, PART_BY_ID, type PartId } from "@/lib/parts";
import { Icon } from "@/components/ui";

/** direction the camera looks from in the overview */
const VIEW_DIR = new THREE.Vector3(0.5, 0.72, 1).normalize();
const FOV = 30;

type Stage = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  model: GpuModel;
  explode: { f: number };
  /** bounding sphere of the whole scene, for framing the overview */
  bounds: THREE.Box3;
  invalidate: (shadows?: boolean) => void;
  paint: () => void;
};

export default function Gpu3D({
  selected = null,
  isolate = false,
  onSelect,
  className = "",
  showOpen = true,
}: {
  /** the part the camera is focused on; null shows the whole card */
  selected?: PartId | null;
  /** fade out everything except the selected part */
  isolate?: boolean;
  onSelect?: (id: PartId) => void;
  className?: string;
  /** show the "Open up" slider */
  showOpen?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const hoveredRef = useRef<PartId | null>(null);
  const selectedRef = useRef<PartId | null>(selected);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(100);
  const [tip, setTip] = useState<{ id: PartId; x: number; y: number } | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  /* ---------- set up the scene once ---------- */
  useEffect(() => {
    const host = wrap.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      // no WebGL in this browser: the page still works, without the 3D view
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
      return;
    }
    let pixelRatio = Math.min(window.devicePixelRatio, 1.75);
    renderer.setPixelRatio(pixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false; // shadows are recomputed only when something moves
    const canvas = renderer.domElement;
    canvas.className = "block h-full w-full outline-none";
    host.prepend(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);

    // studio lighting: an environment for reflections, one shadow-casting key light
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.85;
    scene.add(new THREE.HemisphereLight("#ffffff", "#d5d8e0", 0.35));
    const key = new THREE.DirectionalLight("#ffffff", 1.6);
    key.position.set(4, 14, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -9;
    key.shadow.camera.right = 9;
    key.shadow.camera.top = 9;
    key.shadow.camera.bottom = -9;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
    scene.add(key);
    const rim = new THREE.DirectionalLight("#e4ecff", 0.45);
    rim.position.set(-9, 6, -8);
    scene.add(rim);

    // a soft shadow on an invisible floor grounds the card
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.13 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.1;
    floor.receiveShadow = true;
    scene.add(floor);

    const model = buildGpuModel();
    const explode = { f: 1 };
    model.setExplode(explode.f);
    scene.add(model.root);

    const bounds = new THREE.Box3().setFromObject(model.root);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.enableZoom = false; // the page scrolls with the wheel; zoom uses the buttons
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = 1.48;
    controls.rotateSpeed = 0.65;
    canvas.style.touchAction = "pan-y"; // a vertical swipe still scrolls the page

    /* rendering on demand */
    let dirty = true;
    let shadowDirty = true;
    const invalidate = (shadows = false) => {
      dirty = true;
      if (shadows) shadowDirty = true;
    };
    controls.addEventListener("change", () => invalidate());

    const paint = () => {
      for (const id of Object.keys(model.parts) as PartId[]) {
        model.setHighlight(
          id,
          id === selectedRef.current ? 0.5 : id === hoveredRef.current ? 0.35 : 0,
        );
      }
      invalidate();
    };

    stage.current = { camera, controls, model, explode, bounds, invalidate, paint };

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      invalidate();
    };
    resize();
    const home = overview(stage.current);
    camera.position.copy(home.position);
    controls.target.copy(home.target);
    controls.update();

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) invalidate();
    });
    io.observe(host);

    /* hover and click */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;

    // faded parts should not block clicks on what is behind them
    const solid = (o: THREE.Object3D) => {
      const m = (o as THREE.Mesh).material as THREE.Material;
      return !!m && m.opacity > 0.5;
    };
    const pick = (e: PointerEvent): PartId | null => {
      const r = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(model.pickables, false).find((h) => solid(h.object));
      return (hit?.object.userData.part as PartId) ?? null;
    };

    let moveFrame = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || down) return;
      cancelAnimationFrame(moveFrame);
      // raycast at most once per frame
      moveFrame = requestAnimationFrame(() => {
        const id = pick(e);
        if (id !== hoveredRef.current) {
          hoveredRef.current = id;
          canvas.style.cursor = id ? "pointer" : "grab";
          paint();
        }
        const r = host.getBoundingClientRect();
        setTip(id ? { id, x: e.clientX - r.left, y: e.clientY - r.top } : null);
      });
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = "grabbing";
      setTip(null);
    };
    const onUp = (e: PointerEvent) => {
      const moved = down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) : 99;
      down = null;
      canvas.style.cursor = hoveredRef.current ? "pointer" : "grab";
      if (moved > 6) return;
      const id = pick(e);
      if (id) onSelectRef.current?.(id);
    };
    const onLeave = () => {
      cancelAnimationFrame(moveFrame);
      hoveredRef.current = null;
      paint();
      setTip(null);
    };
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);

    /* render loop with automatic quality */
    const animate = !prefersReducedMotion();
    const clock = new THREE.Clock();
    let raf = 0;
    let lastExplode = -1;
    let frames = 0;
    let slowTime = 0;
    let degraded = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = clock.getDelta();
      if (!visible || document.hidden) return;

      if (explode.f !== lastExplode) {
        lastExplode = explode.f;
        model.setExplode(explode.f);
        invalidate(true);
      }
      if (animate && model.tick(clock.elapsedTime)) dirty = true;
      controls.update();
      if (!dirty) return;
      dirty = false;

      if (shadowDirty) {
        renderer.shadowMap.needsUpdate = true;
        shadowDirty = false;
      }
      renderer.render(scene, camera);

      // if frames are consistently slow, lower the resolution, then drop soft shadows
      if (animate && degraded < 2) {
        frames++;
        if (dt > 1 / 40) slowTime += dt;
        if (frames >= 90) {
          if (slowTime > 0.6 * frames * (1 / 40)) {
            degraded++;
            if (degraded === 1 && pixelRatio > 1) {
              pixelRatio = 1;
              renderer.setPixelRatio(pixelRatio);
              resize();
            } else {
              renderer.shadowMap.type = THREE.PCFShadowMap;
              key.shadow.mapSize.set(1024, 1024);
              key.shadow.map?.dispose();
              key.shadow.map = null;
              degraded = 2;
            }
            invalidate(true);
          }
          frames = 0;
          slowTime = 0;
        }
      }
    };
    loop();
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(moveFrame);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf([camera.position, controls.target, explode]);
      controls.dispose();
      model.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      key.shadow.map?.dispose();
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
      stage.current = null;
    };
  }, []);

  /* ---------- follow the selection ---------- */
  useEffect(() => {
    const s = stage.current;
    if (!s || !ready) return;
    selectedRef.current = selected;
    s.paint();
    s.model.setGhost(isolate && selected ? selected : null);
    s.invalidate(true);
    flyTo(s, selected);
  }, [selected, isolate, ready]);

  /* ---------- open / close the card ---------- */
  useEffect(() => {
    const s = stage.current;
    if (!s || !ready) return;
    gsap.to(s.explode, {
      f: open / 100,
      duration: prefersReducedMotion() ? 0 : 0.7,
      ease: "power2.inOut",
      overwrite: true,
    });
  }, [open, ready]);

  const zoom = (factor: number) => {
    const s = stage.current;
    if (!s) return;
    const offset = s.camera.position.clone().sub(s.controls.target);
    const length = THREE.MathUtils.clamp(offset.length() * factor, 3, 60);
    const to = s.controls.target.clone().add(offset.setLength(length));
    gsap.to(s.camera.position, {
      x: to.x,
      y: to.y,
      z: to.z,
      duration: 0.45,
      ease: "power2.out",
      onUpdate: () => s.invalidate(),
    });
  };

  const resetView = () => {
    if (stage.current) flyTo(stage.current, selected, true);
  };

  const tipPart = tip ? PART_BY_ID[tip.id] : null;

  return (
    <div
      ref={wrap}
      className={`relative overflow-hidden ${className}`}
      role="img"
      aria-label="Interactive 3D model of a graphics card. Drag to rotate. Use the list of components to select a part."
    >
      {failed && (
        <div className="absolute inset-0 grid place-items-center p-8 text-center">
          <p className="max-w-sm text-[15px] leading-relaxed text-mute">
            The 3D view needs WebGL, which is not available in this browser. Everything else on
            the page still works.
          </p>
        </div>
      )}

      {!failed && !ready && (
        <div className="absolute inset-0 grid place-items-center text-sm text-mute">
          <span className="pulse-soft">Loading 3D model…</span>
        </div>
      )}

      {tipPart && tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-white/95 px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.14),0_0_0_0.5px_rgba(0,0,0,0.08)] backdrop-blur"
          style={{ left: tip.x, top: tip.y - 14 }}
        >
          <p className="flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap">
            <span
              className="h-2 w-2 rounded-[3px]"
              style={{ background: CATEGORY[tipPart.cat].color }}
            />
            {tipPart.name}
          </p>
        </div>
      )}

      {!failed && (
        <>
          <p className="pointer-events-none absolute top-4 left-4 rounded-full bg-white/80 px-3 py-1.5 text-xs text-mute backdrop-blur sm:top-5 sm:left-5">
            Drag to rotate · click a part
          </p>

          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 sm:inset-x-5 sm:bottom-5">
            {showOpen ? (
              <label className="flex h-10 items-center gap-3 rounded-full bg-white/90 px-4 text-xs text-mute shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.08)] backdrop-blur">
                <span className="whitespace-nowrap">Open up</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={open}
                  aria-label="Open up the card"
                  onChange={(e) => setOpen(Number(e.target.value))}
                  className="w-20 sm:w-32"
                  style={{
                    background: `linear-gradient(to right, #0071e3 ${open}%, #e8e8ed ${open}%)`,
                  }}
                />
              </label>
            ) : (
              <span />
            )}

            <div className="flex h-10 overflow-hidden rounded-full bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.08)] backdrop-blur">
              <ViewButton label="Zoom out" icon="minus" onClick={() => zoom(1.25)} />
              <ViewButton label="Zoom in" icon="plus" onClick={() => zoom(0.8)} />
              <ViewButton label="Reset view" icon="reset" onClick={resetView} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ViewButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: "minus" | "plus" | "reset";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center text-ink transition hover:bg-black/[0.06] active:scale-90"
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

/**
 * Camera position, looking along `dir`, at which every corner of `box` is in view.
 * `margin` above 1 leaves breathing room around the edges.
 */
function fitBox(camera: THREE.PerspectiveCamera, box: THREE.Box3, dir: THREE.Vector3, margin: number) {
  const target = box.getCenter(new THREE.Vector3());
  const forward = dir.clone().normalize();
  const right = new THREE.Vector3(0, 1, 0).cross(forward).normalize();
  const up = forward.clone().cross(right).normalize();
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / margin;
  const tanH = tanV * camera.aspect;
  let distance = 0;
  const c = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    c.set(
      i & 1 ? box.max.x : box.min.x,
      i & 2 ? box.max.y : box.min.y,
      i & 4 ? box.max.z : box.min.z,
    ).sub(target);
    const depth = c.dot(forward);
    distance = Math.max(
      distance,
      depth + Math.abs(c.dot(right)) / tanH,
      depth + Math.abs(c.dot(up)) / tanV,
    );
  }
  return { target, position: target.clone().add(forward.multiplyScalar(distance)) };
}

/** Camera position that fits the whole card in view at the current aspect ratio. */
function overview(s: Stage) {
  return fitBox(s.camera, s.bounds, VIEW_DIR, 1.06);
}

/** Move the camera to look at one part, or back to the whole card. */
function flyTo(s: Stage, id: PartId | null, resetAngle = false) {
  let { target, position } = overview(s);
  if (id) {
    const dir = resetAngle
      ? VIEW_DIR.clone()
      : s.camera.position.clone().sub(s.controls.target).normalize();
    // keep a pleasant three-quarter angle when coming from straight above
    if (!resetAngle && dir.y > 0.92) dir.copy(VIEW_DIR);
    ({ target, position } = fitBox(s.camera, s.model.boxOf(id), dir, 1.5));
  }
  const duration = prefersReducedMotion() ? 0 : 1.15;
  const update = () => s.invalidate();
  gsap.to(s.controls.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration,
    ease: "power3.inOut",
    overwrite: true,
    onUpdate: update,
  });
  gsap.to(s.camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration,
    ease: "power3.inOut",
    overwrite: true,
    onUpdate: update,
  });
}
