import React, { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCw, Navigation, ZoomIn, ZoomOut } from "lucide-react";

const EARTH_RADIUS = 2.45;
const DEG = Math.PI / 180;

// Geographically accurate coordinates
const NCPOR = { name: "NCPOR GOA", lat: 15.4026, lon: 73.8058, id: "ncpor" };
const FIXED_MAITRI = { name: "MAITRI", lat: -70.7644, lon: 11.7342, id: "maitri" };
const FIXED_BHARATI = { name: "BHARATI", lat: -69.4068, lon: 76.1953, id: "bharati" };

function latLonToVector3(lat, lon, radius = EARTH_RADIUS) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function haversine(a, b) {
  const lat1 = a.lat * DEG;
  const lat2 = b.lat * DEG;
  const dLat = (b.lat - a.lat) * DEG;
  const dLon = (b.lon - a.lon) * DEG;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function greatCirclePoints(a, b, radius = EARTH_RADIUS + 0.055, steps = 96) {
  const va = latLonToVector3(a.lat, a.lon, 1).normalize();
  const vb = latLonToVector3(b.lat, b.lon, 1).normalize();
  const angle = va.angleTo(vb);
  const points = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const sinTotal = Math.sin(angle);
    const p = sinTotal < 1e-6
      ? va.clone().lerp(vb, t).normalize()
      : va.clone().multiplyScalar(Math.sin((1 - t) * angle) / sinTotal)
        .add(vb.clone().multiplyScalar(Math.sin(t * angle) / sinTotal))
        .normalize();
    const arcHeight = Math.sin(t * Math.PI) * 0.35;
    points.push(p.multiplyScalar(radius + arcHeight));
  }

  return points;
}

function greatCircleMidpoint(a, b, radius = EARTH_RADIUS + 0.38) {
  const va = latLonToVector3(a.lat, a.lon, 1).normalize();
  const vb = latLonToVector3(b.lat, b.lon, 1).normalize();
  return va.add(vb).normalize().multiplyScalar(radius);
}

function addLine(scene, points, material) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  if (material.isLineDashedMaterial) line.computeLineDistances();
  scene.add(line);
  return line;
}

function createBadgeSprite(text, color = "#22d3ee", bgColor = "rgba(4, 15, 27, 0.88)") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  const r = 24;
  const x = 16, y = 16, w = 480, h = 96;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 44px monospace";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.4, 0.35, 1);
  return sprite;
}

function createLabel(text, color = "#dffaff", width = 1.35) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 112;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "600 32px monospace";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, 0.22, 1);
  return sprite;
}

function AntarcticaGlobe3D({
  stations = [],
  selectedStation,
  onSelectStation,
  onWebGLFailure
}) {
  const mountRef = useRef(null);
  const selectedStationRef = useRef(selectedStation);
  const onSelectStationRef = useRef(onSelectStation);
  const draggingRef = useRef(false);
  const draggedRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0.85, y: 0.15, z: 0 });
  const currentRef = useRef({ x: 0.85, y: 0.15, z: 0 });
  const cameraRef = useRef(null);
  const cameraTargetZRef = useRef(6.8);
  const isStationFocusedRef = useRef(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    selectedStationRef.current = selectedStation;
  }, [selectedStation]);

  useEffect(() => {
    onSelectStationRef.current = onSelectStation;
  }, [onSelectStation]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
    } catch (error) {
      console.warn("WebGL globe unavailable; using map fallback.", error);
      onWebGLFailure?.();
      return undefined;
    }

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.8);
    cameraRef.current = camera;
    cameraTargetZRef.current = 6.8;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x7dd3fc, 0.65));
    const key = new THREE.DirectionalLight(0x93c5fd, 1.4);
    key.position.set(5, 7, 6);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x00f2fe, 0.7);
    rim.position.set(-6, -4, -5);
    scene.add(rim);

    const earthGroup = new THREE.Group();
    earthGroup.rotation.order = "YXZ"; // Ensures Y (longitude) and X (latitude) rotations map directly to screen center
    earthGroup.rotation.x = 0.85;
    earthGroup.rotation.y = 0.15;
    scene.add(earthGroup);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS, 64, 48),
      new THREE.MeshStandardMaterial({
        color: 0x051321,
        roughness: 0.85,
        metalness: 0.15
      })
    );
    earthGroup.add(earth);

    const grid = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS + 0.012, 48, 24),
      new THREE.MeshBasicMaterial({
        color: 0x164e63,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      })
    );
    earthGroup.add(grid);

    // Antarctic Circle dashed line (-66.5 deg)
    const antarcticCirclePoints = [];
    for (let i = 0; i <= 160; i += 1) {
      const lon = (i / 160) * 360 - 180;
      antarcticCirclePoints.push(latLonToVector3(-66.5, lon, EARTH_RADIUS + 0.035));
    }
    const antarcticCircle = addLine(
      earthGroup,
      antarcticCirclePoints,
      new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.65,
        dashSize: 0.08,
        gapSize: 0.06
      })
    );
    antarcticCircle.computeLineDistances();

    const polarCap = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS + 0.02, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.35),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide
      })
    );
    polarCap.rotation.x = Math.PI;
    earthGroup.add(polarCap);

    // =========================================================================
    // DETAILED GEOGRAPHIC COASTLINES (Accurate India, Antarctica, Africa, etc.)
    // =========================================================================
    const generalLandMaterial = new THREE.LineBasicMaterial({ color: 0x256b80, transparent: true, opacity: 0.75 });

    // 1. Detailed Indian Subcontinent & NCPOR Goa Region Coastline
    const indiaCoastline = [
      // Gujarat / Rann of Kutch
      [24.5, 68.2], [23.7, 68.2], [23.4, 68.8], [22.8, 70.1], [22.5, 69.5],
      [22.2, 68.9], [21.6, 69.6], [20.9, 70.35], [20.7, 70.9], [21.1, 72.1],
      [21.7, 72.5], [21.2, 72.8], [20.4, 72.85],
      // Maharashtra / Konkan Coast (Mumbai, Ratnagiri)
      [19.8, 72.75], [18.96, 72.82], [18.5, 72.9], [17.5, 73.18], [16.5, 73.35], [15.8, 73.65],
      // GOA COASTLINE (NCPOR Headquarter Area: 15.4026°N, 73.8058°E)
      [15.68, 73.72], [15.52, 73.78], [15.40, 73.81], [15.26, 73.92], [15.02, 74.05],
      // Karnataka Coast (Karwar, Gokarna, Mangalore)
      [14.8, 74.12], [14.4, 74.35], [13.9, 74.55], [13.35, 74.7], [12.85, 74.85],
      // Kerala Coast (Malabar, Kochi, Alappuzha, Trivandrum)
      [12.4, 75.0], [11.8, 75.4], [11.2, 75.8], [10.5, 76.0], [9.95, 76.25],
      [9.5, 76.35], [8.85, 76.6], [8.5, 76.95],
      // Southern Tip: Cape Comorin (Kanyakumari)
      [8.08, 77.55],
      // Tamil Nadu & Coromandel Coast
      [8.5, 78.1], [9.1, 78.8], [9.3, 79.3], [9.8, 79.1], [10.3, 79.85],
      [10.8, 79.85], [11.5, 79.8], [12.2, 80.0], [13.08, 80.28],
      // Andhra Pradesh Coast
      [13.6, 80.2], [14.5, 80.05], [15.5, 80.1], [15.9, 80.6], [16.2, 81.15],
      [16.8, 82.2], [17.3, 82.8], [17.7, 83.25], [18.3, 84.0], [19.0, 84.7],
      // Odisha Coast (Puri, Paradip)
      [19.3, 84.95], [19.8, 85.8], [20.3, 86.7], [21.1, 86.9], [21.5, 87.1],
      // West Bengal & Sundarbans
      [21.6, 87.5], [21.7, 88.3], [22.2, 89.1], [22.4, 89.8],
      // Northern & Inland Frontier Loop
      [25.0, 89.5], [26.5, 90.0], [27.0, 88.5], [27.8, 85.0], [28.8, 81.0],
      [30.5, 78.5], [32.5, 76.5], [34.5, 74.5], [35.5, 76.0], [34.0, 77.5],
      [32.5, 78.5], [31.0, 76.5], [29.8, 74.2], [27.5, 71.5], [25.5, 70.0],
      [24.5, 68.2]
    ];

    // High-visibility glowing outline for India and Goa region
    const indiaMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95
    });
    addLine(
      earthGroup,
      indiaCoastline.map(([lat, lon]) => latLonToVector3(lat, lon, EARTH_RADIUS + 0.026)),
      indiaMaterial
    );

    // Sri Lanka Island Outline
    const sriLankaCoastline = [
      [9.8, 80.2], [9.3, 80.5], [8.6, 81.2], [7.7, 81.7], [6.8, 81.8],
      [6.0, 80.9], [5.9, 80.5], [6.2, 80.0], [6.9, 79.85], [7.9, 79.8],
      [8.6, 79.8], [9.5, 80.0], [9.8, 80.2]
    ];
    addLine(
      earthGroup,
      sriLankaCoastline.map(([lat, lon]) => latLonToVector3(lat, lon, EARTH_RADIUS + 0.026)),
      indiaMaterial
    );

    // Other Global Land Contours
    const otherLandShapes = [
      // Detailed Antarctica Coastline
      [[-70, 10], [-71, 20], [-70.5, 35], [-68, 55], [-67.5, 70], [-69.4, 76.2], [-66.5, 90], [-65, 110], [-66, 130], [-68, 150], [-72, 165], [-76, 175], [-80, -170], [-76, -150], [-74, -130], [-72, -105], [-72, -90], [-66, -75], [-63.5, -60], [-68, -45], [-70, -30], [-70.8, 11.7], [-70, 10]],
      // Africa Outline
      [[36, 10], [32, 28], [24, 35], [12, 44], [4, 48], [-4, 40], [-15, 40], [-25, 33], [-34, 18], [-30, 10], [-20, 12], [-10, 12], [0, 9], [5, 4], [15, -15], [28, -12], [36, 10]],
      // Australia Outline
      [[-12, 132], [-14, 138], [-18, 140], [-24, 150], [-32, 153], [-37, 150], [-39, 145], [-35, 136], [-32, 128], [-34, 118], [-26, 113], [-20, 118], [-14, 125], [-12, 132]]
    ];
    otherLandShapes.forEach(shape => addLine(
      earthGroup,
      shape.map(([lat, lon]) => latLonToVector3(lat, lon, EARTH_RADIUS + 0.025)),
      generalLandMaterial
    ));

    // STATIONS & PINS
    const stationMeshes = [];
    const markerGroup = new THREE.Group();
    earthGroup.add(markerGroup);

    // Maitri Station accurate placement
    const maitriCoord = FIXED_MAITRI;
    const maitriPos = latLonToVector3(maitriCoord.lat, maitriCoord.lon, EARTH_RADIUS + 0.07);
    const maitriGroup = new THREE.Group();
    maitriGroup.position.copy(maitriPos);
    maitriGroup.lookAt(maitriPos.clone().multiplyScalar(2));

    const maitriDot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 20), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
    const maitriHit = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    const maitriRing = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.15, 32), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    maitriRing.rotation.x = Math.PI / 2;
    maitriGroup.add(maitriDot, maitriHit, maitriRing);
    const maitriLabel = createLabel("MAITRI (70.76°S, 11.73°E)", "#67e8f9", 1.8);
    maitriLabel.position.set(0.65, 0.14, 0);
    maitriGroup.add(maitriLabel);
    markerGroup.add(maitriGroup);
    const maitriStationObj = stations.find(s => s.id === "maitri") || { id: "maitri", name: "Maitri", location: { latitude: maitriCoord.lat, longitude: maitriCoord.lon } };
    maitriHit.userData.station = maitriStationObj;
    stationMeshes.push({ group: maitriGroup, dot: maitriDot, hit: maitriHit, ring: maitriRing, station: maitriStationObj });

    // Bharati Station accurate placement
    const bharatiCoord = FIXED_BHARATI;
    const bharatiPos = latLonToVector3(bharatiCoord.lat, bharatiCoord.lon, EARTH_RADIUS + 0.07);
    const bharatiGroup = new THREE.Group();
    bharatiGroup.position.copy(bharatiPos);
    bharatiGroup.lookAt(bharatiPos.clone().multiplyScalar(2));

    const bharatiDot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 20), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    const bharatiHit = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    const bharatiRing = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.15, 32), new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    bharatiRing.rotation.x = Math.PI / 2;
    bharatiGroup.add(bharatiDot, bharatiHit, bharatiRing);
    const bharatiLabel = createLabel("BHARATI (69.41°S, 76.20°E)", "#fbbf24", 1.8);
    bharatiLabel.position.set(0.65, 0.14, 0);
    bharatiGroup.add(bharatiLabel);
    markerGroup.add(bharatiGroup);
    const bharatiStationObj = stations.find(s => s.id === "bharati") || { id: "bharati", name: "Bharati", location: { latitude: bharatiCoord.lat, longitude: bharatiCoord.lon } };
    bharatiHit.userData.station = bharatiStationObj;
    stationMeshes.push({ group: bharatiGroup, dot: bharatiDot, hit: bharatiHit, ring: bharatiRing, station: bharatiStationObj });

    // NCPOR Goa accurate placement
    const ncporCoord = NCPOR;
    const ncporPos = latLonToVector3(ncporCoord.lat, ncporCoord.lon, EARTH_RADIUS + 0.07);
    const ncporGroup = new THREE.Group();
    ncporGroup.position.copy(ncporPos);
    ncporGroup.lookAt(ncporPos.clone().multiplyScalar(2));

    const ncporDot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 20), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    const ncporHit = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    const ncporRing = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.15, 32), new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
    ncporRing.rotation.x = Math.PI / 2;
    ncporGroup.add(ncporDot, ncporHit, ncporRing);
    const ncporLabel = createLabel("NCPOR GOA (15.40°N, 73.81°E)", "#6ee7b7", 1.85);
    ncporLabel.position.set(0.7, 0.14, 0);
    ncporGroup.add(ncporLabel);
    markerGroup.add(ncporGroup);
    const ncporStationObj = { id: "ncpor", name: "NCPOR Goa", location: { latitude: ncporCoord.lat, longitude: ncporCoord.lon } };
    ncporHit.userData.station = ncporStationObj;
    stationMeshes.push({ group: ncporGroup, dot: ncporDot, hit: ncporHit, ring: ncporRing, station: ncporStationObj });

    // CONNECTING LINES & DISTANCES
    const distGoaMaitri = haversine(ncporCoord, maitriCoord);
    const distGoaBharati = haversine(ncporCoord, bharatiCoord);
    const distMaitriBharati = haversine(maitriCoord, bharatiCoord);

    // Arc 1: NCPOR Goa <-> Maitri
    const arcGoaMaitri = addLine(
      earthGroup,
      greatCirclePoints(ncporCoord, maitriCoord),
      new THREE.LineDashedMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.85,
        dashSize: 0.1,
        gapSize: 0.07
      })
    );
    arcGoaMaitri.computeLineDistances();
    const badgeGoaMaitri = createBadgeSprite(`${distGoaMaitri.toLocaleString()} KM`, "#22d3ee");
    badgeGoaMaitri.position.copy(greatCircleMidpoint(ncporCoord, maitriCoord, EARTH_RADIUS + 0.42));
    earthGroup.add(badgeGoaMaitri);

    // Arc 2: NCPOR Goa <-> Bharati
    const arcGoaBharati = addLine(
      earthGroup,
      greatCirclePoints(ncporCoord, bharatiCoord),
      new THREE.LineDashedMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.85,
        dashSize: 0.1,
        gapSize: 0.07
      })
    );
    arcGoaBharati.computeLineDistances();
    const badgeGoaBharati = createBadgeSprite(`${distGoaBharati.toLocaleString()} KM`, "#10b981");
    badgeGoaBharati.position.copy(greatCircleMidpoint(ncporCoord, bharatiCoord, EARTH_RADIUS + 0.42));
    earthGroup.add(badgeGoaBharati);

    // Arc 3: Maitri <-> Bharati
    const arcMaitriBharati = addLine(
      earthGroup,
      greatCirclePoints(maitriCoord, bharatiCoord),
      new THREE.LineDashedMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.9,
        dashSize: 0.08,
        gapSize: 0.06
      })
    );
    arcMaitriBharati.computeLineDistances();
    const badgeMaitriBharati = createBadgeSprite(`${distMaitriBharati.toLocaleString()} KM`, "#f59e0b");
    badgeMaitriBharati.position.copy(greatCircleMidpoint(maitriCoord, bharatiCoord, EARTH_RADIUS + 0.35));
    earthGroup.add(badgeMaitriBharati);

    // INTERACTION: 360-DEGREE ROTATION & ZOOM
    const clickableObjects = stationMeshes.map(item => item.hit);
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(99, 99);
    const clock = new THREE.Clock();
    let pointerDownAt = 0;

    const updateMouse = event => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    };

    const onPointerMove = event => {
      updateMouse(event);
      if (!draggingRef.current) return;
      const dx = event.clientX - pointerRef.current.x;
      const dy = event.clientY - pointerRef.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) draggedRef.current = true;

      targetRef.current.y += dx * 0.007;
      targetRef.current.x = THREE.MathUtils.clamp(targetRef.current.x - dy * 0.006, -1.45, 1.45);
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };

    const onPointerDown = event => {
      draggingRef.current = true;
      draggedRef.current = false;
      isStationFocusedRef.current = false; // User manual drag resumes free interaction
      pointerDownAt = performance.now();
      pointerRef.current = { x: event.clientX, y: event.clientY };
      updateMouse(event);
    };

    const onPointerUp = () => {
      draggingRef.current = false;
    };

    const onWheel = event => {
      event.preventDefault();
      cameraTargetZRef.current = THREE.MathUtils.clamp(
        cameraTargetZRef.current + event.deltaY * 0.004,
        3.2,
        10.5
      );
    };

    const onClick = event => {
      if (draggedRef.current || performance.now() - pointerDownAt > 400) return;
      updateMouse(event);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableObjects, false);
      if (hits.length && hits[0].object.userData.station) {
        const st = hits[0].object.userData.station;
        // Every station click selects the active station and centers the globe on it.
        onSelectStationRef.current?.(st);
        // Use the same true geographic focus calculation as the legend.
        // This keeps the selected station centered and its north direction upright.
        focusOnStation(st.location.latitude, st.location.longitude);
      }
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("click", onClick);
    window.addEventListener("pointerup", onPointerUp);

    const onResize = () => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      // Gentle auto-rotation only when not dragging and not locked/focused on a station
      if (!draggingRef.current && !isStationFocusedRef.current) {
        targetRef.current.y += dt * 0.022;
      }

      currentRef.current.x = THREE.MathUtils.lerp(currentRef.current.x, targetRef.current.x, 0.1);
      currentRef.current.y = THREE.MathUtils.lerp(currentRef.current.y, targetRef.current.y, 0.1);
      currentRef.current.z = THREE.MathUtils.lerp(currentRef.current.z, targetRef.current.z, 0.1);
      earthGroup.rotation.x = currentRef.current.x;
      earthGroup.rotation.y = currentRef.current.y;
      earthGroup.rotation.z = currentRef.current.z;

      // Smooth camera zoom
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, cameraTargetZRef.current, 0.09);

      stationMeshes.forEach(item => {
        const phase = (clock.elapsedTime * 1.5 + item.station.id.length * 0.2) % 1;
        const scale = 1 + phase * 1.5;
        item.ring.scale.set(scale, scale, 1);
        item.ring.material.opacity = Math.max(0.05, 0.9 * (1 - phase));
        const isSelected = selectedStationRef.current?.id === item.station.id;
        item.dot.scale.setScalar(isSelected ? 1.45 : 1);
      });

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableObjects, false);
      const nextHover = hits[0]?.object?.userData?.station || null;
      if (nextHover?.id !== hovered?.id) setHovered(nextHover);
      container.style.cursor = draggingRef.current ? "grabbing" : hits.length ? "pointer" : "grab";
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("click", onClick);
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [stations, onWebGLFailure]);

  // Center a geographic point while keeping local north pointing upward.
  const focusOnStation = (lat, lon) => {
    const phi = (90 - lat) * DEG;
    const theta = (lon + 180) * DEG;

    const surface = new THREE.Vector3(
      -Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    ).normalize();

    const north = new THREE.Vector3(
      Math.cos(phi) * Math.cos(theta),
      Math.sin(phi),
      -Math.cos(phi) * Math.sin(theta)
    ).normalize();

    const east = new THREE.Vector3(
      Math.sin(phi) * Math.sin(theta),
      0,
      Math.sin(phi) * Math.cos(theta)
    ).normalize();

    const worldToLocal = new THREE.Quaternion()
      .setFromRotationMatrix(new THREE.Matrix4().makeBasis(east, north, surface))
      .invert();
    const focusEuler = new THREE.Euler().setFromQuaternion(worldToLocal, "YXZ");

    isStationFocusedRef.current = true;
    targetRef.current.x = focusEuler.x;
    targetRef.current.y = focusEuler.y;
    targetRef.current.z = focusEuler.z;
  };

  const resetView = () => {
    isStationFocusedRef.current = false;
    targetRef.current = { x: 0.85, y: 0.15, z: 0 };
    cameraTargetZRef.current = 6.8;
  };

  const handleZoom = delta => {
    cameraTargetZRef.current = THREE.MathUtils.clamp(cameraTargetZRef.current + delta, 3.2, 10.5);
  };

  const handleLegendClick = itemKey => {
    if (itemKey === "maitri") {
      focusOnStation(FIXED_MAITRI.lat, FIXED_MAITRI.lon);
      const st = stations.find(s => s.id === "maitri") || { id: "maitri", name: "Maitri", location: { latitude: FIXED_MAITRI.lat, longitude: FIXED_MAITRI.lon } };
      onSelectStationRef.current?.(st);
    } else if (itemKey === "bharati") {
      focusOnStation(FIXED_BHARATI.lat, FIXED_BHARATI.lon);
      const st = stations.find(s => s.id === "bharati") || { id: "bharati", name: "Bharati", location: { latitude: FIXED_BHARATI.lat, longitude: FIXED_BHARATI.lon } };
      onSelectStationRef.current?.(st);
    } else if (itemKey === "ncpor") {
      focusOnStation(NCPOR.lat, NCPOR.lon);
      const st = stations.find(s => s.id === "ncpor") || { id: "ncpor", name: "NCPOR Goa", location: { latitude: NCPOR.lat, longitude: NCPOR.lon } };
      onSelectStationRef.current?.(st);
    } else if (itemKey === "link_maitri_bharati") {
      const midLat = (FIXED_MAITRI.lat + FIXED_BHARATI.lat) / 2;
      const midLon = (FIXED_MAITRI.lon + FIXED_BHARATI.lon) / 2;
      focusOnStation(midLat, midLon);
    } else if (itemKey === "link_ncpor_maitri") {
      const midLat = (NCPOR.lat + FIXED_MAITRI.lat) / 2;
      const midLon = (NCPOR.lon + FIXED_MAITRI.lon) / 2;
      focusOnStation(midLat, midLon);
    } else if (itemKey === "link_ncpor_bharati") {
      const midLat = (NCPOR.lat + FIXED_BHARATI.lat) / 2;
      const midLon = (NCPOR.lon + FIXED_BHARATI.lon) / 2;
      focusOnStation(midLat, midLon);
    }
  };

  const distMaitriBharati = haversine(FIXED_MAITRI, FIXED_BHARATI);
  const distGoaMaitri = haversine(NCPOR, FIXED_MAITRI);
  const distGoaBharati = haversine(NCPOR, FIXED_BHARATI);

  return (
    <div className="relative w-full h-full bg-[radial-gradient(circle_at_center,#071a29_0%,#030913_65%,#02050a_100%)] overflow-hidden select-none">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Earth Reference Frame Header */}
      <div className="absolute top-4 left-4 z-10 font-mono pointer-events-none">
        <div className="border border-cyan-500/30 bg-[#030913]/90 px-3 py-2 backdrop-blur-sm rounded-lg shadow-lg">
          <p className="text-[9px] text-cyan-300 tracking-[0.2em] uppercase font-bold flex items-center gap-1.5">
            <Navigation size={12} className="text-cyan-400" />
            360° Polar Earth Reference
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            GEOGRAPHIC LOCK • DIRECT DOT FOCUS • ZOOMABLE
          </p>
        </div>
      </div>

      {/* Control Buttons (Reset, Zoom In, Zoom Out) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        <button
          onClick={() => handleZoom(-0.8)}
          className="border border-cyan-500/30 bg-[#030913]/90 p-2 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 rounded-lg transition shadow-lg cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          className="border border-cyan-500/30 bg-[#030913]/90 p-2 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 rounded-lg transition shadow-lg cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={resetView}
          className="border border-cyan-500/30 bg-[#030913]/90 p-2 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 rounded-lg transition shadow-lg cursor-pointer"
          title="Reset View"
        >
          <RotateCw size={15} />
        </button>
      </div>

      {/* Geodesic Distances Panel */}
      <div className="absolute left-4 bottom-4 z-10 border border-cyan-500/25 bg-[#030913]/95 p-3.5 font-mono rounded-xl shadow-xl min-w-[240px]">
        <p className="text-[10px] text-cyan-300 tracking-[0.16em] uppercase font-semibold border-b border-cyan-500/20 pb-1.5 mb-2">
          REAL-WORLD GEODESIC LINKS
        </p>
        <div className="space-y-1.5 text-[10px]">
          <button
            onClick={() => handleLegendClick("link_maitri_bharati")}
            className="w-full text-left flex justify-between items-center text-slate-400 hover:text-amber-300 cursor-pointer transition"
          >
            <span>MAITRI ↔ BHARATI</span>
            <span className="font-bold text-amber-400">{distMaitriBharati.toLocaleString()} km</span>
          </button>
          <button
            onClick={() => handleLegendClick("link_ncpor_maitri")}
            className="w-full text-left flex justify-between items-center text-slate-400 hover:text-cyan-300 cursor-pointer transition"
          >
            <span>NCPOR ↔ MAITRI</span>
            <span className="font-bold text-cyan-300">{distGoaMaitri.toLocaleString()} km</span>
          </button>
          <button
            onClick={() => handleLegendClick("link_ncpor_bharati")}
            className="w-full text-left flex justify-between items-center text-slate-400 hover:text-emerald-300 cursor-pointer transition"
          >
            <span>NCPOR ↔ BHARATI</span>
            <span className="font-bold text-emerald-300">{distGoaBharati.toLocaleString()} km</span>
          </button>
        </div>
      </div>

      {/* Interactive / Clickable Link Legend */}
      <div className="absolute right-4 bottom-4 z-10 border border-cyan-500/25 bg-[#030913]/95 p-3.5 font-mono rounded-xl shadow-xl min-w-[210px]">
        <p className="text-[10px] text-cyan-300 tracking-[0.16em] uppercase font-semibold border-b border-cyan-500/20 pb-1.5 mb-2">
          CLICKABLE LINK LEGEND
        </p>
        <div className="space-y-1 text-[10px]">
          <button
            onClick={() => handleLegendClick("maitri")}
            className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-300 cursor-pointer transition"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
            <span>MAITRI STATION</span>
          </button>
          <button
            onClick={() => handleLegendClick("bharati")}
            className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 cursor-pointer transition"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span>BHARATI STATION</span>
          </button>
          <button
            onClick={() => handleLegendClick("ncpor")}
            className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-300 cursor-pointer transition"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span>NCPOR GOA (HQ)</span>
          </button>
        </div>
        <p className="text-[9px] text-slate-500 mt-2.5 pt-2 border-t border-slate-800">
          Tip: Click station to select & center • Drag to rotate
        </p>
      </div>

      {hovered && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 border border-cyan-500/40 bg-[#030913]/95 px-4 py-2 font-mono rounded-lg shadow-2xl pointer-events-none">
          <span className="text-xs font-bold text-cyan-300">{hovered.name.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}

export default memo(AntarcticaGlobe3D);
