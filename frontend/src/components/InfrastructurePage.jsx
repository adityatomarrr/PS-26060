import React, { useState } from "react";
import {
  Wrench,
  Thermometer,
  Droplets,
  Zap,
  RadioTower,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Power,
  Flame,
  Activity
} from "lucide-react";

export default function InfrastructurePage({
  infrastructure,
  environment,
  energy,
  selectedStation
}) {
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState(null);
  const [radomeHeater, setRadomeHeater] = useState(true);
  const [backupLoop, setBackupLoop] = useState(false);
  const [busbarMode, setBusbarMode] = useState("auto");

  const stationName = selectedStation?.name || "Maitri";
  const isMaitri = stationName.toLowerCase().includes("maitri");

  const runDiagnostics = () => {
    setDiagnosticsRunning(true);
    setDiagnosticsResult(null);
    setTimeout(() => {
      setDiagnosticsRunning(false);
      setDiagnosticsResult({
        timestamp: new Date().toLocaleTimeString(),
        status: "OPTIMAL",
        score: "98.4%",
        notes: "All life-support and distribution loops operating within polar safety margins."
      });
    }, 1200);
  };

  const systems = [
    {
      id: "hvac",
      name: "Life Support & HVAC Climate",
      status: "Operational",
      health: 98,
      icon: <Thermometer className="text-cyan-400" size={18} />,
      metrics: [
        { label: "Living Quarters Temp", value: "21.8 °C", status: "Nominal" },
        { label: "Internal Pressure", value: "+16 Pa (Positive)", status: "Sealed" },
        { label: "CO2 Scrubber", value: "460 ppm", status: "Optimal" },
        { label: "HEPA Filtration", value: "99.2% Airflow", status: "Nominal" }
      ]
    },
    {
      id: "water",
      name: isMaitri ? "Lake Priyadarshini Water Intake & Treatment" : "Polar Snow Melting & Water Reservoir",
      status: "Active Treatment",
      health: 95,
      icon: <Droplets className="text-blue-400" size={18} />,
      metrics: [
        { label: isMaitri ? "Lake Intake Line" : "Snow Calciner Melt", value: isMaitri ? "Pumping (65 L/min)" : "Active (850 L/day)", status: "Active" },
        { label: "Potable Storage", value: "18,400 / 22,000 L", status: "83.6%" },
        { label: "Greywater Recycling", value: "88.4% Efficiency", status: "Nominal" },
        { label: "Bio-Waste Digester", value: "37.4 °C", status: "Nominal" }
      ]
    },
    {
      id: "electrical",
      name: "3-Phase Power Distribution & Microgrid",
      status: "Synchronized",
      health: 97,
      icon: <Zap className="text-amber-400" size={18} />,
      metrics: [
        { label: "Busbar Line Voltage", value: "415 V / 50.0 Hz", status: "Synchronized" },
        { label: "Active Substation Feed", value: busbarMode === "auto" ? "Bus-A Primary" : "Bus-B Redundant", status: "Normal" },
        { label: "Station Total Load", value: energy?.consumption ? `${energy.consumption} kW` : "42.8 kW", status: "Monitored" },
        { label: "Emergency UPS Bank", value: "100% (4.8h runtime)", status: "Standby" }
      ]
    },
    {
      id: "telecom",
      name: "Satellite Radome & Polar Uplinks",
      status: "Linked to NCPOR",
      health: 99,
      icon: <RadioTower className="text-emerald-400" size={18} />,
      metrics: [
        { label: "Ku/C-Band Satellite", value: "99.7% SNR (Locked)", status: "Primary" },
        { label: "Radome De-Icing", value: radomeHeater ? "Heating ACTIVE" : "STANDBY", status: radomeHeater ? "Heating" : "Off" },
        { label: "HF/VHF Emergency", value: "14.300 MHz (Active)", status: "Standby" },
        { label: "Fiber Optical Ring", value: "0.4 ms Latency", status: "Zero Loss" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="border border-cyan-500/20 bg-slate-900/80 rounded-2xl p-5 card-3d hud-panel">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="text-cyan-400" size={22} />
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Station Infrastructure & Subsystems
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Structural integrity, life support loops, HVAC, and microgrid telemetry • {stationName} Station
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runDiagnostics}
              disabled={diagnosticsRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 transition shadow-lg shadow-cyan-950/40 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={diagnosticsRunning ? "animate-spin" : ""} />
              {diagnosticsRunning ? "Scanning Systems..." : "Run Integrity Diagnostic"}
            </button>
          </div>
        </div>

        {diagnosticsResult && (
          <div className="mt-4 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Diagnostic Pass at {diagnosticsResult.timestamp}: {diagnosticsResult.notes} (Overall Health: {diagnosticsResult.score})</span>
            </div>
            <span className="font-mono text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">{diagnosticsResult.status}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-cyan-500/20 bg-slate-900/80 rounded-xl p-4 card-3d">
          <div className="flex items-center justify-between text-cyan-400">
            <ShieldCheck size={18} />
            <span className="text-[10px] text-emerald-400 font-mono">NOMINAL</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">Station Habitat Health</p>
          <p className="text-2xl font-bold text-white mt-1">98.2%</p>
          <p className="text-[10px] text-slate-500 mt-1">Structural & insulation safe</p>
        </div>

        <div className="border border-cyan-500/20 bg-slate-900/80 rounded-xl p-4 card-3d">
          <div className="flex items-center justify-between text-blue-400">
            <Droplets size={18} />
            <span className="text-[10px] text-emerald-400 font-mono">RESERVE OK</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">Potable Water Reserves</p>
          <p className="text-2xl font-bold text-white mt-1">18.4 kL</p>
          <p className="text-[10px] text-slate-500 mt-1">14.7 days autonomous supply</p>
        </div>

        <div className="border border-cyan-500/20 bg-slate-900/80 rounded-xl p-4 card-3d">
          <div className="flex items-center justify-between text-amber-400">
            <Zap size={18} />
            <span className="text-[10px] text-cyan-300 font-mono">MICROGRID</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">Grid Load Balance</p>
          <p className="text-2xl font-bold text-white mt-1">
            {energy?.consumption ? `${energy.consumption} kW` : "43.2 kW"}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">3-Phase 415V Balanced</p>
        </div>

        <div className="border border-cyan-500/20 bg-slate-900/80 rounded-xl p-4 card-3d">
          <div className="flex items-center justify-between text-emerald-400">
            <RadioTower size={18} />
            <span className="text-[10px] text-emerald-400 font-mono">LOCKED</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">Satellite Telemetry Uplink</p>
          <p className="text-2xl font-bold text-white mt-1">99.8%</p>
          <p className="text-[10px] text-slate-500 mt-1">Ground Station Link Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {systems.map(sys => (
          <div
            key={sys.id}
            className="border border-cyan-500/20 bg-slate-900/80 rounded-2xl p-5 card-3d hud-panel space-y-4"
          >
            <div className="flex items-center justify-between border-b border-cyan-500/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  {sys.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">{sys.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{sys.status}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 font-mono">{sys.health}%</span>
                <span className="block text-[9px] text-slate-500 uppercase">Integrity</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {sys.metrics.map((m, idx) => (
                <div key={idx} className="border border-slate-800 bg-slate-950/40 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400">{m.label}</p>
                  <p className="text-sm font-semibold text-slate-100 mt-1">{m.value}</p>
                  <span className="text-[9px] text-emerald-400 font-mono">{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 border border-cyan-500/20 bg-slate-900/80 rounded-2xl p-5 card-3d hud-panel">
          <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
            <Cpu className="text-cyan-400" size={17} />
            Subsystem Actuator & Operator Controls
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setRadomeHeater(!radomeHeater)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                radomeHeater
                  ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <Flame size={18} className={radomeHeater ? "text-cyan-300" : "text-slate-500"} />
                <span className="text-[9px] font-mono uppercase">{radomeHeater ? "ACTIVE" : "OFF"}</span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold">Radome De-icer</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Melt ice on Ku-band dome</p>
              </div>
            </button>

            <button
              onClick={() => setBackupLoop(!backupLoop)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                backupLoop
                  ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <Thermometer size={18} className={backupLoop ? "text-amber-300" : "text-slate-500"} />
                <span className="text-[9px] font-mono uppercase">{backupLoop ? "ACTIVE" : "STANDBY"}</span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold">Aux Heating Glycol</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Circulate backup loop</p>
              </div>
            </button>

            <button
              onClick={() => setBusbarMode(busbarMode === "auto" ? "manual" : "auto")}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                busbarMode === "auto"
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                  : "border-blue-400/40 bg-blue-500/15 text-blue-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <Power size={18} className={busbarMode === "auto" ? "text-emerald-300" : "text-blue-300"} />
                <span className="text-[9px] font-mono uppercase">{busbarMode}</span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold">Busbar Switchgear</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Auto-failover microgrid</p>
              </div>
            </button>
          </div>
        </div>

        <div className="border border-cyan-500/20 bg-slate-900/80 rounded-2xl p-5 card-3d hud-panel">
          <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
            <Activity className="text-cyan-400" size={17} />
            Preventive Maintenance
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between border-b border-slate-800 pb-2">
              <div>
                <p className="font-medium text-slate-200">Snow-Melt Heat Exchanger</p>
                <p className="text-[10px] text-slate-500">Scheduled descaling & flush</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Due 14d</span>
            </div>

            <div className="flex items-start justify-between border-b border-slate-800 pb-2">
              <div>
                <p className="font-medium text-slate-200">UPS Battery Bank Impedance</p>
                <p className="text-[10px] text-slate-500">Cell balancing verification</p>
              </div>
              <span className="text-[10px] font-mono text-cyan-300">Due 28d</span>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-200">Structural Stilt Torque Check</p>
                <p className="text-[10px] text-slate-500">Permafrost anchor inspection</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Due 45d</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
