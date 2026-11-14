"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { buildGpuModel, type GpuModel } from "@/lib/gpu3d";
import { CATEGORY, PART_BY_ID, type PartId } from "@/lib/parts";
import { Icon } from "@/components/ui";

const HOME_POS = new THREE.Vector3(10.5, 10.5, 17);
const HOME_TARGET = new THREE.Vector3(-0.2, 1.2, 1.4);
const BASE_FOV = 34;

type Stage = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  model: GpuModel;
  explode: { f: number };
};

export default function Gpu3D({
  selected = null,
  isolate = false,
  onSelect,
  className = "",
}: {
  /** the part the camera is focused on; null shows the whole card */
  selected?: PartId | null;
  /** fade out everything except the selected part */
  isolate?: boolean;
  onSelect?: (id: PartId) => void;
  className?: string;
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
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // no WebGL in this browser: the page still works, without the 3D view
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement;
    canvas.className = "block h-full w-full outline-none";
    host.prepend(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 100);
    camera.position.copy(HOME_POS);

    // soft studio-style reflections, so the metal parts read as metal
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.75;

    scene.add(new THREE.HemisphereLight("#ffffff", "#c9ccd6", 0.5));
    const key = new THREE.DirectionalLight("#ffffff", 1.7);
    key.position.set(6, 12, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight("#dfe8ff", 0.5);
    fill.position.set(-8, 5, -6);
    scene.add(fill);

    const model = buildGpuModel();
    const explode = { f: 1 };
    model.setExplode(explode.f);
    scene.add(model.root);

    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(HOME_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false; // the page scrolls with the wheel; zoom uses the buttons
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = 1.5;
    controls.rotateSpeed = 0.7;
    // let a vertical swipe scroll the page on touch screens
    canvas.style.touchAction = "pan-y";

    stage.current = { renderer, camera, controls, model, explode };

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // widen the view on tall, narrow screens so the whole card still fits
      camera.fov = Math.min(64, BASE_FOV * Math.max(1, 1.45 / camera.aspect));
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(host);

    /* hover and click */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;

    const pick = (e: PointerEvent): PartId | null => {
      const r = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster
        .intersectObjects(model.pickables, false)
        .find((h) => (h.object as THREE.Mesh).material && visibleHit(h.object));
      return (hit?.object.userData.part as PartId) ?? null;
    };
    // ghosted parts should not block clicks on what is behind them
    const visibleHit = (o: THREE.Object3D) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
      return m.opacity > 0.5;
    };

    const paint = () => {
      for (const id of Object.keys(model.parts) as PartId[]) {
        model.setHighlight(
          id,
          id === selectedRef.current ? 0.55 : id === hoveredRef.current ? 0.4 : 0,
        );
      }
    };
    (stage.current as Stage & { paint?: () => void }).paint = paint;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const id = down ? null : pick(e);
      if (id !== hoveredRef.current) {
        hoveredRef.current = id;
        canvas.style.cursor = id ? "pointer" : "grab";
        paint();
      }
      const r = host.getBoundingClientRect();
      setTip(id ? { id, x: e.clientX - r.left, y: e.clientY - r.top } : null);
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      const moved = down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) : 99;
      down = null;
      if (moved > 6) return;
      const id = pick(e);
      if (id) onSelectRef.current?.(id);
    };
    const onLeave = () => {
      hoveredRef.current = null;
      paint();
      setTip(null);
    };
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);

    /* render loop */
    const animate = !prefersReducedMotion();
    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      model.setExplode(explode.f);
      model.tick(clock.getElapsedTime(), animate);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf([camera.position, controls.target, explode]);
      controls.dispose();
      model.dispose();
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
      stage.current = null;
    };
  }, []);

  /* ---------- follow the selection ---------- */
  useEffect(() => {
    const s = stage.current as (Stage & { paint?: () => void }) | null;
    if (!s || !ready) return;
    selectedRef.current = selected;
    s.paint?.();
    s.model.setGhost(isolate && selected ? selected : null);
    flyTo(s, selected);
  }, [selected, isolate, ready]);

  /* ---------- open / close the card ---------- */
  useEffect(() => {
    const s = stage.current;
    if (!s || !ready) return;
    gsap.to(s.explode, {
      f: open / 100,
      duration: prefersReducedMotion() ? 0 : 0.6,
      ease: "power2.out",
      overwrite: true,
    });
  }, [open, ready]);

  const zoom = (factor: number) => {
    const s = stage.current;
    if (!s) return;
    const offset = s.camera.position.clone().sub(s.controls.target);
    const length = THREE.MathUtils.clamp(offset.length() * factor, 3.5, 34);
    const to = s.controls.target.clone().add(offset.setLength(length));
    gsap.to(s.camera.position, { x: to.x, y: to.y, z: to.z, duration: 0.4, ease: "power2.out" });
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
          <p className="pointer-events-none absolute top-4 left-5 text-xs text-mute">
            Drag to rotate · click a part
          </p>

          <label className="absolute bottom-4 left-5 flex items-center gap-3 rounded-full bg-white/85 py-2 pr-4 pl-4 text-xs text-mute shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)] backdrop-blur">
            Open up
            <input
              type="range"
              min={0}
              max={100}
              value={open}
              onChange={(e) => setOpen(Number(e.target.value))}
              className="w-24 sm:w-32"
              style={{
                background: `linear-gradient(to right, #0071e3 ${open}%, #e8e8ed ${open}%)`,
              }}
            />
          </label>

          <div className="absolute right-4 bottom-4 flex overflow-hidden rounded-full bg-white/85 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)] backdrop-blur">
            <ViewButton label="Zoom out" icon="minus" onClick={() => zoom(1.25)} />
            <ViewButton label="Zoom in" icon="plus" onClick={() => zoom(0.8)} />
            <ViewButton label="Reset view" icon="reset" onClick={resetView} />
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
      className="grid h-9 w-10 place-items-center text-ink transition hover:bg-black/[0.06] active:scale-90"
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

/** Move the camera to look at one part, or back to the whole card. */
function flyTo(s: Stage, id: PartId | null, resetAngle = false) {
  let target = HOME_TARGET;
  let position = HOME_POS;
  if (id) {
    const { center, radius } = s.model.centerOf(id);
    const dir = resetAngle
      ? HOME_POS.clone().sub(HOME_TARGET).normalize()
      : s.camera.position.clone().sub(s.controls.target).normalize();
    target = center;
    position = center.clone().add(dir.multiplyScalar(Math.max(radius, 0.9) * 2.6 + 3.2));
  }
  const duration = prefersReducedMotion() ? 0 : 1.1;
  gsap.to(s.controls.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration,
    ease: "power3.inOut",
    overwrite: true,
  });
  gsap.to(s.camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration,
    ease: "power3.inOut",
    overwrite: true,
  });
}
