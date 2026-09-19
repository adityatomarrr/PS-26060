import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  RotateCcw,
  Zap,
  Activity,
  Server,
  RadioTower,
  ShieldCheck,
  Droplets,
  Plane,
  SunMedium,
  Building
} from "lucide-react";

export default function StationModel3D({
  station = null,
  environment = null,
  energy = null
}) {
  const mountRef = useRef(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [hoveredModule, setHoveredModule] = useState(null);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const cameraTargetRef = useRef(new THREE.Vector3(0, 1.2, 0));
  const cameraPosTargetRef = useRef(new THREE.Vector3(0, 5.5, 9));
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const orbitAngleRef = useRef({ theta: 0.3, phi: 0.65, radius: 10 });
  const turbineBladesRef = useRef([]);
  const rotatorsRef = useRef([]);

  const isBharati = station?.id === "bharati" || (station?.name && station.name.toLowerCase().includes("bharati"));
  const stationName = station?.name || (isBharati ? "Bharati Station" : "Maitri Research Station");

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    turbineBladesRef.current = [];
    rotatorsRef.current = [];
    setSelectedModule(null);

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5.5, 9);
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D Digital Twin architectural model of the Antarctic Research Station."
    );
    container.appendChild(renderer.domElement);

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(8, 14, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const cyanRimLight = new THREE.DirectionalLight(0x00f2fe, 0.8);
    cyanRimLight.position.set(-10, 6, -8);
    scene.add(cyanRimLight);

    const interactiveMeshes = [];
    const registerModule = (meshOrGroup, moduleData) => {
      meshOrGroup.traverse(child => {
        if (child.isMesh) {
          child.userData = { module: moduleData, isModule: true };
          interactiveMeshes.push(child);
        }
      });
    };

    const modulesGroup = new THREE.Group();
    scene.add(modulesGroup);

    // =========================================================================
    // ARCHITECTURE 1: BHARATI STATION (Modern Aerodynamic Envelope on Stilts + Helipad)
    // =========================================================================
    if (isBharati) {
      // 1. Polar Snow Platform
      const snowGeo = new THREE.CylinderGeometry(6.6, 7.0, 0.4, 48);
      const snowMat = new THREE.MeshStandardMaterial({ color: 0x0a192f, roughness: 0.7, metalness: 0.2 });
      const snowMesh = new THREE.Mesh(snowGeo, snowMat);
      snowMesh.position.y = -0.2;
      snowMesh.receiveShadow = true;
      scene.add(snowMesh);

      const gridHelper = new THREE.PolarGridHelper(6.5, 8, 8, 36, 0x00f2fe, 0x1e3a5f);
      gridHelper.position.y = 0.01;
      scene.add(gridHelper);

      // 2. High Hydraulic/Steel Stilts
      const stiltMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
      const stiltsGroup = new THREE.Group();
      [
        [-2.2, -1.2], [-0.8, -1.2], [0.8, -1.2], [2.2, -1.2],
        [-2.2, 1.2], [-0.8, 1.2], [0.8, 1.2], [2.2, 1.2],
        [-2.2, 0], [2.2, 0]
      ].forEach(([sx, sz]) => {
        const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.5, 12), stiltMat);
        stilt.position.set(sx, 0.55, sz);
        stilt.castShadow = true;
        stiltsGroup.add(stilt);

        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.1, 12), stiltMat);
        foot.position.set(sx, 0.05, sz);
        stiltsGroup.add(foot);
      });
      scene.add(stiltsGroup);

      // 3. Main Aerodynamic Faceted Envelope (134 Modular Containers enclosed)
      const habGroup = new THREE.Group();
      habGroup.position.set(0, 1.3, 0);

      const mainBodyGeo = new THREE.BoxGeometry(5.2, 1.1, 2.8);
      const titaniumMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.75,
        roughness: 0.25
      });
      const mainMesh = new THREE.Mesh(mainBodyGeo, titaniumMat);
      mainMesh.position.y = 0.55;
      mainMesh.castShadow = true;
      habGroup.add(mainMesh);

      const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.4, roughness: 0.4 });
      const stripeGeo = new THREE.BoxGeometry(5.24, 0.2, 2.82);
      const stripeMesh = new THREE.Mesh(stripeGeo, orangeMat);
      stripeMesh.position.y = 0.45;
      habGroup.add(stripeMesh);

      const noseGeo = new THREE.CylinderGeometry(1.4, 1.4, 1.1, 16, 1, false, 0, Math.PI);
      const noseMesh = new THREE.Mesh(noseGeo, titaniumMat);
      noseMesh.position.set(2.6, 0.55, 0);
      noseMesh.rotation.y = Math.PI / 2;
      habGroup.add(noseMesh);

      const bridgeGeo = new THREE.BoxGeometry(3.6, 0.7, 2.2);
      const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
      const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridgeMesh.position.set(0.2, 1.45, 0);
      bridgeMesh.castShadow = true;
      habGroup.add(bridgeMesh);

      const glassMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const winFront = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.35), glassMat);
      winFront.position.set(0.2, 1.45, 1.11);
      habGroup.add(winFront);

      const winBack = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.35), glassMat);
      winBack.position.set(0.2, 1.45, -1.11);
      winBack.rotation.y = Math.PI;
      habGroup.add(winBack);

      modulesGroup.add(habGroup);
      registerModule(habGroup, {
        id: "habitat",
        name: "134-Container Aerodynamic Station Envelope",
        role: "Personnel Quarters, Bio/Atmospheric Labs & Central Command",
        health: 99,
        status: "Nominal",
        powerKw: 38.5,
        tempC: 22.0,
        focus: new THREE.Vector3(0, 1.8, 0),
        camPos: new THREE.Vector3(0, 4.2, 6.2)
      });

      // 4. Rooftop Helipad with 'H' Marking (Bharati Flight Ops)
      const helipadGroup = new THREE.Group();
      helipadGroup.position.set(-1.4, 2.41, 0);

      const padGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.06, 32);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.6 });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      helipadGroup.add(padMesh);

      const yellowRing = new THREE.Mesh(
        new THREE.RingGeometry(0.85, 0.95, 32),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
      );
      yellowRing.rotation.x = Math.PI / 2;
      yellowRing.position.y = 0.035;
      helipadGroup.add(yellowRing);

      const hMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const hLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.7), hMat);
      hLeft.rotation.x = -Math.PI / 2;
      hLeft.position.set(-0.25, 0.04, 0);
      const hRight = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.7), hMat);
      hRight.rotation.x = -Math.PI / 2;
      hRight.position.set(0.25, 0.04, 0);
      const hCross = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.12), hMat);
      hCross.rotation.x = -Math.PI / 2;
      hCross.position.set(0, 0.04, 0);
      helipadGroup.add(hLeft, hRight, hCross);

      modulesGroup.add(helipadGroup);
      registerModule(helipadGroup, {
        id: "helipad",
        name: "Rooftop Logistics Flight Deck & Helipad",
        role: "Kamov Ka-32 / Bell Polar Cargo Resupply & Medical Evac",
        health: 100,
        status: "Active Deck",
        powerKw: 4.2,
        focus: new THREE.Vector3(-1.4, 2.5, 0),
        camPos: new THREE.Vector3(-1.4, 5.0, 3.5)
      });

      // 5. Polar Bifacial Solar Array
      const solarGroup = new THREE.Group();
      solarGroup.position.set(-3.5, 0, 1.8);
      const rackMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.2
      });

      for (let r = 0; r < 3; r++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.7), panelMat);
        panel.position.set(r * 0.5 - 0.5, 0.45, r * 0.4 - 0.4);
        panel.rotation.x = -Math.PI / 4;
        solarGroup.add(panel);
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), rackMat);
        stand.position.set(r * 0.5 - 0.5, 0.2, r * 0.4 - 0.4);
        solarGroup.add(stand);
      }
      modulesGroup.add(solarGroup);
      registerModule(solarGroup, {
        id: "solar",
        name: "High-Albedo Bifacial Solar PV Field",
        role: "Snow Reflectance Photovoltaic Generation",
        health: 96,
        status: "Active Generation",
        powerKw: energy?.solarOutputKw || 24.2,
        focus: new THREE.Vector3(-3.5, 0.6, 1.8),
        camPos: new THREE.Vector3(-3.5, 3.2, 4.8)
      });

      // 6. High-Latitude Wind Generator
      const windGroup = new THREE.Group();
      windGroup.position.set(3.6, 0, -1.8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.4, 16), mastMat);
      mast.position.y = 1.7;
      windGroup.add(mast);

      const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.65), mastMat);
      nacelle.position.set(0, 3.4, 0);
      windGroup.add(nacelle);

      const blades = new THREE.Group();
      blades.position.set(0, 3.4, 0.35);
      const bladeGeo = new THREE.BoxGeometry(0.12, 1.6, 0.02);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      for (let b = 0; b < 3; b++) {
        const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
        bladeMesh.rotation.z = (b * Math.PI * 2) / 3;
        bladeMesh.position.y = Math.sin((b * Math.PI * 2) / 3) * 0.8;
        bladeMesh.position.x = Math.cos((b * Math.PI * 2) / 3) * 0.8;
        blades.add(bladeMesh);
      }
      windGroup.add(blades);
      turbineBladesRef.current.push(blades);
      modulesGroup.add(windGroup);
      registerModule(windGroup, {
        id: "wind",
        name: "Larsemann Aerogenerator Wind Turbine",
        role: "Storm Load Power Generator",
        health: 95,
        status: "Spinning (Optimal)",
        powerKw: energy?.windOutputKw || 28.4,
        focus: new THREE.Vector3(3.6, 2.8, -1.8),
        camPos: new THREE.Vector3(3.6, 4.8, 2.5)
      });

      // 7. ISRO / NRSC Polar Satellite Radome
      const radomeGroup = new THREE.Group();
      radomeGroup.position.set(3.4, 0, 1.8);
      const radomeTower = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 1.3, 16), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 }));
      radomeTower.position.y = 0.65;
      radomeGroup.add(radomeTower);

      const domeMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 24), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.1 }));
      domeMesh.position.y = 1.8;
      radomeGroup.add(domeMesh);

      const commRing = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.1, 32), new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
      commRing.rotation.x = Math.PI / 2;
      commRing.position.y = 1.8;
      radomeGroup.add(commRing);

      modulesGroup.add(radomeGroup);
      registerModule(radomeGroup, {
        id: "radome",
        name: "ISRO / NRSC Polar Satellite Earth Station",
        role: "Direct Remote Sensing Data Relay to Hyderabad / NCPOR",
        health: 99,
        status: "Active Link (Locked)",
        latencyMs: 180,
        focus: new THREE.Vector3(3.4, 1.8, 1.8),
        camPos: new THREE.Vector3(3.4, 4.0, 5.0)
      });

    } else {
      // =========================================================================
      // ARCHITECTURE 2: MAITRI STATION (Schirmacher Oasis Moraine + Modular Cluster + Priyadarshini Lake Pipeline + Fuel Depot)
      // =========================================================================

      // 1. Schirmacher Oasis Rocky Moraine Ground (Brown/Slate Permafrost Rock)
      const rockGeo = new THREE.CylinderGeometry(6.6, 7.0, 0.4, 48);
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9, metalness: 0.1 });
      const rockMesh = new THREE.Mesh(rockGeo, rockMat);
      rockMesh.position.y = -0.2;
      scene.add(rockMesh);

      // Priyadarshini Lake shoreline cutout (Cyan-blue water surface)
      const lakeGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.05, 24, 1, false, 0, Math.PI * 0.7);
      const lakeMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.1, metalness: 0.8 });
      const lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
      lakeMesh.position.set(-3.6, 0.02, -2.2);
      scene.add(lakeMesh);

      // Rocky Boulders
      const boulderMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.95 });
      [[-2.5, -1.8], [-3.8, 1.2], [4.0, 0.5], [2.2, 3.2], [-1.2, 3.5]].forEach(([bx, bz], i) => {
        const bMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + (i % 3) * 0.15), boulderMat);
        bMesh.position.set(bx, 0.15, bz);
        scene.add(bMesh);
      });

      // 2. Main Living Complex (Blocks A & B with iconic Indian mission yellow & navy container panels)
      const maitriHabGroup = new THREE.Group();
      maitriHabGroup.position.set(-0.4, 0, 0.2);

      const pierMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.8 });
      [[-1.8, -1.0], [0, -1.0], [1.8, -1.0], [-1.8, 1.0], [0, 1.0], [1.8, 1.0]].forEach(([px, pz]) => {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), pierMat);
        pier.position.set(px, 0.17, pz);
        maitriHabGroup.add(pier);
      });

      // Block A (Living Quarters - Classic Maitri Yellow)
      const blockAGeo = new THREE.BoxGeometry(4.0, 1.1, 2.2);
      const yellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.45, metalness: 0.2 });
      const blockAMesh = new THREE.Mesh(blockAGeo, yellowMat);
      blockAMesh.position.set(0, 0.9, 0);
      blockAMesh.castShadow = true;
      maitriHabGroup.add(blockAMesh);

      // Block B (Upper Operations Tier - Polar Blue)
      const blockBGeo = new THREE.BoxGeometry(2.6, 0.9, 1.8);
      const navyMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4, metalness: 0.25 });
      const blockBMesh = new THREE.Mesh(blockBGeo, navyMat);
      blockBMesh.position.set(0, 1.9, 0);
      blockBMesh.castShadow = true;
      maitriHabGroup.add(blockBMesh);

      // Pitched Gabled Roof (Classic 1989 Maitri architecture)
      const roofGeo = new THREE.ConeGeometry(1.6, 0.5, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.set(0, 2.6, 0);
      roofMesh.rotation.y = Math.PI / 4;
      maitriHabGroup.add(roofMesh);

      // Windows
      const winMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
      const winA1 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.25), winMat);
      winA1.position.set(0, 0.9, 1.11);
      maitriHabGroup.add(winA1);

      modulesGroup.add(maitriHabGroup);
      registerModule(maitriHabGroup, {
        id: "maitri_main",
        name: "Maitri Main Living Complex (Blocks A & B)",
        role: "Personnel Quarters, Mess Hall & Life-Support Station",
        health: 98,
        status: "Nominal",
        powerKw: 36.2,
        tempC: 21.5,
        focus: new THREE.Vector3(-0.4, 1.6, 0.2),
        camPos: new THREE.Vector3(-0.4, 4.0, 5.8)
      });

      // 3. Atmospheric & Geomagnetic Laboratory Unit
      const labGroup = new THREE.Group();
      labGroup.position.set(2.8, 0, 0.4);
      const labGeo = new THREE.BoxGeometry(1.8, 0.9, 1.6);
      const labMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
      const labMesh = new THREE.Mesh(labGeo, labMat);
      labMesh.position.y = 0.65;
      labGroup.add(labMesh);

      const antennaMast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      antennaMast.position.set(0.6, 1.6, 0.5);
      labGroup.add(antennaMast);

      // Live Rotating Meteorological Radar Scanner atop the Science Lab
      const scannerGroup = new THREE.Group();
      scannerGroup.position.set(0.6, 2.45, 0.5);
      const scanBar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.05, 0.08), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.3 }));
      const scanDish = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      scanDish.rotation.z = Math.PI / 2;
      scanDish.position.set(0.32, 0, 0);
      scannerGroup.add(scanBar, scanDish);
      labGroup.add(scannerGroup);
      rotatorsRef.current.push(scannerGroup);

      modulesGroup.add(labGroup);
      registerModule(labGroup, {
        id: "maitri_labs",
        name: "Atmospheric & Geomagnetic Research Labs",
        role: "Ozone Depletion, Aurora & Seismological Monitoring",
        health: 99,
        status: "Sampling Active",
        powerKw: 12.8,
        focus: new THREE.Vector3(2.8, 0.9, 0.4),
        camPos: new THREE.Vector3(2.8, 3.2, 4.0)
      });

      // 4. Maitri Schirmacher Wind Power Generator (Live Rotating Turbine)
      const maitriWindGroup = new THREE.Group();
      maitriWindGroup.position.set(1.6, 0, -2.2);
      const maitriMast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.2, 12), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 }));
      maitriMast.position.y = 1.6;
      maitriWindGroup.add(maitriMast);

      const maitriNacelle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.6), new THREE.MeshStandardMaterial({ color: 0xeab308 }));
      maitriNacelle.position.set(0, 3.2, 0);
      maitriWindGroup.add(maitriNacelle);

      const maitriBlades = new THREE.Group();
      maitriBlades.position.set(0, 3.2, 0.32);
      const maitriBladeGeo = new THREE.BoxGeometry(0.1, 1.5, 0.02);
      const maitriBladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      for (let b = 0; b < 3; b++) {
        const bMesh = new THREE.Mesh(maitriBladeGeo, maitriBladeMat);
        bMesh.rotation.z = (b * Math.PI * 2) / 3;
        bMesh.position.y = Math.sin((b * Math.PI * 2) / 3) * 0.75;
        bMesh.position.x = Math.cos((b * Math.PI * 2) / 3) * 0.75;
        maitriBlades.add(bMesh);
      }
      maitriWindGroup.add(maitriBlades);
      turbineBladesRef.current.push(maitriBlades);

      modulesGroup.add(maitriWindGroup);
      registerModule(maitriWindGroup, {
        id: "maitri_wind",
        name: "Schirmacher Polar Aerogenerator",
        role: "High-Latitude Katabatic Wind Power Turbine",
        health: 96,
        status: "Spinning (Optimal)",
        powerKw: energy?.windOutputKw || 22.8,
        focus: new THREE.Vector3(1.6, 2.8, -2.2),
        camPos: new THREE.Vector3(1.6, 4.6, 2.0)
      });

      // 4. Horizontal Arctic Diesel Fuel Tank Farm (4 Heavy Tanks on Saddles)
      const fuelGroup = new THREE.Group();
      fuelGroup.position.set(-2.8, 0, 2.0);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.6, roughness: 0.3 });
      const saddleMat = new THREE.MeshStandardMaterial({ color: 0x4b5563 });

      [-0.7, 0, 0.7].forEach(tz => {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 20), tankMat);
        tank.rotation.z = Math.PI / 2;
        tank.position.set(0, 0.65, tz);
        tank.castShadow = true;
        fuelGroup.add(tank);

        [-0.6, 0.6].forEach(sx => {
          const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.7), saddleMat);
          saddle.position.set(sx, 0.15, tz);
          fuelGroup.add(saddle);
        });
      });

      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
      pipe.position.set(0.95, 0.4, 0);
      fuelGroup.add(pipe);

      modulesGroup.add(fuelGroup);
      registerModule(fuelGroup, {
        id: "maitri_fuel",
        name: "Arctic High-Speed Diesel Tank Depot",
        role: "Winter Heating & Caterpillar Genset Reserve (195,000 L)",
        health: 97,
        status: "Secured",
        powerKw: 2.1,
        focus: new THREE.Vector3(-2.8, 0.7, 2.0),
        camPos: new THREE.Vector3(-2.8, 3.0, 4.8)
      });

      // 5. Lake Priyadarshini Water Intake Pump Station & Heat-Traced Pipeline
      const waterGroup = new THREE.Group();
      waterGroup.position.set(-3.2, 0, -1.8);

      const pumpHut = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      pumpHut.position.y = 0.4;
      waterGroup.add(pumpHut);

      const waterPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
      waterPipe.rotation.z = Math.PI / 3;
      waterPipe.rotation.y = -Math.PI / 4;
      waterPipe.position.set(1.1, 0.25, 0.8);
      waterGroup.add(waterPipe);

      modulesGroup.add(waterGroup);
      registerModule(waterGroup, {
        id: "maitri_water",
        name: "Lake Priyadarshini Freshwater Intake",
        role: "Electric Submersible Pump & Heated Supply Line",
        health: 96,
        status: "Pumping (65 L/min)",
        powerKw: 8.5,
        focus: new THREE.Vector3(-3.2, 0.6, -1.8),
        camPos: new THREE.Vector3(-3.2, 3.0, 1.5)
      });

      // 6. Elevated Geodesic Satellite Radome Tower on Rocky Knoll
      const radomeGroup = new THREE.Group();
      radomeGroup.position.set(3.2, 0, -1.8);

      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x475569, wireframe: true }));
      tower.position.y = 0.9;
      radomeGroup.add(tower);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 18), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
      dome.position.y = 2.4;
      radomeGroup.add(dome);

      const commRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.0, 24), new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide }));
      commRing.rotation.x = Math.PI / 2;
      commRing.position.y = 2.4;
      radomeGroup.add(commRing);

      modulesGroup.add(radomeGroup);
      registerModule(radomeGroup, {
        id: "maitri_radome",
        name: "Elevated Polar Satellite Radome Tower",
        role: "Ku-Band Geostationary Telecom Link to NCPOR Goa",
        health: 99,
        status: "Locked Uplink",
        powerKw: 6.4,
        focus: new THREE.Vector3(3.2, 2.2, -1.8),
        camPos: new THREE.Vector3(3.2, 4.5, 2.0)
      });
    }

    // Raycasting & User Pointer Setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = e => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDraggingRef.current) {
        const deltaX = e.clientX - prevPointerRef.current.x;
        const deltaY = e.clientY - prevPointerRef.current.y;
        orbitAngleRef.current.theta -= deltaX * 0.007;
        orbitAngleRef.current.phi = Math.max(
          0.15,
          Math.min(Math.PI / 2 - 0.05, orbitAngleRef.current.phi - deltaY * 0.007)
        );
        prevPointerRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerDown = e => {
      isDraggingRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = e => {
      e.preventDefault();
      orbitAngleRef.current.radius = Math.max(
        5,
        Math.min(18, orbitAngleRef.current.radius + e.deltaY * 0.008)
      );
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveMeshes, false);
      if (hits.length > 0) {
        const mod = hits[0].object.userData.module;
        if (mod) {
          setSelectedModule(mod);
          if (mod.focus && mod.camPos) {
            cameraTargetRef.current.copy(mod.focus);
            cameraPosTargetRef.current.copy(mod.camPos);
          }
        }
      }
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("click", onClick);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      turbineBladesRef.current.forEach(bl => {
        bl.rotation.z += dt * 4.5;
      });

      rotatorsRef.current.forEach(r => {
        r.rotation.y += dt * 3.5;
      });

      if (!selectedModule) {
        const { theta, phi, radius } = orbitAngleRef.current;
        cameraPosTargetRef.current.set(
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.cos(theta)
        );
      }

      camera.position.lerp(cameraPosTargetRef.current, 0.08);
      camera.lookAt(cameraTargetRef.current);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("click", onClick);

      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [station, isBharati]);

  const resetStationView = () => {
    setSelectedModule(null);
    cameraTargetRef.current.set(0, 1.2, 0);
    orbitAngleRef.current = { theta: 0.3, phi: 0.65, radius: 10 };
  };

  const focusModule = mod => {
    setSelectedModule(mod);
    if (mod?.focus && mod?.camPos) {
      cameraTargetRef.current.copy(mod.focus);
      cameraPosTargetRef.current.copy(mod.camPos);
    }
  };

  const bharatiModules = [
    {
      id: "habitat",
      name: "Main Envelope",
      icon: Building,
      focus: new THREE.Vector3(0, 1.8, 0),
      camPos: new THREE.Vector3(0, 4.2, 6.2),
      role: "134 Container Aerodynamic Envelope & Science Labs",
      health: 99,
      status: "Nominal",
      powerKw: 38.5
    },
    {
      id: "helipad",
      name: "Helipad Deck",
      icon: Plane,
      focus: new THREE.Vector3(-1.4, 2.5, 0),
      camPos: new THREE.Vector3(-1.4, 5.0, 3.5),
      role: "Rooftop Resupply Flight Deck & Helipad",
      health: 100,
      status: "Active Deck",
      powerKw: 4.2
    },
    {
      id: "solar",
      name: "Solar PV",
      icon: SunMedium,
      focus: new THREE.Vector3(-3.5, 0.6, 1.8),
      camPos: new THREE.Vector3(-3.5, 3.2, 4.8),
      role: "High-Albedo Bifacial Solar PV Field",
      health: 96,
      status: "Active Generation",
      powerKw: 24.2
    },
    {
      id: "wind",
      name: "Wind Turbines",
      icon: Activity,
      focus: new THREE.Vector3(3.6, 2.8, -1.8),
      camPos: new THREE.Vector3(3.6, 4.8, 2.5),
      role: "Larsemann Aerogenerator Wind Turbine",
      health: 95,
      status: "Spinning",
      powerKw: 28.4
    },
    {
      id: "radome",
      name: "ISRO Radome",
      icon: RadioTower,
      focus: new THREE.Vector3(3.4, 1.8, 1.8),
      camPos: new THREE.Vector3(3.4, 4.0, 5.0),
      role: "ISRO / NRSC Polar Satellite Earth Station",
      health: 99,
      status: "Locked",
      powerKw: 6.4
    }
  ];

  const maitriModules = [
    {
      id: "maitri_main",
      name: "Habitat Block",
      icon: Server,
      focus: new THREE.Vector3(-0.4, 1.6, 0.2),
      camPos: new THREE.Vector3(-0.4, 4.0, 5.8),
      role: "Maitri Main Living Complex (Blocks A & B)",
      health: 98,
      status: "Nominal",
      powerKw: 36.2
    },
    {
      id: "maitri_labs",
      name: "Science Labs",
      icon: Building,
      focus: new THREE.Vector3(2.8, 0.9, 0.4),
      camPos: new THREE.Vector3(2.8, 3.2, 4.0),
      role: "Atmospheric & Geomagnetic Research Labs",
      health: 99,
      status: "Sampling",
      powerKw: 12.8
    },
    {
      id: "maitri_fuel",
      name: "Fuel Depot",
      icon: ShieldCheck,
      focus: new THREE.Vector3(-2.8, 0.7, 2.0),
      camPos: new THREE.Vector3(-2.8, 3.0, 4.8),
      role: "Arctic High-Speed Diesel Tank Depot",
      health: 97,
      status: "Secured",
      powerKw: 2.1
    },
    {
      id: "maitri_water",
      name: "Lake Pump",
      icon: Droplets,
      focus: new THREE.Vector3(-3.2, 0.6, -1.8),
      camPos: new THREE.Vector3(-3.2, 3.0, 1.5),
      role: "Lake Priyadarshini Freshwater Intake",
      health: 96,
      status: "Pumping",
      powerKw: 8.5
    },
    {
      id: "maitri_radome",
      name: "Radome Tower",
      icon: RadioTower,
      focus: new THREE.Vector3(3.2, 2.2, -1.8),
      camPos: new THREE.Vector3(3.2, 4.5, 2.0),
      role: "Elevated Polar Satellite Radome Tower",
      health: 99,
      status: "Locked",
      powerKw: 6.4
    },
    {
      id: "maitri_wind",
      name: "Wind Turbine",
      icon: Activity,
      focus: new THREE.Vector3(1.6, 2.8, -2.2),
      camPos: new THREE.Vector3(1.6, 4.6, 2.0),
      role: "Schirmacher Polar Katabatic Aerogenerator",
      health: 96,
      status: "Spinning (Optimal)",
      powerKw: 22.8
    }
  ];

  const currentModules = isBharati ? bharatiModules : maitriModules;

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#050c17] via-[#091526] to-[#040913] border border-cyan-500/30 shadow-2xl shadow-cyan-950/40">
      {/* Top Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-500/30 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-bold uppercase tracking-wider">
            {stationName}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            {isBharati ? "Aerodynamic Stilted Model" : "Schirmacher Oasis Modular Complex"}
          </span>
        </div>

        {/* Quick Module Focus Buttons */}
        <div className="flex items-center space-x-1.5 pointer-events-auto bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={resetStationView}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              !selectedModule
                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Overview
          </button>

          {currentModules.map(item => {
            const isSel = selectedModule?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => focusModule(item)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center space-x-1 ${
                  isSel
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>{item.name}</span>
              </button>
            );
          })}

          <button
            onClick={resetStationView}
            title="Reset Camera Angle"
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Subsystem Telemetry HUD Drawer (Bottom Left) */}
      {(selectedModule || hoveredModule) && (
        <div className="absolute bottom-4 left-4 z-10 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-4 shadow-2xl shadow-cyan-950/60 max-w-sm pointer-events-none transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-cyan-400 uppercase">
                Subsystem Inspection
              </span>
              <div className="text-base font-bold text-white tracking-tight">
                {(selectedModule || hoveredModule).name}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
              {(selectedModule || hoveredModule).status}
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-2 font-sans">
            {(selectedModule || hoveredModule).role}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-3 text-xs font-mono">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">HEALTH SCORE</span>
              <span className="text-emerald-400 font-bold text-sm">
                {(selectedModule || hoveredModule).health}%
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">POWER FLOW</span>
              <span className="text-cyan-300 font-bold text-sm">
                {(selectedModule || hoveredModule).powerKw || 25.0} kW
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Helper HUD (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-950/80 backdrop-blur-md border border-cyan-500/25 rounded-xl px-3 py-2 text-xs font-mono text-slate-400 pointer-events-none">
        <div>Click module to inspect • Drag to rotate • Scroll to zoom</div>
      </div>
    </div>
  );
}
