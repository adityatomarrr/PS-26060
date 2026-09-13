import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Boxes,
  Building2,
  ChevronDown,
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
  CheckCircle2
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline
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

const API = "http://localhost:5000/api";

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
  ["Data Monitor", Gauge]
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

  const [lastSync, setLastSync] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [eventLog, setEventLog] = useState([]);
  const [actions, setActions] = useState([]);

  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const [liveHistory, setLiveHistory] = useState([]);
  const [infrastructure, setInfrastructure] = useState([]);

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

  // Load stations
  useEffect(() => {
    fetch(`${API}/stations`)
      .then(response => {
        if (!response.ok) {
          throw new Error("Station API failed");
        }

        return response.json();
      })
      .then(data => {
        setStations(data);

        if (data.length > 0) {
          setSelectedStation(data[0]);
        }
      })
      .catch(error => {
        console.error(error);
        addEvent("Station API unavailable", "CRITICAL");
      });
  }, []);

  // Load station baseline data
  useEffect(() => {
    if (!selectedStation) return;

    const id = selectedStation.id;

    setSimulation(null);
    setTelemetry([]);
    setLiveHistory([]);
    setActions([]);
    setEventLog([]);

    setEnvironment(null);
    setEnergy(null);
    setAlerts([]);
    setInventory(null);
    setLogistics(null);
    setInfrastructure([]);

    Promise.all([
      fetch(`${API}/stations/${id}/environment`).then(r => r.json()),
      fetch(`${API}/stations/${id}/energy`).then(r => r.json()),
      fetch(`${API}/stations/${id}/alerts`).then(r => r.json()),
      fetch(`${API}/stations/${id}/inventory`).then(r => r.json()),
      fetch(`${API}/stations/${id}/logistics`).then(r => r.json()),
      fetch(`${API}/stations/${id}/assets`).then(r => r.json())
    ])
      .then(([env, eng, al, inv, log, assets]) => {
        setEnvironment(env);
        setEnergy(eng);
        setAlerts(al.alerts || []);
        setInventory(inv);
        setLogistics(log);
        setInfrastructure(assets.assets || []);

        addEvent(
          `${selectedStation.name} baseline loaded`,
          "OK"
        );
      })
      .catch(error => {
        console.error(error);

        addEvent(
          "Station data request failed",
          "CRITICAL"
        );
      });
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
    <div className="min-h-screen bg-[#eef5f8] text-slate-800 flex">

      {/* SIDEBAR */}

      <aside className="w-64 border-r border-[#173246] bg-[#071521] p-5 hidden md:block sticky top-0 h-screen text-white">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-600/20 flex items-center justify-center">
            <CloudSnow
              className="text-cyan-300"
              size={22}
            />
          </div>

          <div>
            <h1 className="font-bold text-sm">
              ANTARCTIC
            </h1>

            <p className="text-xs text-slate-500">
              DIGITAL TWIN
            </p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {NAV.map(([name, Icon]) => (
            <button
              key={name}
              onClick={() =>
                setActivePage(name)
              }
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition ${
                activePage === name
                  ? "bg-cyan-300/10 text-cyan-200 border border-cyan-300/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={17} />

              {name}

              {name === "Alerts" &&
                criticalCount +
                  warningCount >
                  0 && (
                  <span className="ml-auto text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">
                    {criticalCount +
                      warningCount}
                  </span>
                )}

              {name === "Logistics" &&
                lowStockCount > 0 && (
                  <span className="ml-auto text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                    {lowStockCount}
                  </span>
                )}
            </button>
          ))}
        </nav>

        <div className="mt-8 border border-[#173246] bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />

            System Online
          </div>

          <p className="text-[10px] text-slate-500 mt-2">
            API + simulation + live telemetry
          </p>
        </div>

        <div className="mt-4 border border-[#173246] bg-white/5 rounded-xl p-4">
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

      <main className="flex-1 p-5 md:p-8 overflow-auto bg-[#eef5f8]">

        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-8">

          <div>
            <p className="text-xs text-cyan-700 tracking-[0.18em] uppercase font-semibold">
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

            <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-xl shadow-[0_6px_22px_rgba(15,45,65,0.05)] px-4 py-2.5">

              <Radio
                size={17}
                className="text-cyan-700"
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
                className="bg-transparent text-sm text-slate-800 outline-none cursor-pointer"
              >
                {stations.map(station => (
                  <option
                    key={station.id}
                    value={station.id}
                    className="bg-white text-slate-800"
                  >
                    {station.name} Station
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                className="text-slate-500"
              />
            </div>
          </div>
        </header>

        {simulation && (
          <div className="border border-cyan-600/20 bg-cyan-50 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            <div className="flex items-center gap-3">

              <GitBranch
                size={20}
                className="text-cyan-700"
              />

              <div>
                <p className="text-xs text-cyan-700 uppercase tracking-wider">
                  Simulation active
                </p>

                <p className="text-sm text-slate-700 mt-1">
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
                ? "border-red-500/30 bg-white text-red-300"
                : "border-emerald-500/30 bg-[#071521] text-emerald-300"
            }`}
          >
            {toast.message}
          </div>
        )}

        {activePage === "Overview" && (
          <Overview
            selectedStation={selectedStation}
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
            infrastructure={
              infrastructure
            }
            environment={
              displayedEnvironment
            }
            energy={displayedEnergy}
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
    </div>
  );
}


// ===============================
// OVERVIEW
// ===============================

function Overview({
  selectedStation,
  environment,
  energy,
  inventory,
  alerts,
  stations,
  risk,
  liveHistory,
  simulation
}) {
  const critical =
    alerts.filter(
      alert =>
        alert.severity === "CRITICAL"
    ).length;

  const warning =
    alerts.filter(
      alert =>
        alert.severity === "WARNING"
    ).length;

  return (
    <div>

      <StationBanner
        station={selectedStation}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <StatusCard
          icon={
            <Thermometer size={19} />
          }
          title="Environment"
          value={
            environment
              ? `${environment.temperature}°C`
              : "--"
          }
          subtitle="Temperature"
          status={
            simulation
              ? "Predicted"
              : "Live"
          }
        />

        <StatusCard
          icon={<Zap size={19} />}
          title="Energy"
          value={
            energy
              ? `${energy.consumption} kW`
              : "--"
          }
          subtitle="Current consumption"
          status={
            energy?.status ||
            "Loading"
          }
        />

        <StatusCard
          icon={<Truck size={19} />}
          title="Logistics"
          value={`${inventory?.items?.filter(
            item =>
              item.status === "LOW"
          ).length || 0} Low`}
          subtitle={`${inventory?.items?.filter(
            item =>
              item.priority === "HIGH"
          ).length || 0} high priority`}
          status={
            simulation
              ? "Predicted"
              : "Operational"
          }
        />

        <StatusCard
          icon={
            <ShieldAlert size={19} />
          }
          title="Risk Status"
          value={
            risk >= 70
              ? "Critical"
              : risk >= 30
              ? "Warning"
              : "Normal"
          }
          subtitle={`${critical} critical • ${warning} warnings`}
          status={
            simulation
              ? "Simulation"
              : "Live engine"
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">

        <div className="xl:col-span-2 border border-slate-200 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(15,45,65,0.06)]">

          <div className="p-5 border-b border-slate-200 flex items-center justify-between">

            <div>
              <h3 className="font-semibold">
                Station Network
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Operational locations and selected station
              </p>
            </div>

            <MapPin
              size={18}
              className="text-cyan-700"
            />
          </div>

          <div className="h-80">

            <MapContainer
              center={[-70, 45]}
              zoom={3}
              scrollWheelZoom={false}
              style={{
                height: "100%",
                width: "100%"
              }}
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {stations.map(station => (
                <CircleMarker
                  key={station.id}
                  center={[
                    station.location.latitude,
                    station.location.longitude
                  ]}
                  radius={
                    station.id ===
                    selectedStation.id
                      ? 11
                      : 8
                  }
                  pathOptions={{
                    color:
                      station.id ===
                      selectedStation.id
                        ? "#0891b2"
                        : "#64748b",
                    fillOpacity: 0.85
                  }}
                  eventHandlers={{
                    click: () =>
                      setSelectedStation(station)
                  }}
                >
                  <Popup>
                    {station.name} Station
                  </Popup>
                </CircleMarker>
              ))}

              {stations.length > 1 && (
                <Polyline
                  positions={stations.map(
                    station => [
                      station.location
                        .latitude,
                      station.location
                        .longitude
                    ]
                  )}
                  pathOptions={{
                    color: "#0891b2",
                    dashArray: "6 8",
                    opacity: 0.45
                  }}
                />
              )}
            </MapContainer>
          </div>
        </div>

        <div className="border border-slate-200 bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,45,65,0.06)] p-5">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h3 className="font-semibold">
                Live State
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Changing station telemetry
              </p>
            </div>

            <Activity
              size={18}
              className="text-cyan-700"
            />
          </div>

          <div className="space-y-4">

            <LiveRow
              label="Temperature"
              value={
                environment
                  ? `${environment.temperature}°C`
                  : "--"
              }
            />

            <LiveRow
              label="Wind"
              value={
                environment
                  ? `${environment.windSpeed} km/h`
                  : "--"
              }
            />

            <LiveRow
              label="Generation"
              value={
                energy
                  ? `${energy.generation} kW`
                  : "--"
              }
            />

            <LiveRow
              label="Consumption"
              value={
                energy
                  ? `${energy.consumption} kW`
                  : "--"
              }
            />

            <LiveRow
              label="Battery"
              value={
                energy
                  ? `${energy.battery}%`
                  : "--"
              }
            />

            <LiveRow
              label="Fuel"
              value={
                energy
                  ? `${energy.fuel}%`
                  : "--"
              }
            />
          </div>
        </div>
      </div>

      <div className="border border-slate-200 bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,45,65,0.06)] p-5 mb-6">

        <div className="flex items-center justify-between mb-5">

          <div>
            <h3 className="font-semibold">
              Live Telemetry Trend
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Last 20 received samples
            </p>
          </div>

          <span className="text-[10px] text-emerald-400">
            ● STREAM ACTIVE
          </span>
        </div>

        <div className="h-64">

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
                    "1px solid #334155",
                  borderRadius:
                    "10px"
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
        </div>
      </div>

      <QuickActions />
    </div>
  );
}


// ===============================
// INFRASTRUCTURE
// ===============================

function InfrastructurePage({
  infrastructure,
  environment,
  energy
}) {
  const stressed =
    environment?.temperature <= -25 ||
    environment?.windSpeed >= 35 ||
    energy?.battery <= 20;

  const items = (
    infrastructure || []
  ).map(item => {

    let status =
      item.status || "NORMAL";

    let health =
      Number(item.health ?? 100);

    if (
      stressed &&
      (
        item.name ===
          "Heating System" ||
        item.name ===
          "External Operations"
      )
    ) {
      status = "STRESSED";

      health =
        Math.max(
          65,
          health - 10
        );
    }

    if (
      energy?.battery <= 20 &&
      item.name ===
        "Main Power System"
    ) {
      status = "CRITICAL";

      health =
        Math.max(
          55,
          health - 20
        );
    }

    return {
      ...item,
      status,
      health
    };
  });

  return (
    <div>

      <SectionTitle
        title="Infrastructure Digital Twin"
        subtitle="Operational assets, health state and dependency impact"
      />

      <div className="border border-cyan-500/20 bg-cyan-50 rounded-2xl p-5 mb-5">

        <div className="flex items-center gap-3">

          <GitBranch
            className="text-cyan-700"
          />

          <div>
            <p className="font-medium">
              Dependency chain
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Environment → heating → power demand → reserves → operational risk
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="border border-slate-200 bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,45,65,0.06)] p-8 text-center">

          <Wrench
            size={28}
            className="text-slate-600 mx-auto mb-3"
          />

          <p className="text-sm text-slate-500">
            Loading infrastructure assets...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {items.map(item => (
            <div
              key={
                item.id ||
                item.name
              }
              className="border border-slate-200 bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,45,65,0.06)] p-4"
            >

              <div className="flex items-start justify-between gap-3">

                <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                  <Wrench size={18} />
                </div>

                <span
                  className={`text-[10px] px-2 py-1 rounded ${
                    item.status ===
                    "CRITICAL"
                      ? "bg-red-500/10 text-red-400"
                      : item.status ===
                        "STRESSED"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <p className="text-sm font-medium mt-4">
                {item.name}
              </p>

              <p className="text-[10px] text-slate-500 mt-1">
                {item.category ||
                  item.type ||
                  "Infrastructure"}
              </p>

              <div className="mt-4">

                <div className="flex justify-between text-xs mb-2">

                  <span className="text-slate-500">
                    Health
                  </span>

                <span>
  {item.health}%
</span>
                </div>

                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className={`h-full rounded-full ${
                      item.status ===
                      "CRITICAL"
                        ? "bg-red-400"
                        : item.status ===
                          "STRESSED"
                        ? "bg-amber-400"
                        : "bg-cyan-400"
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          item.health
                        )
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ===============================
// STATIONS
// ===============================

function StationsPage({
  stations,
  selectedStation,
  setSelectedStation
}) {
  return (
    <div>

      <SectionTitle
        title="Station Operations"
        subtitle="Switch the active digital twin between Indian Antarctic stations."
      />

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
                ? "border-cyan-500/40 bg-cyan-50"
                : "border-slate-200 bg-white hover:border-slate-600"
            }`}
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <Building2
                  className="text-cyan-700"
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

        <div className="border border-slate-200 bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,45,65,0.06)] p-5">

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

          <div className="border-t border-slate-200 mt-5 pt-5">

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
          <div className="border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
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
  simulation
}) {
  return (
    <div>

      <SectionTitle
        title="Operational Scenario Simulator"
        subtitle="Stress the digital twin and observe cause → effect changes"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {scenarios.map(
          scenario => (
            <button
              key={scenario.id}
              disabled={loading}
              onClick={() =>
                onRun(
                  scenario.id
                )
              }
              className="text-left border border-slate-200 bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,45,65,0.06)] p-5 hover:border-cyan-500/40 transition disabled:opacity-50"
            >

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    {scenario.icon}
                  </div>

                  <p className="font-medium">
                    {scenario.title}
                  </p>
                </div>

                <Play
                  size={15}
                  className="text-slate-600"
                />
              </div>

              <p className="text-xs text-slate-500 mt-4 leading-5">
                {scenario.description}
              </p>
            </button>
          )
        )}
      </div>

      {loading && (
        <p className="text-xs text-cyan-700 mt-4">
          Running deterministic simulation...
        </p>
      )}

      {simulation && (
        <SimulationResult
          simulation={simulation}
        />
      )}
    </div>
  );
}


function SimulationResult({
  simulation
}) {
  const riskClass =
    simulation.riskLevel ===
    "CRITICAL"
      ? "text-red-400"
      : simulation.riskLevel ===
        "WARNING"
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <div className="border border-cyan-600/20 bg-cyan-50 rounded-2xl p-5 mt-6">

      <div className="flex justify-between mb-5">

        <div>
          <h3 className="font-semibold">
            Simulation Outcome
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Cause → effect analysis
          </p>
        </div>

        <div className="text-right">

          <p className="text-[10px] text-slate-500">
            RISK SCORE
          </p>

          <p
            className={`text-3xl font-bold ${riskClass}`}
          >
            {simulation.riskScore}

            <span className="text-sm text-slate-500">
              /100
            </span>
          </p>

          <p
            className={`text-xs ${riskClass}`}
          >
            {simulation.riskLevel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <Panel title="Predicted Effects">

          <div className="space-y-3">

            {simulation.effects?.map(
              (effect, index) => (
                <p
                  key={index}
                  className="text-xs text-slate-500"
                >
                  • {effect}
                </p>
              )
            )}
          </div>
        </Panel>

        <Panel title="Reserve Projection">

          <div className="h-52">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={[
                  {
                    name: "Battery",
                    value:
                      simulation.energy
                        .battery
                  },
                  {
                    name: "Fuel",
                    value:
                      simulation.energy
                        .fuel
                  }
                ]}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                />

                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      "#0f172a",
                    border:
                      "1px solid #334155"
                  }}
                />

                <Bar
                  dataKey="value"
                  fill="#22d3ee"
                  radius={[
                    5,
                    5,
                    0,
                    0
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Recommended Actions">

          <div className="space-y-3">

            {simulation.recommendations?.map(
              (recommendation, index) => (
                <p
                  key={index}
                  className="text-xs text-slate-500"
                >
                  <span className="text-amber-400">
                    {index + 1}.
                  </span>{" "}
                  {recommendation}
                </p>
              )
            )}
          </div>
        </Panel>
      </div>
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

      <div className="border border-slate-200 bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,45,65,0.06)] p-5 mt-4">

        <p className="text-sm font-medium">
          Communication path
        </p>

        <div className="flex items-center gap-3 mt-5 text-xs text-slate-500">

          <span className="px-3 py-2 border border-slate-700 rounded-lg">
            Station
          </span>

          <span>→</span>

          <span className="px-3 py-2 border border-cyan-600/20 text-cyan-700 rounded-lg">
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
    <section className="border border-slate-200 bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,45,65,0.06)] p-5 mb-6">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

        <div>

          <div className="flex items-center gap-3">

            <MapPin
              className="text-cyan-700"
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
      } border border-slate-200 bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,45,65,0.06)] p-5 min-h-[330px]`}
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
    <div className="border border-slate-200 rounded-xl p-4">
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
    <div className="border border-slate-200 bg-white rounded-xl shadow-[0_6px_22px_rgba(15,45,65,0.05)] p-4 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,45,65,0.08)] transition-all duration-200">

      <div className="flex justify-between">

        <span className="text-cyan-700">
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
    <div className="border border-slate-200 bg-white rounded-xl shadow-[0_6px_22px_rgba(15,45,65,0.05)] p-4 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,45,65,0.08)] transition-all duration-200">

      <div className="flex items-center gap-2 text-cyan-700">

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
    <div className="border border-slate-200 rounded-xl p-4">

      <div className="flex flex-col lg:flex-row lg:items-center gap-4">

        <div className="flex items-center gap-3 lg:w-48">

          <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
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
      className="w-full flex items-center justify-center gap-2 border border-cyan-600/20 bg-cyan-50 hover:bg-cyan-50 text-cyan-700 rounded-xl px-4 py-3 text-xs transition disabled:opacity-40"
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
    <div className="border border-slate-200 rounded-xl p-4 flex gap-3">

      <span className="text-cyan-700">
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
    <div className="flex justify-between border-b border-slate-200 pb-3">

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

      <p className="text-xs text-slate-700 mt-1">
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
    <div className="border border-slate-200 rounded-xl p-4">

      <div className="text-cyan-700 mb-3">
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
    <div className="flex gap-3 items-start border-b border-slate-200 pb-2">

      <span className="text-[10px] text-slate-500 whitespace-nowrap">
        {date.toLocaleTimeString()}
      </span>

      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700">
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
  return page === "Overview"
    ? "Antarctic Station Monitor"
    : page;
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