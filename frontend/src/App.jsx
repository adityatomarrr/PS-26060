import React, { Component, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Boxes,
  Building2,
  CircleCheck,
  CloudSnow,
  Fuel,
  Gauge,
  MapPin,
  Radio,
  Satellite,
  ShieldAlert,
  Thermometer,
  Truck,
  Wind,
  Zap,
  Package,
  TriangleAlert,
  Play,
  RotateCcw,
  GitBranch,
  Server,
  RadioTower,
  Droplets,
  Wrench,
  Power,
  Route,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  useMap
} from "react-leaflet";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from "recharts";

import "leaflet/dist/leaflet.css";
import "./theme.css";
import AntarcticaGlobe3D from "./components/AntarcticaGlobe3D";
import StationModel3D from "./components/StationModel3D";
import InfrastructurePage from "./components/InfrastructurePage";
import PolarLink from "./components/PolarLink";
import {
  FALLBACK_STATIONS,
  FALLBACK_ENVIRONMENT,
  FALLBACK_ENERGY,
  FALLBACK_INVENTORY,
  FALLBACK_LOGISTICS,
  FALLBACK_ALERTS,
  FALLBACK_SATELLITE_PASSES
} from "./data/fallbackTelemetry";
import {
  Globe,
  Box,
  Volume2,
  VolumeX,
  Clock,
  Layers,
  Sparkles,
  MessageSquare
} from "lucide-react";

const API = "https://nivora-x9j6.onrender.com/api";

// Station-specific logistics fallback. This is seeded immediately on station change
// so the Logistics page cannot remain stuck on the previous station while the API loads.
const STATION_INVENTORY_FALLBACK = {
  maitri: {
    items: [
      { name: "Fuel", category: "Energy", current: 64, unit: "%", status: "NORMAL", priority: "MEDIUM" },
      { name: "Food Supplies", category: "Life Support", current: 78, unit: "%", status: "NORMAL", priority: "LOW" },
      { name: "Medical Supplies", category: "Safety", current: 61, unit: "%", status: "NORMAL", priority: "LOW" },
      { name: "Spare Parts", category: "Maintenance", current: 43, unit: "%", status: "LOW", priority: "HIGH" },
      { name: "Critical Equipment", category: "Operations", current: 86, unit: "%", status: "NORMAL", priority: "LOW" }
    ]
  },
  bharati: {
    items: [
      { name: "Fuel", category: "Energy", current: 71, unit: "%", status: "NORMAL", priority: "MEDIUM" },
      { name: "Food Supplies", category: "Life Support", current: 69, unit: "%", status: "NORMAL", priority: "LOW" },
      { name: "Medical Supplies", category: "Safety", current: 48, unit: "%", status: "LOW", priority: "MEDIUM" },
      { name: "Spare Parts", category: "Maintenance", current: 31, unit: "%", status: "LOW", priority: "HIGH" },
      { name: "Critical Equipment", category: "Operations", current: 91, unit: "%", status: "NORMAL", priority: "LOW" }
    ]
  }
};

const NAV = [
  ["Overview", Activity],
  ["Stations", Building2],
  ["Environment", Wind],
  ["Energy", Zap],
  ["Infrastructure", Wrench],
  ["Logistics", Truck],
  ["Alerts", AlertTriangle],
  ["Simulation", GitBranch],
  ["Satellite Link", Satellite],
  ["Data Monitor", Gauge],
  ["Polar Link", MessageSquare]
];

const SCENARIOS = [
  {
    id: "extreme_weather",
    title: "Extreme Weather",
    description:
      "Lower temperature and higher wind increase operational energy demand.",
    icon: <CloudSnow size={19} />
  },
  {
    id: "energy_spike",
    title: "Energy Demand Spike",
    description:
      "Simulate a sudden increase in station electrical load.",
    icon: <Zap size={19} />
  },
  {
    id: "logistics_delay",
    title: "Logistics Delay",
    description:
      "Simulate a 10-day resupply disruption and inventory consumption.",
    icon: <Truck size={19} />
  },
  {
    id: "combined_stress",
    title: "Combined Stress",
    description:
      "Simulate simultaneous weather and logistics pressure.",
    icon: <TriangleAlert size={19} />
  }
];

function App() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [activePage, setActivePage] = useState("Overview");

  const [environment, setEnvironment] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [logistics, setLogistics] = useState(null);

  const [simulation, setSimulation] = useState(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [recentRuns, setRecentRuns] = useState([]);

  const [lastSync, setLastSync] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [eventLog, setEventLog] = useState([]);
  const [actions, setActions] = useState([]);

  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const [liveHistory, setLiveHistory] = useState([]);
  const [infrastructure, setInfrastructure] = useState([]);

  // Admin Dashboard Authentication State (ID: byteforge@123, Pass: byteforge)
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem("adt_admin_auth") === "true";
    } catch {
      return false;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTargetTab, setLoginTargetTab] = useState(null);
  const [adminIdInput, setAdminIdInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleAdminLogin = e => {
    e.preventDefault();
    if (adminIdInput.trim() === "byteforge@123" && adminPasswordInput === "byteforge") {
      setIsAdmin(true);
      try {
        localStorage.setItem("adt_admin_auth", "true");
      } catch {}
      setShowLoginModal(false);
      setLoginError("");
      setAdminPasswordInput("");
      notify("Admin Authentication Successful. Full Command Center Unlocked.", "success");
      if (loginTargetTab) {
        setActivePage(loginTargetTab);
        setLoginTargetTab(null);
      }
    } else {
      setLoginError("Invalid credentials. Please enter ID: byteforge@123 and Password: byteforge");
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem("adt_admin_auth");
    } catch {}
    setActivePage("Overview");
    notify("Admin session signed out. Viewing Public Mode.", "info");
  };

  const handleNavClick = tabName => {
    if (tabName === "Overview" || isAdmin) {
      setActivePage(tabName);
    } else {
      setLoginTargetTab(tabName);
      setShowLoginModal(true);
    }
  };

  const addEvent = (message, type = "INFO") => {
    const item = {
      id: Date.now() + Math.random(),
      time: new Date(),
      message,
      type
    };

    setEventLog(prev => [item, ...prev].slice(0, 12));
  };

  const notify = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 2600);
  };

  // Audio FX state (Web Audio API Arctic Wind Ambient)
  const [audioActive, setAudioActive] = useState(false);
  const audioCtxRef = React.useRef(null);
  const noiseNodeRef = React.useRef(null);

  const togglePolarAudio = () => {
    try {
      if (audioActive) {
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
          audioCtxRef.current = null;
        }
        setAudioActive(false);
      } else {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Generate pink noise / polar wind buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2) * 0.08;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Lowpass filter for deep arctic wind whistle
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 380;

        const gain = ctx.createGain();
        gain.gain.value = 0.15;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(0);
        noiseNodeRef.current = noise;
        setAudioActive(true);
      }
    } catch (err) {
      console.warn("Audio Context unavailable:", err);
    }
  };

  // Real-time UTC & Antarctic Local Time clocks
  const [clockTimes, setClockTimes] = useState({ utc: "", maitri: "", bharati: "" });
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const utcStr = now.toUTCString().split(" ").slice(4, 5).join(" ");
      const maitriHours = (now.getUTCHours() + 0) % 24;
      const bharatiHours = (now.getUTCHours() + 5) % 24;
      const pad = n => String(n).padStart(2, "0");

      setClockTimes({
        utc: `${utcStr} UTC`,
        maitri: `${pad(maitriHours)}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC+0`,
        bharati: `${pad(bharatiHours)}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC+5`
      });
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load stations with resilient fallback
  useEffect(() => {
    fetch(`${API}/stations`)
      .then(response => {
        if (!response.ok) throw new Error("Station API offline");
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setStations(data);
          setSelectedStation(data[0]);
          addEvent("Connected to Live Backend Station Telemetry", "SUCCESS");
        } else {
          throw new Error("Empty station response");
        }
      })
      .catch(error => {
        console.warn("Using built-in station profiles & simulation:", error);
        setStations(FALLBACK_STATIONS);
        setSelectedStation(FALLBACK_STATIONS[0]);
        addEvent("Connected to Autonomous Polar Simulation Engine", "INFO");
      });
  }, []);

  // Load station baseline data
  useEffect(() => {
    if (!selectedStation) return;

    const id = selectedStation.id;
    let cancelled = false;

    setSimulation(null);
    setTelemetry([]);
    setLiveHistory([]);
    setActions([]);
    setEventLog([]);

    // Immediately switch the logistics dataset with the selected station.
    // The API response below will replace this with the authoritative data.
    setInventory(STATION_INVENTORY_FALLBACK[id] || null);

    Promise.all([
      fetch(`${API}/stations/${id}/environment`).then(r => r.json()),
      fetch(`${API}/stations/${id}/energy`).then(r => r.json()),
      fetch(`${API}/stations/${id}/alerts`).then(r => r.json()),
      fetch(`${API}/stations/${id}/inventory`).then(r => r.json()),
      fetch(`${API}/stations/${id}/logistics`).then(r => r.json()),
      fetch(`${API}/stations/${id}/assets`).then(r => r.json())
    ])
      .then(([env, eng, al, inv, log, assets]) => {
        if (cancelled) return;

        setEnvironment(env);
        setEnergy(eng);
        setAlerts(al.alerts || []);
        // Keep station-specific medical inventory aligned with the selected station.
        // Some backend responses currently reuse the previous station's medical value.
        // Normalize only that field so the rest of the live inventory remains authoritative.
        const stationFallback = STATION_INVENTORY_FALLBACK[id];
        const fallbackMedical = stationFallback?.items?.find(
          item => item.name === "Medical Supplies"
        );
        const normalizedInventory = {
          ...(inv || stationFallback || {}),
          items: (inv?.items || stationFallback?.items || []).map(item =>
            item.name === "Medical Supplies" && fallbackMedical
              ? { ...item, ...fallbackMedical }
              : item
          )
        };

        setInventory(normalizedInventory);
        setLogistics(log);
        setInfrastructure(assets.assets || []);

        addEvent(
          `${selectedStation.name} baseline loaded`,
          "OK"
        );
      })
      .catch(error => {
        if (cancelled) return;

        console.error(error);
        setInventory(STATION_INVENTORY_FALLBACK[id] || null);

        addEvent(
          "Station data request failed",
          "CRITICAL"
        );
      });

    return () => {
      cancelled = true;
    };
  }, [selectedStation]);

  // Live telemetry
  useEffect(() => {
    if (!selectedStation || simulation) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const response = await fetch(
          `${API}/stations/${selectedStation.id}/live`
        );

        if (!response.ok) {
          throw new Error(
            "Live endpoint unavailable"
          );
        }

        const data = await response.json();

        if (cancelled) return;

        setEnvironment(data.environment);
        setEnergy(data.energy);

        const syncTime = new Date(data.updatedAt);

        setLastSync(syncTime);

        const row = {
          time: syncTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          }),
          temperature:
            data.environment.temperature,
          windSpeed:
            data.environment.windSpeed,
          generation:
            data.energy.generation,
          consumption:
            data.energy.consumption,
          battery:
            data.energy.battery,
          fuel:
            data.energy.fuel
        };

        setLiveHistory(prev => [
          ...prev.slice(-19),
          row
        ]);

        setTelemetry(prev => [
          {
            id: Date.now() + Math.random(),
            time: syncTime,
            type: "ENV",
            message:
              `Temperature ${data.environment.temperature}°C • ` +
              `Wind ${data.environment.windSpeed} km/h`
          },
          {
            id: Date.now() + Math.random() + 1,
            time: syncTime,
            type: "ENG",
            message:
              `Load ${data.energy.consumption} kW • ` +
              `Battery ${data.energy.battery}%`
          },
          ...prev
        ].slice(0, 18));

      } catch (error) {
        console.error(error);

        if (!cancelled) {
          addEvent(
            "Live telemetry stream unavailable",
            "WARNING"
          );
        }
      }
    };

    tick();

    const timer = setInterval(
      tick,
      3000
    );

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedStation, simulation]);

  const displayedEnvironment =
    simulation?.environment || environment;

  const displayedEnergy =
    simulation?.energy || energy;

  const displayedInventory =
    simulation?.inventory || inventory;

  const criticalCount =
    alerts.filter(
      alert => alert.severity === "CRITICAL"
    ).length;

  const warningCount =
    alerts.filter(
      alert => alert.severity === "WARNING"
    ).length;

  const lowStockCount =
    displayedInventory?.items?.filter(
      item => item.status === "LOW"
    ).length || 0;

  const operationalRisk = useMemo(() => {
    if (simulation) {
      return simulation.riskScore;
    }

    let score = 0;

    if (
      displayedEnvironment?.temperature <= -25
    ) {
      score += 25;
    } else if (
      displayedEnvironment?.temperature <= -15
    ) {
      score += 10;
    }

    if (
      displayedEnvironment?.windSpeed >= 35
    ) {
      score += 25;
    } else if (
      displayedEnvironment?.windSpeed >= 25
    ) {
      score += 10;
    }

    if (
      displayedEnergy?.battery <= 20
    ) {
      score += 30;
    } else if (
      displayedEnergy?.battery <= 40
    ) {
      score += 15;
    }

    if (
      displayedEnergy?.fuel <= 20
    ) {
      score += 20;
    }

    return Math.min(score, 100);
  }, [
    simulation,
    displayedEnvironment,
    displayedEnergy
  ]);

  // Run simulation
  const runSimulation = async scenario => {
    if (!selectedStation) return;

    setSimulationLoading(true);

    try {
      const response = await fetch(
        `${API}/simulation/run`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            stationId:
              selectedStation.id,
            scenario
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Simulation failed"
        );
      }

      setSimulation(data);
      setRecentRuns(prev => [
        {
          scenario: data.scenario || scenario,
          station: data.station || selectedStation.id,
          riskScore: Number(data.riskScore ?? 0),
          riskLevel: data.riskLevel || "NORMAL",
          generatedAt: data.generatedAt || new Date().toISOString()
        },
        ...prev
      ].slice(0, 8));
      setActivePage("Simulation");

      addEvent(
        `${scenarioLabel(
          scenario
        )} simulation executed • Risk ${data.riskScore}/100`,
        data.riskLevel === "CRITICAL"
          ? "CRITICAL"
          : "WARNING"
      );

      notify(
        "Simulation state applied"
      );
    } catch (error) {
      console.error(error);

      notify(
        "Simulation request failed",
        "error"
      );
    } finally {
      setSimulationLoading(false);
    }
  };

  const clearSimulation = () => {
    setSimulation(null);
    setActions([]);

    addEvent(
      "Returned to live station state",
      "OK"
    );

    notify(
      "Live state restored"
    );
  };

  // Operator actions
  const executeAction = async action => {
    if (
      !displayedEnergy ||
      !displayedEnvironment
    ) {
      return;
    }

    setActionBusy(true);

    await new Promise(
      resolve => setTimeout(resolve, 500)
    );

    if (action === "load") {
      const newConsumption =
        Math.max(
          20,
          displayedEnergy.consumption - 12
        );

      const newBattery =
        Math.min(
          100,
          Number(
            (
              displayedEnergy.battery + 5
            ).toFixed(1)
          )
        );

      setEnergy(prev =>
        prev
          ? {
              ...prev,
              consumption:
                newConsumption,
              battery:
                newBattery
            }
          : prev
      );

      if (simulation) {
        setSimulation(prev =>
          prev
            ? {
                ...prev,
                energy: {
                  ...prev.energy,
                  consumption:
                    newConsumption,
                  battery:
                    newBattery
                },
                energyBalance:
                  prev.energy.generation -
                  newConsumption
              }
            : prev
        );
      }

      setInfrastructure(prev =>
        prev.map(item =>
          item.name ===
          "Main Power System"
            ? {
                ...item,
                health: Math.min(
                  100,
                  item.health + 2
                )
              }
            : item
        )
      );

      addEvent(
        "Non-essential load reduced by 12 kW",
        "ACTION"
      );

      notify(
        "Load reduction applied"
      );
    }

    if (action === "heating") {
      const newConsumption =
        displayedEnergy.consumption + 4;

      setEnergy(prev =>
        prev
          ? {
              ...prev,
              consumption:
                newConsumption
            }
          : prev
      );

      if (simulation) {
        setSimulation(prev =>
          prev
            ? {
                ...prev,
                energy: {
                  ...prev.energy,
                  consumption:
                    newConsumption
                },
                energyBalance:
                  prev.energy.generation -
                  newConsumption
              }
            : prev
        );
      }

      setInfrastructure(prev =>
        prev.map(item =>
          item.name ===
          "Heating System"
            ? {
                ...item,
                health: Math.min(
                  100,
                  item.health + 3
                )
              }
            : item
        )
      );

      addEvent(
        "Heating reserve increased • Energy load +4 kW",
        "ACTION"
      );

      notify(
        "Heating reserve increased"
      );
    }

    if (action === "resupply") {
      const target =
        displayedInventory?.items?.find(
          item =>
            item.priority === "HIGH"
        ) ||
        displayedInventory?.items?.[0];

      if (target) {
        const updated = {
          ...displayedInventory,
          items:
            displayedInventory.items.map(
              item =>
                item.name === target.name
                  ? {
                      ...item,
                      current:
                        Math.min(
                          100,
                          item.current + 20
                        ),
                      daysRemaining:
                        item.daysRemaining +
                        14,
                      status:
                        "NORMAL"
                    }
                  : item
            )
        };

        setInventory(updated);

        if (simulation) {
          setSimulation(prev =>
            prev
              ? {
                  ...prev,
                  inventory:
                    updated
                }
              : prev
          );
        }

        addEvent(
          `Resupply request created for ${target.name}`,
          "ACTION"
        );

        notify(
          `Resupply scheduled: ${target.name}`
        );
      }
    }

    if (action === "ack") {
      if (alerts.length) {
        setAlerts(
          prev => prev.slice(1)
        );

        addEvent(
          "Highest-priority alert acknowledged",
          "ACTION"
        );

        notify(
          "Alert acknowledged"
        );
      }
    }

    setActions(prev => [
      {
        id: Date.now(),
        action,
        time: new Date()
      },
      ...prev
    ].slice(0, 8));

    setActionBusy(false);
  };

  if (!selectedStation) {
    return (
      <div className="min-h-screen bg-[#071521] text-white flex items-center justify-center">
        Loading Antarctic Command Center...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a12] text-slate-100 scanline-overlay">

      {/* SIDEBAR */}

      <aside className="sidebar-scroll fixed left-0 top-0 z-40 w-64 border-r border-cyan-500/20 bg-slate-950/95 backdrop-blur-2xl p-5 hidden md:block h-screen overflow-y-auto overscroll-contain text-white shadow-2xl">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-600/20 flex items-center justify-center">
            <CloudSnow
              className="text-cyan-300"
              size={22}
            />
          </div>

          <div>
            <h1 className="font-bold text-sm tracking-wider text-cyan-300">
              NIVORA
            </h1>

            <p className="text-[10px] text-slate-400 font-mono tracking-tight">
              POLAR DIGITAL TWIN
            </p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {/* Admin Mode Badge or Login Button */}
          {isAdmin ? (
            <div className="border border-cyan-500/30 bg-cyan-950/40 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Unlock size={13} className="text-emerald-400" />
                  Admin Mode
                </span>
                <button
                  onClick={handleAdminLogout}
                  className="text-[10px] text-red-400 hover:text-red-300 font-mono px-2 py-0.5 border border-red-500/30 rounded bg-red-500/10 cursor-pointer"
                >
                  Logout
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">byteforge@123</p>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold shadow-lg transition cursor-pointer"
            >
              <Lock size={14} />
              Admin Dashboard Login
            </button>
          )}

          {NAV.map(([name, Icon]) => {
            const isProtected = name !== "Overview" && !isAdmin;
            return (
              <button
                key={name}
                onClick={() => handleNavClick(name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition cursor-pointer ${
                  activePage === name
                    ? "bg-cyan-300/10 text-cyan-200 border border-cyan-300/20"
                    : isProtected
                    ? "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/80/5"
                }`}
              >
                <Icon size={17} className={isProtected ? "text-slate-300 opacity-100 shrink-0" : "text-current shrink-0"} />

                <span>{name}</span>

                {isProtected && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    <Lock size={10} />
                    ADMIN
                  </span>
                )}

                {!isProtected &&
                  name === "Alerts" &&
                  criticalCount + warningCount > 0 && (
                    <span className="ml-auto text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">
                      {criticalCount + warningCount}
                    </span>
                  )}

                {!isProtected && name === "Logistics" && lowStockCount > 0 && (
                  <span className="ml-auto text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                    {lowStockCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 border border-[#173246] bg-slate-900/80/5 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />

            System Online
          </div>

          <p className="text-[10px] text-slate-500 mt-2">
            API + simulation + live telemetry
          </p>
        </div>

        <div className="mt-4 border border-[#173246] bg-slate-900/80/5 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            Current risk
          </p>

          <p
            className={`text-2xl font-bold mt-1 ${
              operationalRisk >= 70
                ? "text-red-400"
                : operationalRisk >= 30
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {operationalRisk}/100
          </p>
        </div>
      </aside>

      {/* MAIN */}

      <main className="min-h-screen md:ml-64 flex-1 p-5 md:p-8 overflow-x-hidden bg-[#050a12] text-slate-100">

        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-8">

          <div>
            <p className="text-xs text-cyan-400 tracking-[0.18em] uppercase font-semibold">
              Remote Operations Command Center
            </p>

            <h2 className="text-2xl md:text-3xl font-bold mt-1">
              {pageTitle(activePage)}
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Infrastructure, environment, energy,
              logistics and operational risk
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 rounded-xl px-3 py-2">

              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />

                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>

              <div>
                <p className="text-[10px] text-emerald-400 font-medium">
                  {simulation
                    ? "SIMULATION"
                    : "LIVE SIMULATION"}
                </p>

                <p className="text-[9px] text-slate-500">
                  {lastSync
                    ? `Last sync ${lastSync.toLocaleTimeString()}`
                    : "Connecting..."}
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-2 border border-cyan-500/20 bg-slate-900/80 rounded-xl shadow-lg shadow-cyan-950/20 card-3d px-4 py-2.5 pr-10">

              <Radio
                size={17}
                className="text-cyan-400"
              />

              <select
                value={selectedStation.id}
                onChange={event =>
                  setSelectedStation(
                    stations.find(
                      station =>
                        station.id ===
                        event.target.value
                    )
                  )
                }
                className="appearance-auto bg-transparent text-sm text-slate-100 outline-none cursor-pointer min-w-[140px]"
              >
                {stations.map(station => (
                  <option
                    key={station.id}
                    value={station.id}
                    className="bg-slate-900/80 text-slate-100"
                  >
                    {station.name} Station
                  </option>
                ))}
              </select>

            </div>

            {/* Admin Session Indicator / Login Trigger */}
            {isAdmin ? (
              <div className="flex items-center gap-2 border border-cyan-500/30 bg-cyan-950/40 rounded-xl px-3 py-2">
                <Unlock size={15} className="text-emerald-400" />
                <span className="text-xs font-mono text-cyan-200 hidden sm:inline">byteforge@123</span>
                <button
                  onClick={handleAdminLogout}
                  className="text-[10px] text-red-400 hover:text-red-300 font-mono px-2 py-0.5 border border-red-500/30 rounded bg-red-500/10 cursor-pointer ml-1"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-lg transition cursor-pointer"
              >
                <Lock size={14} />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </header>

        {simulation && (
          <div className="border border-cyan-600/20 bg-cyan-500/10 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            <div className="flex items-center gap-3">

              <GitBranch
                size={20}
                className="text-cyan-400"
              />

              <div>
                <p className="text-xs text-cyan-400 uppercase tracking-wider">
                  Simulation active
                </p>

                <p className="text-sm text-slate-200 mt-1">
                  Projected state:
                  <span className="font-medium text-slate-900 ml-1">
                    {scenarioLabel(
                      simulation.scenario
                    )}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={clearSimulation}
              className="flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg border border-slate-700 text-slate-500 hover:text-slate-900"
            >
              <RotateCcw size={14} />
              Return to live state
            </button>
          </div>
        )}

        {toast && (
          <div
            className={`fixed top-5 right-5 z-[1000] border rounded-xl px-4 py-3 text-sm shadow-2xl ${
              toast.type === "error"
                ? "border-red-500/30 bg-slate-900/80 text-red-300"
                : "border-emerald-500/30 bg-[#071521] text-emerald-300"
            }`}
          >
            {toast.message}
          </div>
        )}

        {activePage === "Overview" && (
          <Overview
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            environment={displayedEnvironment}
            energy={displayedEnergy}
            inventory={displayedInventory}
            alerts={alerts}
            stations={stations}
            risk={operationalRisk}
            liveHistory={liveHistory}
            simulation={simulation}
          />
        )}

        {activePage === "Stations" && (
          <StationsPage
            stations={stations}
            selectedStation={selectedStation}
            setSelectedStation={
              setSelectedStation
            }
          />
        )}

        {activePage === "Environment" && (
          <EnvironmentPage
            environment={
              displayedEnvironment
            }
            history={liveHistory}
            selectedStation={
              selectedStation
            }
          />
        )}

        {activePage === "Energy" && (
          <EnergyPage
            energy={displayedEnergy}
            history={liveHistory}
            onAction={executeAction}
            busy={actionBusy}
            simulation={simulation}
          />
        )}

        {activePage === "Infrastructure" && (
          <InfrastructurePage
            infrastructure={infrastructure}
            environment={displayedEnvironment}
            energy={displayedEnergy}
            selectedStation={selectedStation}
          />
        )}

        {activePage === "Logistics" && (
          <LogisticsPage
            inventory={
              displayedInventory
            }
            logistics={logistics}
            onAction={executeAction}
            busy={actionBusy}
          />
        )}

        {activePage === "Alerts" && (
          <AlertsPage
            alerts={alerts}
            onAction={executeAction}
            busy={actionBusy}
          />
        )}

        {activePage === "Simulation" && (
          <SimulationPage
            scenarios={SCENARIOS}
            onRun={runSimulation}
            loading={simulationLoading}
            simulation={simulation}
            selectedStation={selectedStation}
            stations={stations}
            setSelectedStation={setSelectedStation}
            recentRuns={recentRuns}
          />
        )}

        {activePage === "Satellite Link" && (
          <SatellitePage
            selectedStation={
              selectedStation
            }
          />
        )}

        {activePage === "Data Monitor" && (
          <DataMonitor
            telemetry={telemetry}
            eventLog={eventLog}
            actions={actions}
            liveHistory={liveHistory}
          />
        )}

        {activePage === "Polar Link" && (
          <PolarLink
            stations={stations}
            selectedStation={selectedStation}
            telemetry={telemetry}
            environment={environment}
            energy={displayedEnergy}
            inventory={inventory}
            isAdmin={isAdmin}
          />
        )}

        <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 mt-8">
          <p className="text-xs text-amber-300">
            <strong>
              Data provenance:
            </strong>{" "}
            Station metadata is based on publicly
            available NCPOR information. Environment,
            energy and inventory telemetry in this
            prototype is simulated. Scenario outputs
            are generated by an explainable deterministic
            simulation engine and are not live station
            telemetry.
          </p>
        </div>
      </main>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="border border-cyan-500/35 bg-[#071322] rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-cyan-950/80">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Admin Command Center</h3>
                  <p className="text-[10px] text-slate-400 font-mono">NIVORA Command Access</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError("");
                }}
                className="text-slate-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="mt-4 space-y-4">
              {loginError && (
                <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  ADMIN ID
                </label>
                <input
                  type="text"
                  value={adminIdInput}
                  onChange={e => setAdminIdInput(e.target.value)}
                  placeholder="Enter Admin ID (byteforge@123)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminPasswordInput}
                    onChange={e => setAdminPasswordInput(e.target.value)}
                    placeholder="Enter Admin Password"
                    className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs outline-none font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <label className="flex items-center gap-2 mt-2 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={e => setShowPassword(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                  <span>Show password</span>
                </label>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-cyan-950/40 cursor-pointer"
                >
                  Authenticate & Unlock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginError("");
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


// ===============================
// MAP HELPERS
// ===============================

// Frames the map to show every valid station instead of a
// hardcoded center/zoom, so it still looks right if stations
// are added or removed.
function FitStationBounds({ stations }) {
  const map = useMap();

  useEffect(() => {
    if (!stations.length) return;

    if (stations.length === 1) {
      map.setView(
        [
          stations[0].location.latitude,
          stations[0].location.longitude
        ],
        4,
        { animate: false }
      );
      return;
    }

    map.fitBounds(
      stations.map(station => [
        station.location.latitude,
        station.location.longitude
      ]),
      { padding: [30, 30], animate: false }
    );
  }, [map, stations]);

  return null;
}

// Catches Leaflet/tile-related render errors so a map failure
// only takes down this card instead of the whole page.
class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Map failed to render:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center text-sm text-slate-500 bg-slate-50">
          Map unavailable right now.
        </div>
      );
    }

    return this.props.children;
  }
}

// ===============================
// OVERVIEW
// ===============================

function Overview({
  selectedStation,
  setSelectedStation,
  environment,
  energy,
  inventory,
  alerts,
  stations,
  risk,
  liveHistory,
  simulation
}) {
  const critical = alerts.filter(a => a.severity === "CRITICAL").length;
  const warning = alerts.filter(a => a.severity === "WARNING").length;
  const [globeFailed, setGlobeFailed] = useState(false);
  const handleGlobeFailure = useCallback(() => setGlobeFailed(true), []);

  const validStations = useMemo(
    () => stations.filter(st =>
      typeof st?.location?.latitude === "number" &&
      typeof st?.location?.longitude === "number"
    ),
    [stations]
  );

  const latestHistory = liveHistory[liveHistory.length - 1];
  const totalGeneration = Number(energy?.generation ?? 0);
  const totalConsumption = Number(energy?.consumption ?? 0);
  const battery = Number(energy?.battery ?? 0);
  const fuel = Number(energy?.fuel ?? 0);
  const lowStock = inventory?.items?.filter(item => item.status === "LOW").length || 0;
  const infraHealth = inventory?.items?.length
    ? Math.round(inventory.items.reduce((sum, item) => sum + Math.min(100, Math.max(0, Number(item.current ?? 0))), 0) / inventory.items.length)
    : null;

  return (
    <div className="overview-mission-control space-y-4">
      <div className="overview-command-header border border-cyan-500/25 bg-[#050b15] px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-[0.22em] text-emerald-300 uppercase">Network for Intelligent Virtual Operations and Remote Analytics</span>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-100 mt-1">NIVORA</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono uppercase tracking-wider">
          <div className="border border-cyan-500/20 px-3 py-2"><span className="text-slate-500 block">ACTIVE STATION</span><span className="text-cyan-300">{selectedStation.name}</span></div>
          <div className="border border-cyan-500/20 px-3 py-2"><span className="text-slate-500 block">RISK INDEX</span><span className={risk >= 70 ? "text-red-400" : risk >= 30 ? "text-amber-300" : "text-emerald-300"}>{risk}/100</span></div>
          <div className="border border-cyan-500/20 px-3 py-2"><span className="text-slate-500 block">LINK STATUS</span><span className="text-emerald-300">NOMINAL</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4">
        <div className="border border-cyan-500/25 bg-[#030913] overflow-hidden min-h-[600px]">
          <div className="px-4 py-3 border-b border-cyan-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono tracking-[0.18em] text-cyan-300 uppercase">Station Network / 3D Globe</p>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">GEOGRAPHIC POSITIONS LOCKED TO EARTH REFERENCE FRAME</p>
            </div>
            <div className="flex gap-2 text-[9px] font-mono uppercase">
              <span className="px-2 py-1 border border-cyan-500/25 text-cyan-300">WEBGL</span>
              <span className="px-2 py-1 border border-slate-700 text-slate-500">LIVE</span>
            </div>
          </div>
          <div className="relative h-[540px]">
            {!globeFailed ? (
              <AntarcticaGlobe3D
                stations={validStations}
                selectedStation={selectedStation}
                onSelectStation={setSelectedStation}
                windSpeed={environment?.windSpeed ?? 20}
                temperature={environment?.temperature ?? -15}
                onWebGLFailure={handleGlobeFailure}
              />
            ) : (
              <MapErrorBoundary>
                <MapContainer center={[-70, 45]} zoom={3} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                  <FitStationBounds stations={validStations} />
                  <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {validStations.map(station => (
                    <CircleMarker
                      key={station.id}
                      center={[station.location.latitude, station.location.longitude]}
                      radius={station.id === selectedStation.id ? 9 : 6}
                      pathOptions={{ color: station.id === selectedStation.id ? "#22d3ee" : "#38bdf8", fillColor: "#22d3ee", fillOpacity: 0.8 }}
                      eventHandlers={{ click: () => setSelectedStation(station) }}
                    >
                      <Popup>{station.name}</Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </MapErrorBoundary>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <MissionPanel title="REAL-TIME TELEMETRY">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs font-mono">
              <TelemetryValue label="TEMPERATURE" value={environment ? `${environment.temperature} °C` : "--"} />
              <TelemetryValue label="WIND SPEED" value={environment ? `${environment.windSpeed} km/h` : "--"} />
              <TelemetryValue label="HUMIDITY" value={environment ? `${environment.humidity}%` : "--"} />
              <TelemetryValue label="PRESSURE" value={environment ? `${environment.pressure} hPa` : "--"} />
              <TelemetryValue label="POWER OUTPUT" value={energy ? `${energy.generation} kW` : "--"} />
              <TelemetryValue label="BATTERY SOC" value={energy ? `${energy.battery}%` : "--"} />
            </div>
          </MissionPanel>

          <MissionPanel title="ACTIVE STATION">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-100">{selectedStation.name}</p>
                <p className="text-[10px] text-cyan-300 font-mono mt-1">{selectedStation.region}</p>
              </div>
              <span className="text-[9px] font-mono text-emerald-300 border border-emerald-500/30 px-2 py-1">ONLINE</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 text-[10px] font-mono">
              <TelemetryValue label="LAT" value={`${Math.abs(selectedStation.location.latitude).toFixed(4)}°S`} />
              <TelemetryValue label="LON" value={`${selectedStation.location.longitude.toFixed(4)}°E`} />
              <TelemetryValue label="ELEVATION" value={`${selectedStation.elevation ?? "--"} m`} />
              <TelemetryValue label="CAPACITY" value={`${selectedStation.mainBuildingCapacity ?? "--"}`} />
            </div>
          </MissionPanel>

          <MissionPanel title="RECENT ACTIVITY">
            <div className="space-y-2.5 font-mono">
              {liveHistory.slice(-7).reverse().map((row, i) => (
                <div
                  key={`${row.time}-${i}`}
                  className="flex justify-between items-center gap-3 text-[10px] border-b border-slate-800/80 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-cyan-400 font-semibold">{row.time}</span>
                  <span className="text-slate-400 text-right">Telemetry synchronized</span>
                </div>
              ))}
              {!liveHistory.length && (
                <p className="text-[10px] text-slate-500 py-3 text-center">
                  Waiting for live telemetry...
                </p>
              )}
            </div>
          </MissionPanel>
        </div>
      </div>
    </div>
  );
}

function MissionPanel({ title, children }) {
  return (
    <section className="border border-cyan-500/20 bg-[#07101c] p-4">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/15">
        <h3 className="text-[10px] font-mono tracking-[0.18em] text-cyan-300 uppercase">{title}</h3>
        <span className="w-1.5 h-1.5 bg-cyan-400" />
      </div>
      {children}
    </section>
  );
}

function TelemetryValue({ label, value }) {
  return <div>
    <p className="text-[8px] text-slate-500 tracking-wider">{label}</p>
    <p className="text-slate-100 mt-1">{value}</p>
  </div>;
}

function MetricValue({ value, label }) {
  return <div className="border border-slate-800 p-3"><p className="text-xl text-slate-100">{value}</p><p className="text-[8px] text-slate-500 mt-1">{label}</p></div>;
}

// ===============================
// STATIONS
// ===============================

function StationsPage({
  stations,
  selectedStation,
  setSelectedStation,
  environment,
  energy
}) {
  return (
    <div>
      <SectionTitle
        title="Station Operations & 3D Architectural Twin"
        subtitle="Switch the active digital twin and inspect 3D station modules, life-support and energy arrays."
      />

      {/* 3D Station Model Inspector */}
      <div className="mb-6">
        <StationModel3D
          station={selectedStation}
          environment={environment}
          energy={energy}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {stations.map(station => (
          <button
            key={station.id}
            onClick={() =>
              setSelectedStation(
                station
              )
            }
            className={`text-left border rounded-2xl p-5 transition ${
              station.id ===
              selectedStation.id
                ? "border-cyan-500/40 bg-cyan-500/10"
                : "border-cyan-500/20 bg-slate-900/80 hover:border-slate-600"
            }`}
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <Building2
                  className="text-cyan-400"
                />

                <h3 className="font-semibold text-lg">
                  {station.name}
                </h3>
              </div>

              <span className="text-[10px] text-emerald-400">
                OPERATIONAL
              </span>
            </div>

            <p className="text-sm text-slate-500 mt-2">
              {station.region}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-5">

              <Mini
                label="Latitude"
                value={`${station.location.latitude}°`}
              />

              <Mini
                label="Longitude"
                value={`${station.location.longitude}°`}
              />

              <Mini
                label="Main capacity"
                value={`${station.mainBuildingCapacity}`}
              />

              <Mini
                label="Summer capacity"
                value={`${station.summerCapacity}`}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}


// ===============================
// ENVIRONMENT
// ===============================

function EnvironmentPage({
  environment,
  history,
  selectedStation
}) {
  return (
    <div>

      <SectionTitle
        title="Environment Telemetry"
        subtitle={`Live atmospheric conditions • ${selectedStation.name}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">

        <MetricCard
          icon={<Thermometer />}
          title="Temperature"
          value={
            environment
              ? `${environment.temperature}°C`
              : "--"
          }
        />

        <MetricCard
          icon={<Droplets />}
          title="Humidity"
          value={
            environment
              ? `${environment.humidity}%`
              : "--"
          }
        />

        <MetricCard
          icon={<Wind />}
          title="Wind"
          value={
            environment
              ? `${environment.windSpeed} km/h`
              : "--"
          }
          secondary={
            environment?.windDirection
          }
        />

        <MetricCard
          icon={<Gauge />}
          title="Pressure"
          value={
            environment
              ? `${environment.pressure} hPa`
              : "--"
          }
        />
      </div>

      <ChartCard
        title="Live Atmospheric Trend"
        subtitle="New samples arrive every 3 seconds"
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart data={history}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
            />

            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
            />

            <YAxis
              stroke="#64748b"
              fontSize={10}
            />

            <Tooltip
              contentStyle={{
                backgroundColor:
                  "#0f172a",
                border:
                  "1px solid #334155"
              }}
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#22d3ee"
              dot={false}
              name="Temperature °C"
            />

            <Line
              type="monotone"
              dataKey="windSpeed"
              stroke="#a78bfa"
              dot={false}
              name="Wind km/h"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}


// ===============================
// ENERGY
// ===============================

function EnergyPage({
  energy,
  history,
  onAction,
  busy,
  simulation
}) {
  return (
    <div>

      <SectionTitle
        title="Energy Management"
        subtitle="Power generation, consumption and reserve response"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">

        <MetricCard
          icon={<Zap />}
          title="Generation"
          value={
            energy
              ? `${energy.generation} kW`
              : "--"
          }
        />

        <MetricCard
          icon={<Activity />}
          title="Consumption"
          value={
            energy
              ? `${energy.consumption} kW`
              : "--"
          }
        />

        <MetricCard
          icon={<BatteryCharging />}
          title="Battery"
          value={
            energy
              ? `${energy.battery}%`
              : "--"
          }
        />

        <MetricCard
          icon={<Fuel />}
          title="Fuel Reserve"
          value={
            energy
              ? `${energy.fuel}%`
              : "--"
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <ChartCard
          wide
          title="Live Energy Trend"
          subtitle="Generation versus current station load"
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart data={history}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={10}
              />

              <YAxis
                stroke="#64748b"
                fontSize={10}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor:
                    "#0f172a",
                  border:
                    "1px solid #334155"
                }}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="generation"
                stroke="#22d3ee"
                dot={false}
                name="Generation kW"
              />

              <Line
                type="monotone"
                dataKey="consumption"
                stroke="#f59e0b"
                dot={false}
                name="Consumption kW"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="border border-cyan-500/20 bg-slate-900/80 rounded-2xl shadow-xl shadow-cyan-950/30 hud-panel card-3d p-5">

          <h3 className="font-semibold mb-5">
            Operator Controls
          </h3>

          <div className="space-y-3">

            <ActionButton
              onClick={() =>
                onAction("load")
              }
              disabled={busy}
              icon={<Power />}
              text="Reduce non-essential load"
            />

            <ActionButton
              onClick={() =>
                onAction("heating")
              }
              disabled={busy}
              icon={<Thermometer />}
              text="Increase heating reserve"
            />
          </div>

          <div className="border-t border-cyan-500/20 mt-5 pt-5">

            <p className="text-xs text-slate-500">
              Energy balance
            </p>

            <p
              className={`text-2xl font-bold mt-1 ${
                energy &&
                energy.generation -
                  energy.consumption >=
                  0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {energy
                ? `${
                    energy.generation -
                    energy.consumption
                  } kW`
                : "--"}
            </p>

            <p className="text-xs text-slate-500 mt-2">
              {simulation
                ? "Projected simulation state"
                : "Live simulated telemetry"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


// ===============================
// LOGISTICS
// ===============================

function LogisticsPage({
  inventory,
  logistics,
  onAction,
  busy
}) {
  return (
    <div>

      <SectionTitle
        title="Logistics & Inventory"
        subtitle="Stock monitoring, depletion horizon and resupply decisions"
      />

      <div className="flex justify-end mb-4">

        <ActionButton
          onClick={() =>
            onAction("resupply")
          }
          disabled={busy}
          icon={<Truck />}
          text="Schedule priority resupply"
        />
      </div>

      <div className="space-y-3">

        {inventory?.items?.map(
          item => (
            <InventoryRow
              key={item.name}
              item={item}
            />
          )
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">

        <InfoBox
          icon={<Boxes />}
          label="Tracked Items"
          value={
            inventory?.items?.length ||
            0
          }
        />

        <InfoBox
          icon={<TriangleAlert />}
          label="Low Stock"
          value={
            inventory?.items?.filter(
              item =>
                item.status ===
                "LOW"
            ).length || 0
          }
        />

        <InfoBox
          icon={<Truck />}
          label="Resupply"
          value={
            logistics?.resupplyRequired
              ? "REQUIRED"
              : "READY"
          }
        />
      </div>
    </div>
  );
}


// ===============================
// ALERTS
// ===============================

function AlertsPage({
  alerts,
  onAction,
  busy
}) {
  return (
    <div>

      <SectionTitle
        title="Alerts & Risk Engine"
        subtitle="Threshold-based, explainable operational events"
      />

      <div className="flex justify-end mb-4">

        <ActionButton
          onClick={() =>
            onAction("ack")
          }
          disabled={
            busy ||
            !alerts.length
          }
          icon={<CheckCircle2 />}
          text="Acknowledge highest priority"
        />
      </div>

      <div className="space-y-3">

        {alerts.length === 0 ? (
          <div className="border border-cyan-500/20 rounded-xl p-8 text-center text-sm text-slate-500">
            No active alerts.
          </div>
        ) : (
          alerts.map(
            (alert, index) => (
              <AlertCard
                key={`${alert.title}-${index}`}
                alert={alert}
              />
            )
          )
        )}
      </div>
    </div>
  );
}


// ===============================
// SIMULATION
// ===============================

function SimulationPage({
  scenarios,
  onRun,
  loading,
  simulation,
  selectedStation,
  stations,
  setSelectedStation,
  recentRuns
}) {
  const [selectedScenario, setSelectedScenario] = useState(
    simulation?.scenario || scenarios[0]?.id || ""
  );

  useEffect(() => {
    if (simulation?.scenario) setSelectedScenario(simulation.scenario);
  }, [simulation?.scenario]);

  const activeScenario = scenarios.find(s => s.id === selectedScenario);

  return (
    <div className="mission-simulation space-y-4">
      <SectionTitle
        title="Operational Scenario Simulator"
        subtitle="Run the real station simulation engine and inspect projected cause → effect changes"
      />

      <div className="border border-cyan-500/25 bg-[#050b15] p-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-mono tracking-[0.2em] text-cyan-300 uppercase">Simulation Target</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {stations.map(station => (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => setSelectedStation(station)}
                  disabled={loading}
                  className={`px-3 py-2 border text-xs font-mono transition ${
                    selectedStation?.id === station.id
                      ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-200"
                      : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
                  } disabled:opacity-50`}
                >
                  {station.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            Active target: <span className="text-slate-200">{selectedStation?.name || "--"}</span>
          </div>
        </div>
      </div>

      <div className="border border-cyan-500/25 bg-[#050b15] p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-cyan-300 uppercase">Scenario Matrix</p>
            <p className="text-xs text-slate-500 mt-1">Select one existing scenario, then execute it against the active station.</p>
          </div>
          {loading && <span className="text-[10px] font-mono text-amber-300 animate-pulse">ENGINE RUNNING...</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              type="button"
              disabled={loading}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`flex items-center gap-2 px-3 py-2 border text-xs font-mono transition ${
                selectedScenario === scenario.id
                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                  : "border-slate-700 bg-[#07101c] text-slate-400 hover:border-cyan-500/50 hover:text-slate-200"
              } disabled:opacity-50`}
            >
              {scenario.icon}
              {scenario.title}
            </button>
          ))}
        </div>

        {activeScenario && (
          <div className="mt-3 border-l-2 border-cyan-500/40 pl-3 text-xs text-slate-500">
            {activeScenario.description}
          </div>
        )}

        <button
          type="button"
          disabled={loading || !selectedStation || !selectedScenario}
          onClick={() => onRun(selectedScenario)}
          className="mt-4 w-full md:w-auto min-w-[180px] px-5 py-3 border border-cyan-400/70 bg-cyan-400/10 text-cyan-100 text-xs font-mono tracking-[0.16em] hover:bg-cyan-400/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "EXECUTING..." : "EXECUTE"}
        </button>
      </div>

      {simulation && <SimulationResult simulation={simulation} selectedStation={selectedStation} />}

      <RecentRuns runs={recentRuns} stations={stations} />
    </div>
  );
}

function SimulationResult({ simulation, selectedStation }) {
  const riskClass = simulation.riskLevel === "CRITICAL"
    ? "text-red-400"
    : simulation.riskLevel === "WARNING"
    ? "text-amber-400"
    : "text-emerald-400";

  const environment = simulation.environment || {};
  const energy = simulation.energy || {};
  const inventory = simulation.inventory || {};
  const effects = Array.isArray(simulation.effects) ? simulation.effects : [];
  const recommendations = Array.isArray(simulation.recommendations) ? simulation.recommendations : [];
  const risks = Array.isArray(simulation.risks) ? simulation.risks : [];

  const projectedFields = [
    ["Temperature", environment.temperature != null ? `${environment.temperature} °C` : "--"],
    ["Wind Speed", environment.windSpeed != null ? `${environment.windSpeed} km/h` : "--"],
    ["Humidity", environment.humidity != null ? `${environment.humidity} %` : "--"],
    ["Pressure", environment.pressure != null ? `${environment.pressure}` : "--"]
  ];

  const energyFields = [
    ["Generation", energy.generation != null ? `${energy.generation} kW` : "--"],
    ["Consumption", energy.consumption != null ? `${energy.consumption} kW` : "--"],
    ["Battery", energy.battery != null ? `${energy.battery} %` : "--"],
    ["Fuel", energy.fuel != null ? `${energy.fuel} %` : "--"]
  ];

  const affected = risks.length
    ? [...new Set(risks.map(r => r.system).filter(Boolean))]
    : effects.length
    ? ["Operational Effects"]
    : [];

  return (
    <div className="border border-cyan-500/25 bg-[#050b15] p-4 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <p className="text-[10px] font-mono tracking-[0.2em] text-emerald-300 uppercase">Simulation Result</p>
          <h3 className="text-lg text-slate-100 font-mono mt-1">{scenarioLabel(simulation.scenario)}</h3>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            TARGET: {selectedStation?.name?.toUpperCase() || simulation.station?.toUpperCase() || "--"}
          </p>
        </div>
        <div className="border border-slate-700 px-4 py-3 text-right min-w-[150px]">
          <p className="text-[9px] text-slate-500 font-mono">PROJECTED RISK</p>
          <p className={`text-4xl font-mono leading-none mt-1 ${riskClass}`}>
            {Number(simulation.riskScore ?? 0)}<span className="text-sm text-slate-600">/100</span>
          </p>
          <p className={`text-[10px] font-mono mt-1 ${riskClass}`}>{simulation.riskLevel || "NORMAL"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Environment Projection">
          <div className="grid grid-cols-2 gap-px bg-slate-800">
            {projectedFields.map(([label, value]) => (
              <div key={label} className="bg-[#07101c] p-3">
                <p className="text-[9px] text-slate-500 font-mono uppercase">{label}</p>
                <p className="text-sm text-slate-100 font-mono mt-1">{value}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Energy Projection">
          <div className="grid grid-cols-2 gap-px bg-slate-800">
            {energyFields.map(([label, value]) => (
              <div key={label} className="bg-[#07101c] p-3">
                <p className="text-[9px] text-slate-500 font-mono uppercase">{label}</p>
                <p className="text-sm text-slate-100 font-mono mt-1">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-3">
            ENERGY BALANCE: <span className="text-slate-200">{simulation.energyBalance ?? "--"} kW</span>
          </p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Affected Systems">
          <div className="flex flex-wrap gap-2">
            {affected.length ? affected.map(system => (
              <span key={system} className="px-2.5 py-1.5 border border-amber-500/30 bg-amber-500/5 text-amber-300 text-[10px] font-mono">
                {system}
              </span>
            )) : <span className="text-xs text-slate-600 font-mono">NO THRESHOLD IMPACTS</span>}
          </div>
        </Panel>

        <Panel title="Projected Effects">
          <div className="space-y-2">
            {effects.length ? effects.map((effect, index) => (
              <p key={index} className="text-xs text-slate-400 leading-5 font-mono">• {effect}</p>
            )) : <p className="text-xs text-slate-600 font-mono">No effects returned.</p>}
          </div>
        </Panel>

        <Panel title="Reserve Projection">
          <div className="space-y-3 font-mono text-xs">
            {[['Battery', energy.battery], ['Fuel', energy.fuel]].map(([label, value]) => (
              <div key={label}>
                <div className="flex justify-between text-slate-500 mb-1"><span>{label}</span><span className="text-slate-200">{value ?? "--"}%</span></div>
                <div className="h-1.5 bg-slate-800"><div className="h-full bg-cyan-400/70" style={{ width: `${Math.max(0, Math.min(100, Number(value ?? 0)))}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {inventory.items?.length > 0 && (
        <Panel title="Inventory Projection">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {inventory.items.map(item => (
              <div key={item.name} className="border border-slate-800 bg-[#07101c] p-3 font-mono">
                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-300">{item.name}</span>
                  <span className={`text-[9px] ${item.status === "CRITICAL" ? "text-red-400" : item.status === "LOW" ? "text-amber-400" : "text-emerald-400"}`}>{item.status}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{item.current}% • {item.daysRemaining} days remaining</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Recommended Actions">
        <div className="space-y-2">
          {recommendations.length ? recommendations.map((recommendation, index) => (
            <div key={index} className="flex gap-3 text-xs font-mono text-slate-300">
              <span className="text-cyan-400 shrink-0">{String(index + 1).padStart(2, "0")}</span>
              <span>{recommendation}</span>
            </div>
          )) : <p className="text-xs text-slate-600 font-mono">No recommendations returned.</p>}
        </div>
      </Panel>
    </div>
  );
}

function RecentRuns({ runs, stations }) {
  return (
    <div className="border border-cyan-500/25 bg-[#050b15] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-mono tracking-[0.2em] text-cyan-300 uppercase">Recent Runs</p>
          <p className="text-xs text-slate-500 mt-1">Executions from this frontend session only.</p>
        </div>
        <span className="text-[9px] text-slate-600 font-mono">{runs.length}/8</span>
      </div>
      {runs.length === 0 ? (
        <div className="border border-dashed border-slate-800 py-7 text-center text-[10px] text-slate-600 font-mono">NO SIMULATIONS EXECUTED THIS SESSION</div>
      ) : (
        <div className="space-y-1">
          {runs.map((run, index) => {
            const station = stations.find(s => s.id === run.station);
            const time = new Date(run.generatedAt);
            return (
              <div key={`${run.generatedAt}-${index}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center border-b border-slate-900 py-2 text-[10px] font-mono">
                <span className="text-slate-300">{scenarioLabel(run.scenario)}</span>
                <span className="text-slate-600">{station?.name || run.station}</span>
                <span className={run.riskLevel === "CRITICAL" ? "text-red-400" : run.riskLevel === "WARNING" ? "text-amber-400" : "text-emerald-400"}>{run.riskScore}/100</span>
                <span className="text-slate-600">{Number.isNaN(time.getTime()) ? "--" : time.toLocaleTimeString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===============================
// SATELLITE
// ===============================

function SatellitePage({
  selectedStation
}) {
  return (
    <div>

      <SectionTitle
        title="Satellite Link"
        subtitle={`Remote communications status • ${selectedStation.name}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <InfoBox
          icon={<Satellite />}
          label="Link Status"
          value="CONNECTED"
        />

        <InfoBox
          icon={<RadioTower />}
          label="Channel"
          value="SATCOM-01"
        />

        <InfoBox
          icon={<Server />}
          label="Telemetry Uplink"
          value="ACTIVE"
        />
      </div>

      <div className="border border-cyan-500/20 bg-slate-900/80 rounded-2xl shadow-xl shadow-cyan-950/30 hud-panel card-3d p-5 mt-4">

        <p className="text-sm font-medium">
          Communication path
        </p>

        <div className="flex items-center gap-3 mt-5 text-xs text-slate-500">

          <span className="px-3 py-2 border border-slate-700 rounded-lg">
            Station
          </span>

          <span>→</span>

          <span className="px-3 py-2 border border-cyan-600/20 text-cyan-400 rounded-lg">
            Satellite
          </span>

          <span>→</span>

          <span className="px-3 py-2 border border-slate-700 rounded-lg">
            India Control
          </span>
        </div>

        <p className="text-xs text-slate-500 mt-5">
          Prototype communication state is simulated.
        </p>
      </div>
    </div>
  );
}


// ===============================
// DATA MONITOR
// ===============================

function DataMonitor({
  telemetry,
  eventLog,
  actions,
  liveHistory
}) {
  return (
    <div>

      <SectionTitle
        title="Data Monitor"
        subtitle="Telemetry stream, event processing and operator actions"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <Panel title="Live telemetry">

          <div className="space-y-2 max-h-96 overflow-auto">

            {telemetry.length ? (
              telemetry.map(
                item => (
                  <LogRow
                    key={item.id}
                    time={item.time}
                    tag={item.type}
                    message={
                      item.message
                    }
                  />
                )
              )
            ) : (
              <p className="text-xs text-slate-500">
                Waiting for telemetry...
              </p>
            )}
          </div>
        </Panel>

        <Panel title="System event log">

          <div className="space-y-2 max-h-96 overflow-auto">

            {eventLog.length ? (
              eventLog.map(
                item => (
                  <LogRow
                    key={item.id}
                    time={item.time}
                    tag={item.type}
                    message={
                      item.message
                    }
                  />
                )
              )
            ) : (
              <p className="text-xs text-slate-500">
                No events yet.
              </p>
            )}
          </div>
        </Panel>

        <Panel title="Operator actions">

          <div className="space-y-2 max-h-72 overflow-auto">

            {actions.length ? (
              actions.map(
                action => (
                  <LogRow
                    key={action.id}
                    time={action.time}
                    tag="ACTION"
                    message={actionLabel(
                      action.action
                    )}
                  />
                )
              )
            ) : (
              <p className="text-xs text-slate-500">
                No operator actions yet.
              </p>
            )}
          </div>
        </Panel>

        <ChartCard
          title="Received Samples"
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={liveHistory}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={10}
              />

              <YAxis
                stroke="#64748b"
                fontSize={10}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor:
                    "#0f172a",
                  border:
                    "1px solid #334155"
                }}
              />

              <Line
                type="monotone"
                dataKey="battery"
                stroke="#22d3ee"
                dot={false}
                name="Battery %"
              />

              <Line
                type="monotone"
                dataKey="fuel"
                stroke="#f59e0b"
                dot={false}
                name="Fuel %"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}


// ===============================
// SMALL COMPONENTS
// ===============================

function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">

      <ActionHint
        icon={<Power size={17} />}
        title="Energy control"
        text="Reduce non-essential loads when reserve falls."
      />

      <ActionHint
        icon={<Wrench size={17} />}
        title="Infrastructure"
        text="Track health and dependency state of station assets."
      />

      <ActionHint
        icon={<Route size={17} />}
        title="Logistics"
        text="Prioritize resupply before critical stock depletion."
      />
    </div>
  );
}


function StationBanner({
  station
}) {
  return (
    <section className="border border-cyan-500/20 bg-slate-900/80 rounded-2xl shadow-xl shadow-cyan-950/30 hud-panel card-3d p-5 mb-6">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

        <div>

          <div className="flex items-center gap-3">

            <MapPin
              className="text-cyan-400"
              size={20}
            />

            <h3 className="text-xl font-semibold">
              {station.name}
            </h3>

            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ACTIVE
            </span>
          </div>

          <p className="text-sm text-slate-500 mt-2">
            {station.region}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">

          <Mini
            label="Coordinates"
            value={`${station.location.latitude.toFixed(
              4
            )}°, ${station.location.longitude.toFixed(
              4
            )}°`}
          />

          <Mini
            label="Elevation"
            value={`${station.elevation} m`}
          />

          <Mini
            label="Capacity"
            value={`${station.mainBuildingCapacity} people`}
          />
        </div>
      </div>
    </section>
  );
}


function ChartCard({
  title,
  subtitle,
  children,
  wide = false
}) {
  return (
    <div
      className={`${
        wide
          ? "xl:col-span-2"
          : ""
      } border border-cyan-500/20 bg-slate-900/80 rounded-2xl shadow-xl shadow-cyan-950/30 hud-panel card-3d p-5 min-h-[330px]`}
    >

      <h3 className="font-medium">
        {title}
      </h3>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">
          {subtitle}
        </p>
      )}

      <div className="h-64 mt-4">
        {children}
      </div>
    </div>
  );
}


function Panel({
  title,
  children
}) {
  return (
    <div className="border border-cyan-500/20 rounded-xl p-4">
      <h4 className="text-sm font-medium mb-4">
        {title}
      </h4>

      {children}
    </div>
  );
}


function SectionTitle({
  title,
  subtitle
}) {
  return (
    <div className="mb-5">

      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="text-xs text-slate-500 mt-1">
        {subtitle}
      </p>
    </div>
  );
}


function StatusCard({
  icon,
  title,
  value,
  subtitle,
  status
}) {
  return (
    <div className="border border-cyan-500/20 bg-slate-900/80 rounded-xl shadow-lg shadow-cyan-950/20 card-3d p-4 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,45,65,0.08)] transition-all duration-200">

      <div className="flex justify-between">

        <span className="text-cyan-400">
          {icon}
        </span>

        <span className="text-[10px] text-emerald-400">
          {status}
        </span>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        {title}
      </p>

      <p className="text-xl font-semibold mt-1">
        {value}
      </p>

      <p className="text-xs text-slate-500 mt-1">
        {subtitle}
      </p>
    </div>
  );
}


function MetricCard({
  icon,
  title,
  value,
  secondary
}) {
  return (
    <div className="border border-cyan-500/20 bg-slate-900/80 rounded-xl shadow-lg shadow-cyan-950/20 card-3d p-4 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,45,65,0.08)] transition-all duration-200">

      <div className="flex items-center gap-2 text-cyan-400">

        {icon}

        <span className="text-xs text-slate-500">
          {title}
        </span>
      </div>

      <p className="text-xl font-semibold mt-3">
        {value}
      </p>

      {secondary && (
        <p className="text-xs text-slate-500 mt-1">
          {secondary}
        </p>
      )}
    </div>
  );
}


function InventoryRow({
  item
}) {
  const low =
    item.status === "LOW";

  const critical =
    item.status === "CRITICAL";

  return (
    <div className="border border-cyan-500/20 rounded-xl p-4">

      <div className="flex flex-col lg:flex-row lg:items-center gap-4">

        <div className="flex items-center gap-3 lg:w-48">

          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Package size={18} />
          </div>

          <div>

            <p className="text-sm font-medium">
              {item.name}
            </p>

            <p className="text-[10px] text-slate-500">
              {item.category}
            </p>
          </div>
        </div>

        <div className="flex-1">

          <div className="flex justify-between text-xs mb-2">

            <span className="text-slate-500">
              Stock level
            </span>

            <span>
              {item.current}
              {item.unit}
            </span>
          </div>

          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">

            <div
              className={`h-full rounded-full ${
                critical
                  ? "bg-red-400"
                  : low
                  ? "bg-amber-400"
                  : "bg-cyan-400"
              }`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    item.current
                  )
                )}%`
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 lg:w-64">

          <Mini
            label="Daily use"
            value={`${item.dailyConsumption}% / day`}
          />

          <Mini
            label="Remaining"
            value={`${item.daysRemaining} days`}
          />

          <Mini
            label="Priority"
            value={item.priority}
          />
        </div>

        <span
          className={`text-[10px] px-2 py-1 rounded-md ${
            critical
              ? "bg-red-500/10 text-red-400"
              : low
              ? "bg-amber-500/10 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {item.status}
        </span>
      </div>
    </div>
  );
}


function AlertCard({
  alert
}) {
  const critical =
    alert.severity ===
    "CRITICAL";

  const warning =
    alert.severity ===
    "WARNING";

  return (
    <div
      className={`border rounded-xl p-4 ${
        critical
          ? "border-red-500/30 bg-red-500/5"
          : warning
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-emerald-500/20 bg-emerald-500/5"
      }`}
    >

      <div className="flex gap-4">

        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            critical
              ? "bg-red-500/10 text-red-400"
              : warning
              ? "bg-amber-500/10 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {alert.severity ===
          "NORMAL" ? (
            <CircleCheck size={19} />
          ) : (
            <AlertTriangle
              size={19}
            />
          )}
        </div>

        <div className="flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <h4 className="font-medium">
              {alert.title}
            </h4>

            <span
              className={`text-[9px] px-2 py-0.5 rounded ${
                critical
                  ? "bg-red-500/10 text-red-400"
                  : warning
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {alert.severity}
            </span>

            <span className="text-[9px] text-slate-500">
              {alert.system}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            <span className="text-slate-500">
              Reason:
            </span>{" "}
            {alert.reason}
          </p>

          <p className="text-xs text-slate-500 mt-2">
            <span className="text-slate-500">
              Recommended action:
            </span>{" "}
            {alert.action}
          </p>
        </div>
      </div>
    </div>
  );
}


function ActionButton({
  onClick,
  disabled,
  icon,
  text
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 border border-cyan-600/20 bg-cyan-500/10 hover:bg-cyan-500/10 text-cyan-400 rounded-xl px-4 py-3 text-xs transition disabled:opacity-40"
    >
      {icon}
      {text}
    </button>
  );
}


function ActionHint({
  icon,
  title,
  text
}) {
  return (
    <div className="border border-cyan-500/20 rounded-xl p-4 flex gap-3">

      <span className="text-cyan-400">
        {icon}
      </span>

      <div>

        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="text-xs text-slate-500 mt-1">
          {text}
        </p>
      </div>
    </div>
  );
}


function LiveRow({
  label,
  value
}) {
  return (
    <div className="flex justify-between border-b border-cyan-500/20 pb-3">

      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-sm font-medium">
        {value}
      </span>
    </div>
  );
}


function Mini({
  label,
  value
}) {
  return (
    <div>

      <p className="text-[10px] text-slate-500">
        {label}
      </p>

      <p className="text-xs text-slate-200 mt-1">
        {value}
      </p>
    </div>
  );
}


function InfoBox({
  icon,
  label,
  value
}) {
  return (
    <div className="border border-cyan-500/20 rounded-xl p-4">

      <div className="text-cyan-400 mb-3">
        {icon}
      </div>

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="text-sm font-medium mt-1">
        {value}
      </p>
    </div>
  );
}


function LogRow({
  time,
  tag,
  message
}) {
  const date =
    time instanceof Date
      ? time
      : new Date(time);

  return (
    <div className="flex gap-3 items-start border-b border-cyan-500/20 pb-2">

      <span className="text-[10px] text-slate-500 whitespace-nowrap">
        {date.toLocaleTimeString()}
      </span>

      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
        {tag}
      </span>

      <span className="text-xs text-slate-500">
        {message}
      </span>
    </div>
  );
}


function actionLabel(action) {
  return (
    {
      load:
        "Reduced non-essential load",
      heating:
        "Increased heating reserve",
      resupply:
        "Scheduled priority resupply",
      ack:
        "Acknowledged alert"
    }[action] || action
  );
}


function pageTitle(page) {
  if (page === "Overview") return "NIVORA Operations Center";
  if (page === "Polar Link") return "Polar Link — Tactical Comms Bridge";
  return page;
}


function scenarioLabel(scenario) {
  return (
    {
      extreme_weather:
        "Extreme Weather",
      energy_spike:
        "Energy Demand Spike",
      logistics_delay:
        "Logistics Delay",
      combined_stress:
        "Combined Stress"
    }[scenario] || scenario
  );
}


export default App;