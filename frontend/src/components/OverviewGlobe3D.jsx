import { memo, useEffect, useRef } from "react";
import * as THREE from "three";

const STATIONS = {
  maitri: { name: "MAITRI", lat: -70.7644, lon: 11.7342 },
  bharati: { name: "BHARATI", lat: -69.4068, lon: 76.1953 }
};
const NCPOR = { name: "NCPOR GOA", lat: 15.2993, lon: 74.1240 };

function latLon(lat, lon, radius) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createLabel(text, color = "#b9f7ff") {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 48;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 20px monospace";
  ctx.fillStyle = color;
  ctx.fillText(text, 8, 30);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.55, 0.29, 1);
  return sprite;
}

function arc(a, b, radius) {
  const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(radius * 1.18);
  return new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(48);
}

function OverviewGlobe3D({ stations = [], selectedStation, onSelectStation }) {
  const mountRef = useRef(null);
  const selectedRef = useRef(selectedStation);
  const selectRef = useRef(onSelectStation);

  useEffect(() => { selectedRef.current = selectedStation; }, [selectedStation]);
  useEffect(() => { selectRef.current = onSelectStation; }, [onSelectStation]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.35, 7.6);
    const root = new THREE.Group();
    root.rotation.x = 0.12;
    scene.add(root);

    const radius = 2.25;
    const earth = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), new THREE.MeshBasicMaterial({ color: 0x0a1724, wireframe: false }));
    root.add(earth);

    const grid = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({ color: 0x27445a, transparent: true, opacity: 0.55 });
    for (let lat = -75; lat <= 75; lat += 15) {
      const pts = [];
      for (let lon = -180; lon <= 180; lon += 4) pts.push(latLon(lat, lon, radius + 0.012));
      grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    for (let lon = -180; lon < 180; lon += 15) {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 4) pts.push(latLon(lat, lon, radius + 0.012));
      grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    root.add(grid);

    const polar = [];
    for (let lon = -180; lon <= 180; lon += 3) polar.push(latLon(-66.5, lon, radius + 0.03));
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(polar), new THREE.LineBasicMaterial({ color: 0x3bb6c8, transparent: true, opacity: 0.65 })));

    const shade = new THREE.Mesh(new THREE.SphereGeometry(radius + 0.018, 64, 48, 0, Math.PI * 2, 0, Math.PI * 0.33), new THREE.MeshBasicMaterial({ color: 0x123347, transparent: true, opacity: 0.32, side: THREE.DoubleSide }));
    shade.position.y = -0.55;
    root.add(shade);

    const markerGroup = new THREE.Group();
    root.add(markerGroup);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const markerMeshes = [];

    const addStation = (id, data) => {
      const p = latLon(data.lat, data.lon, radius + 0.08);
      const group = new THREE.Group();
      group.position.copy(p);
      group.userData.stationId = id;
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), new THREE.MeshBasicMaterial({ color: 0x8ff7ff }));
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.115, 32), new THREE.MeshBasicMaterial({ color: 0x42d7e8, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
      ring.lookAt(p.clone().multiplyScalar(2));
      group.add(core, ring);
      const label = createLabel(data.name);
      label.position.set(0.22, 0.12, 0);
      group.add(label);
      markerGroup.add(group);
      markerMeshes.push(core);
      return { group, ring, core };
    };

    const markerRefs = { maitri: addStation("maitri", STATIONS.maitri), bharati: addStation("bharati", STATIONS.bharati) };
    const ncpor = latLon(NCPOR.lat, NCPOR.lon, radius + 0.08);
    const np = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffc857 }));
    np.position.copy(ncpor); root.add(np);
    const npLabel = createLabel("NCPOR GOA", "#ffd982"); npLabel.position.copy(ncpor.clone().add(new THREE.Vector3(0.25, 0.12, 0))); root.add(npLabel);
    [STATIONS.maitri, STATIONS.bharati].forEach(data => root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arc(ncpor, latLon(data.lat, data.lon, radius + 0.07), radius + 0.12)), new THREE.LineBasicMaterial({ color: 0x6a9eb5, transparent: true, opacity: 0.52 }))));

    const ambient = new THREE.AmbientLight(0x9ed7e8, 0.8); scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.55); directional.position.set(4, 3, 5); scene.add(directional);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%"; renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    let dragging = false, moved = false, lastX = 0, lastY = 0, autoRotate = true, zoom = 7.6;
    const onPointerDown = e => { dragging = true; moved = false; autoRotate = false; lastX = e.clientX; lastY = e.clientY; renderer.domElement.setPointerCapture?.(e.pointerId); };
    const onPointerMove = e => { if (!dragging) return; const dx = e.clientX-lastX, dy=e.clientY-lastY; if (Math.abs(dx)+Math.abs(dy)>2) moved=true; root.rotation.y += dx*0.006; root.rotation.x = Math.max(-0.5, Math.min(0.65, root.rotation.x + dy*0.004)); lastX=e.clientX; lastY=e.clientY; };
    const onPointerUp = e => { dragging=false; renderer.domElement.releasePointerCapture?.(e.pointerId); };
    const onWheel = e => { autoRotate=false; zoom = Math.max(5.2, Math.min(10, zoom + e.deltaY*0.004)); camera.position.z=zoom; };
    const onClick = e => { if (moved) return; const rect=renderer.domElement.getBoundingClientRect(); pointer.x=((e.clientX-rect.left)/rect.width)*2-1; pointer.y=-((e.clientY-rect.top)/rect.height)*2+1; raycaster.setFromCamera(pointer,camera); const hit=raycaster.intersectObjects(markerMeshes,true)[0]; if(hit?.object?.parent?.userData?.stationId) { const st=stations.find(s=>s.id===hit.object.parent.userData.stationId); if(st) selectRef.current(st); } };
    renderer.domElement.addEventListener("pointerdown",onPointerDown); renderer.domElement.addEventListener("pointermove",onPointerMove); renderer.domElement.addEventListener("pointerup",onPointerUp); renderer.domElement.addEventListener("pointercancel",onPointerUp); renderer.domElement.addEventListener("wheel",onWheel,{passive:true}); renderer.domElement.addEventListener("click",onClick);

    const resize = () => { const w=container.clientWidth||600,h=container.clientHeight||480; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false); };
    resize(); window.addEventListener("resize",resize);
    let frame; const clock=new THREE.Clock();
    const animate=()=>{ frame=requestAnimationFrame(animate); const t=clock.getElapsedTime(); if(autoRotate && !dragging) root.rotation.y += 0.0007; Object.entries(markerRefs).forEach(([id,m])=>{ const active=selectedRef.current?.id===id; const pulse=1+Math.sin(t*3.5+(id==='bharati'?1:0))*0.16; m.ring.scale.setScalar(active?1.35*pulse:pulse); m.ring.material.opacity=active?1:0.58; m.core.scale.setScalar(active?1.45:1); }); renderer.render(scene,camera); };
    animate();

    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize",resize); renderer.domElement.removeEventListener("pointerdown",onPointerDown); renderer.domElement.removeEventListener("pointermove",onPointerMove); renderer.domElement.removeEventListener("pointerup",onPointerUp); renderer.domElement.removeEventListener("pointercancel",onPointerUp); renderer.domElement.removeEventListener("wheel",onWheel); renderer.domElement.removeEventListener("click",onClick); root.traverse(o=>{ if(o.geometry)o.geometry.dispose(); if(o.material){ const mats=Array.isArray(o.material)?o.material:[o.material]; mats.forEach(m=>{m.map?.dispose();m.dispose();}); }}); renderer.dispose(); if(container.contains(renderer.domElement))container.removeChild(renderer.domElement); };
  }, [stations]);

  useEffect(() => {
    // Camera/selection behavior is intentionally driven by the same selectedStation prop.
  }, [selectedStation]);

  return <div ref={mountRef} className="mission-globe-canvas" aria-label="Interactive NIVORA polar digital twin globe" />;
}

export default memo(OverviewGlobe3D);
