import React, { useState, useEffect, useRef } from "react";
import {
  Radio,
  Send,
  Share2,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Zap,
  Wind,
  Thermometer,
  ShieldCheck,
  Fuel,
  ArrowRightLeft,
  X,
  PlusCircle,
  FileText
} from "lucide-react";

// Default realistic mission seed messages between Bharati and Maitri
const DEFAULT_SEED_MESSAGES = [
  {
    id: "pl-seed-1",
    senderStationId: "maitri",
    senderStationName: "Maitri Base",
    senderLocation: "Schirmacher Oasis (70°46′S)",
    timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type: "text",
    priority: "NORMAL",
    content: "Maitri Comms to Bharati Base: Weather radar indicates a Katabatic wind front descending from the polar plateau toward Queen Maud Land. Wind gusts anticipated > 65 knots within 4 hours. How are conditions in Larsemann Hills?"
  },
  {
    id: "pl-seed-2",
    senderStationId: "bharati",
    senderStationName: "Bharati Base",
    senderLocation: "Larsemann Hills (69°24′S)",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type: "telemetry",
    priority: "NORMAL",
    content: "Bharati Comms copy Maitri. Larsemann Hills currently holding stable conditions with clear skies. Attaching our real-time telemetry snapshot for your weather correlation model.",
    telemetryData: {
      station: "Bharati Station",
      temp: "-22.4°C",
      wind: "18.2 knots",
      pressure: "988 hPa",
      powerOutput: "142 kW",
      fuelReserve: "71%",
      status: "NOMINAL"
    }
  },
  {
    id: "pl-seed-3",
    senderStationId: "maitri",
    senderStationName: "Maitri Base",
    senderLocation: "Schirmacher Oasis (70°46′S)",
    timestamp: new Date(Date.now() - 3600000 * 0.8).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type: "resource_request",
    priority: "HIGH",
    content: "Station Engineer at Maitri logged generator turbine injector degradation on Primary Gen-2. Requesting auxiliary spare units from Bharati inventory for upcoming resupply flight convoy.",
    requestData: {
      item: "Generator Fuel Injector (Cummins Polar-Spec)",
      quantity: "2 Units",
      urgency: "HIGH",
      status: "APPROVED",
      approvedBy: "Bharati Station Logistics",
      approvedAt: new Date(Date.now() - 3600000 * 0.4).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  },
  {
    id: "pl-seed-4",
    senderStationId: "bharati",
    senderStationName: "Bharati Base",
    senderLocation: "Larsemann Hills (69°24′S)",
    timestamp: new Date(Date.now() - 3600000 * 0.3).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type: "text",
    priority: "NORMAL",
    content: "Requisition acknowledged and cleared by Bharati Logistics Bay B. 2x Polar-Spec injectors packaged into thermal flight container. Awaiting weather window for air corridor transit."
  }
];

export default function PolarLink({
  stations = [],
  selectedStation,
  telemetry,
  environment,
  energy,
  inventory,
  isAdmin = true
}) {
  // Active identity for sending messages
  const [activeSender, setActiveSender] = useState(
    selectedStation?.id === "maitri" ? "maitri" : "bharati"
  );

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("nivora_polar_link_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SEED_MESSAGES;
  });

  const [inputMessage, setInputMessage] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Resource Request Form State
  const [reqItem, setReqItem] = useState("Polar Fuel (High-Grade ATF/Diesel)");
  const [reqQuantity, setReqQuantity] = useState("500 Liters");
  const [reqUrgency, setReqUrgency] = useState("HIGH");
  const [reqNotes, setReqNotes] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem("nivora_polar_link_messages", JSON.stringify(messages));
    } catch {}
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const senderName = activeSender === "bharati" ? "Bharati Base" : "Maitri Base";
    const senderLoc = activeSender === "bharati" ? "Larsemann Hills (69°24′S)" : "Schirmacher Oasis (70°46′S)";

    const newMsg = {
      id: "pl-" + Date.now(),
      senderStationId: activeSender,
      senderStationName: senderName,
      senderLocation: senderLoc,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
      priority: priority,
      content: inputMessage.trim()
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
    setPriority("NORMAL");
  };

  const handleAttachTelemetry = () => {
    const senderName = activeSender === "bharati" ? "Bharati Base" : "Maitri Base";
    const senderLoc = activeSender === "bharati" ? "Larsemann Hills (69°24′S)" : "Schirmacher Oasis (70°46′S)";

    // Capture telemetry snapshot
    const tempVal = environment?.temperature?.current != null 
      ? `${environment.temperature.current}°C` 
      : activeSender === "bharati" ? "-22.4°C" : "-28.1°C";

    const windVal = environment?.windSpeed?.current != null 
      ? `${environment.windSpeed.current} knots` 
      : activeSender === "bharati" ? "18.2 knots" : "34.5 knots";

    const pressureVal = environment?.pressure?.current != null 
      ? `${environment.pressure.current} hPa` 
      : "986 hPa";

    const powerVal = energy?.totalPower != null 
      ? `${Math.round(energy.totalPower)} kW` 
      : activeSender === "bharati" ? "142 kW" : "118 kW";

    const fuelVal = inventory?.items?.find(i => i.name.toLowerCase().includes("fuel"))?.current != null
      ? `${inventory.items.find(i => i.name.toLowerCase().includes("fuel")).current}%`
      : activeSender === "bharati" ? "71%" : "64%";

    const newMsg = {
      id: "pl-" + Date.now(),
      senderStationId: activeSender,
      senderStationName: senderName,
      senderLocation: senderLoc,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "telemetry",
      priority: "NORMAL",
      content: `Live operational telemetry broadcast from ${senderName} for inter-station synchronization and mutual awareness.`,
      telemetryData: {
        station: senderName,
        temp: tempVal,
        wind: windVal,
        pressure: pressureVal,
        powerOutput: powerVal,
        fuelReserve: fuelVal,
        status: "NOMINAL"
      }
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  const handleCreateResourceRequest = (e) => {
    e.preventDefault();
    const senderName = activeSender === "bharati" ? "Bharati Base" : "Maitri Base";
    const senderLoc = activeSender === "bharati" ? "Larsemann Hills (69°24′S)" : "Schirmacher Oasis (70°46′S)";
    const targetName = activeSender === "bharati" ? "Maitri Station" : "Bharati Station";

    const newMsg = {
      id: "pl-" + Date.now(),
      senderStationId: activeSender,
      senderStationName: senderName,
      senderLocation: senderLoc,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "resource_request",
      priority: reqUrgency,
      content: reqNotes.trim() || `Operational mutual-aid requisition dispatched from ${senderName} to ${targetName}.`,
      requestData: {
        item: reqItem,
        quantity: reqQuantity,
        urgency: reqUrgency,
        status: "PENDING",
        requestedBy: senderName
      }
    };

    setMessages((prev) => [...prev, newMsg]);
    setShowRequestModal(false);
    setReqNotes("");
  };

  const handleApproveRequest = (msgId) => {
    const approverName = activeSender === "bharati" ? "Bharati Logistics" : "Maitri Logistics";
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.requestData) {
          return {
            ...msg,
            requestData: {
              ...msg.requestData,
              status: "APPROVED",
              approvedBy: approverName,
              approvedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
          };
        }
        return msg;
      })
    );
  };

  const handleResetChat = () => {
    if (window.confirm("Reset Polar Link to default mission history?")) {
      setMessages(DEFAULT_SEED_MESSAGES);
      try {
        localStorage.removeItem("nivora_polar_link_messages");
      } catch {}
    }
  };

  const handleQuickPreset = (presetText, p = "NORMAL") => {
    setInputMessage(presetText);
    setPriority(p);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Banner: POLAR LINK SATELLITE TELEMETRY */}
      <div className="border border-cyan-500/30 bg-[#050e1b] rounded-xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
              </span>
              <span className="text-[11px] font-mono tracking-[0.2em] text-cyan-300 font-bold uppercase">
                POLAR LINK — Tactical Station-to-Station Network
              </span>
              <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[9px] font-mono px-2 py-0.5 rounded">
                NIVORA SECURE COMMS
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <span>Bharati Station</span>
              <ArrowRightLeft size={16} className="text-cyan-400 shrink-0" />
              <span>Maitri Station</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Direct polar data exchange, operational mutual aid, and cross-station tactical awareness across 3,025 km.
            </p>
          </div>

          {/* Telemetry Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            <div className="border border-cyan-500/20 bg-slate-950/60 px-3 py-2 rounded">
              <span className="text-slate-500 block">LINK CARRIER</span>
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <Radio size={11} className="text-emerald-400" /> GSAT-7 / IRIDIUM
              </span>
            </div>
            <div className="border border-cyan-500/20 bg-slate-950/60 px-3 py-2 rounded">
              <span className="text-slate-500 block">POLAR LATENCY</span>
              <span className="text-cyan-300 font-semibold">~418 ms (Relay)</span>
            </div>
            <div className="border border-cyan-500/20 bg-slate-950/60 px-3 py-2 rounded">
              <span className="text-slate-500 block">BEARING / DIST</span>
              <span className="text-slate-200 font-semibold">84.6° | 3,025 km</span>
            </div>
            <div className="border border-cyan-500/20 bg-slate-950/60 px-3 py-2 rounded">
              <span className="text-slate-500 block">ENCRYPTION</span>
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <ShieldCheck size={11} /> AES-256 POLAR
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-4">
        {/* Left Column: Chat Terminal */}
        <div className="border border-cyan-500/25 bg-[#030913] rounded-xl flex flex-col h-[720px] shadow-2xl overflow-hidden">
          {/* Terminal Header */}
          <div className="px-4 py-3 border-b border-cyan-500/20 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                <Radio size={16} />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-slate-200">INTER-STATION COMMS TERMINAL</span>
                <p className="text-[10px] text-slate-500 font-mono">CHANNEL: POLAR-SEC-1 (BHARATI ↔ MAITRI)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetChat}
                title="Reset to mission history"
                className="text-slate-400 hover:text-slate-200 border border-slate-700/50 hover:border-slate-500 bg-slate-900/60 px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw size={11} />
                <span className="hidden sm:inline">Reset History</span>
              </button>
            </div>
          </div>

          {/* Active Station Persona Selector Bar */}
          <div className="px-4 py-2.5 bg-slate-900/60 border-b border-cyan-500/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">You are transmitting as:</span>
              <div className="inline-flex rounded-lg border border-cyan-500/30 p-0.5 bg-slate-950">
                <button
                  onClick={() => setActiveSender("bharati")}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeSender === "bharati"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Bharati Base
                </button>
                <button
                  onClick={() => setActiveSender("maitri")}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeSender === "maitri"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Maitri Base
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">Msg Priority:</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`bg-slate-950 border px-2 py-1 rounded text-[11px] font-mono outline-none cursor-pointer ${
                  priority === "EMERGENCY"
                    ? "border-red-500 text-red-400 font-bold"
                    : priority === "HIGH"
                    ? "border-amber-500 text-amber-300 font-semibold"
                    : "border-slate-700 text-slate-300"
                }`}
              >
                <option value="NORMAL">Normal Routine</option>
                <option value="HIGH">High Priority Warning</option>
                <option value="EMERGENCY">🚨 Emergency SOS</option>
              </select>
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
            {messages.map((msg) => {
              const isBharati = msg.senderStationId === "bharati";
              const isCurrentSender = msg.senderStationId === activeSender;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCurrentSender ? "items-end" : "items-start"}`}
                >
                  {/* Sender metadata stamp */}
                  <div className="flex items-center gap-2 text-[10px] font-mono mb-1 text-slate-400">
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded ${
                        isBharati
                          ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/30"
                          : "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {msg.senderStationName}
                    </span>
                    <span className="text-slate-500">{msg.senderLocation}</span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock size={10} /> {msg.timestamp}
                    </span>
                    {msg.priority === "HIGH" && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded text-[9px]">
                        URGENT
                      </span>
                    )}
                    {msg.priority === "EMERGENCY" && (
                      <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-1 rounded text-[9px] animate-pulse">
                        EMERGENCY SOS
                      </span>
                    )}
                  </div>

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[85%] rounded-xl p-3.5 text-xs ${
                      isCurrentSender
                        ? isBharati
                          ? "bg-cyan-950/30 border border-cyan-500/30 text-slate-100"
                          : "bg-amber-950/30 border border-amber-500/30 text-slate-100"
                        : "bg-slate-900/80 border border-slate-700/50 text-slate-200"
                    }`}
                  >
                    {/* Plain message text */}
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    {/* Telemetry Snapshot Attachment Card */}
                    {msg.type === "telemetry" && msg.telemetryData && (
                      <div className="mt-3 p-3 rounded-lg border border-cyan-500/30 bg-[#061424] font-mono space-y-2">
                        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 text-[10px]">
                          <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                            <Share2 size={12} /> TELEMETRY SNAPSHOT
                          </span>
                          <span className="text-emerald-400">SYNCED {msg.telemetryData.status}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                          <div>
                            <span className="text-slate-500 text-[9px] block flex items-center gap-1">
                              <Thermometer size={10} className="text-cyan-400" /> AMBIENT TEMP
                            </span>
                            <span className="text-slate-200 font-semibold">{msg.telemetryData.temp}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[9px] block flex items-center gap-1">
                              <Wind size={10} className="text-cyan-400" /> WIND SPEED
                            </span>
                            <span className="text-slate-200 font-semibold">{msg.telemetryData.wind}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[9px] block">BARO PRESSURE</span>
                            <span className="text-slate-200 font-semibold">{msg.telemetryData.pressure}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[9px] block flex items-center gap-1">
                              <Zap size={10} className="text-amber-400" /> POWER OUTPUT
                            </span>
                            <span className="text-slate-200 font-semibold">{msg.telemetryData.powerOutput}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[9px] block flex items-center gap-1">
                              <Fuel size={10} className="text-amber-400" /> FUEL LEVEL
                            </span>
                            <span className="text-slate-200 font-semibold">{msg.telemetryData.fuelReserve}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mutual Aid Resource Requisition Card */}
                    {msg.type === "resource_request" && msg.requestData && (
                      <div className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-[#17130a] font-mono space-y-2.5">
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5 text-[10px]">
                          <span className="text-amber-300 font-bold flex items-center gap-1.5">
                            <Package size={12} /> MUTUAL AID REQUISITION
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              msg.requestData.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                            }`}
                          >
                            {msg.requestData.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 text-[9px] block">REQUESTED RESOURCE</span>
                            <span className="text-white font-semibold">{msg.requestData.item}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[9px] block">QUANTITY</span>
                            <span className="text-white font-semibold">{msg.requestData.quantity}</span>
                          </div>
                        </div>

                        {msg.requestData.status === "APPROVED" ? (
                          <div className="pt-2 border-t border-emerald-500/20 text-[10px] text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 size={12} />
                            <span>
                              Approved by {msg.requestData.approvedBy} at {msg.requestData.approvedAt}
                            </span>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400">Awaiting clearance from recipient base:</span>
                            {/* Button allows the recipient station to acknowledge / approve */}
                            <button
                              onClick={() => handleApproveRequest(msg.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition shadow cursor-pointer"
                            >
                              <CheckCircle2 size={11} />
                              Approve Transfer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Action Bar */}
          <div className="p-3 bg-slate-950 border-t border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAttachTelemetry}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono transition cursor-pointer"
                title="Send real-time telemetry snapshot of active station"
              >
                <Share2 size={13} />
                <span>Attach Telemetry</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono transition cursor-pointer"
                title="Request mutual aid resources, spare parts or fuel"
              >
                <Package size={13} />
                <span>Request Resources</span>
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Transmit dispatch to ${activeSender === "bharati" ? "Maitri Base" : "Bharati Base"}...`}
                className="flex-1 bg-[#061120] border border-cyan-500/30 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0"
              >
                <Send size={14} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Mission Control Quick Presets & Tactical Directory */}
        <div className="space-y-4">
          {/* Tactical Station Directory */}
          <div className="border border-cyan-500/25 bg-[#030913] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase flex items-center gap-2">
              <Radio size={14} />
              Station Coordinates
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div
                onClick={() => setActiveSender("bharati")}
                className={`p-2.5 rounded-lg border cursor-pointer transition ${
                  activeSender === "bharati"
                    ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-200"
                    : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Bharati Station</span>
                  <span className="text-[10px] text-cyan-400">ACTIVE</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Larsemann Hills (69°24′S, 76°11′E)</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Role: Modern Containerized Research</p>
              </div>

              <div
                onClick={() => setActiveSender("maitri")}
                className={`p-2.5 rounded-lg border cursor-pointer transition ${
                  activeSender === "maitri"
                    ? "border-amber-500/50 bg-amber-950/40 text-amber-200"
                    : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Maitri Station</span>
                  <span className="text-[10px] text-amber-400">ACTIVE</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Schirmacher Oasis (70°46′S, 11°44′E)</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Role: Inland Queen Maud Land Base</p>
              </div>
            </div>
          </div>

          {/* Fast Tactical Dispatch Presets */}
          <div className="border border-cyan-500/25 bg-[#030913] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-2">
              <FileText size={14} className="text-cyan-400" />
              Quick Dispatch Presets
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              Click to load standard polar communication procedures into the transmit buffer:
            </p>

            <div className="space-y-1.5">
              <button
                onClick={() =>
                  handleQuickPreset(
                    "Weather advisory: Katabatic wind speeds approaching 60 knots. Recommend securing peripheral scientific antenna arrays.",
                    "HIGH"
                  )
                }
                className="w-full text-left p-2 rounded-lg border border-slate-800 hover:border-amber-500/40 bg-slate-900/50 hover:bg-slate-900 text-[11px] text-slate-300 font-mono transition cursor-pointer"
              >
                ⚠️ Katabatic Storm Warning
              </button>

              <button
                onClick={() =>
                  handleQuickPreset(
                    "Fuel status inquiry: Confirming main diesel generator reserves ahead of scheduled 14-day supply corridor freeze.",
                    "NORMAL"
                  )
                }
                className="w-full text-left p-2 rounded-lg border border-slate-800 hover:border-cyan-500/40 bg-slate-900/50 hover:bg-slate-900 text-[11px] text-slate-300 font-mono transition cursor-pointer"
              >
                ⛽ Fuel Status Check
              </button>

              <button
                onClick={() =>
                  handleQuickPreset(
                    "Flight Operations: Polar helicopter transit window identified between 1100 UTC and 1600 UTC tomorrow. Confirm runway visual clearance.",
                    "NORMAL"
                  )
                }
                className="w-full text-left p-2 rounded-lg border border-slate-800 hover:border-cyan-500/40 bg-slate-900/50 hover:bg-slate-900 text-[11px] text-slate-300 font-mono transition cursor-pointer"
              >
                🚁 Flight Corridor Clearance
              </button>

              <button
                onClick={() =>
                  handleQuickPreset(
                    "Emergency SOS: Field traverse expedition team 40km southwest reports communication loss in whiteout. Standby for joint SAR search protocol.",
                    "EMERGENCY"
                  )
                }
                className="w-full text-left p-2 rounded-lg border border-red-900/40 hover:border-red-500 bg-red-950/20 hover:bg-red-950/40 text-[11px] text-red-300 font-mono transition cursor-pointer"
              >
                🚨 Emergency SAR Broadcast
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Requisition Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="border border-amber-500/40 bg-[#0a121e] rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-amber-950/50 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Mutual Aid Requisition</h3>
                  <p className="text-[10px] text-slate-400">Inter-Station Polar Resource Dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-white text-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateResourceRequest} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase">Select Item Type</label>
                <select
                  value={reqItem}
                  onChange={(e) => setReqItem(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-amber-400 outline-none"
                >
                  <option value="Polar Fuel (High-Grade ATF/Diesel)">Polar Fuel (High-Grade ATF / Diesel)</option>
                  <option value="Generator Fuel Injectors (Cummins Polar-Spec)">Generator Fuel Injectors (Cummins Polar-Spec)</option>
                  <option value="Emergency Medical Trauma Kit">Emergency Medical Trauma Kit</option>
                  <option value="Water Desalination Filter Membranes">Water Desalination Filter Membranes</option>
                  <option value="Freeze-Dried Life-Support Rations">Freeze-Dried Life-Support Rations</option>
                  <option value="High-Altitude Hydraulic Fluid">High-Altitude Hydraulic Fluid</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase">Quantity & Unit</label>
                <input
                  type="text"
                  value={reqQuantity}
                  onChange={(e) => setReqQuantity(e.target.value)}
                  placeholder="e.g. 500 Liters, 2 Units, 1 Kit"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase">Urgency Level</label>
                <select
                  value={reqUrgency}
                  onChange={(e) => setReqUrgency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-amber-400 outline-none"
                >
                  <option value="NORMAL">Normal Routine Requisition</option>
                  <option value="HIGH">High Priority (Within 48 Hours)</option>
                  <option value="EMERGENCY">Emergency Critical (Immediate)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase">Operational Notes / Reason</label>
                <textarea
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Briefly state the equipment condition or operational requirement..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-amber-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow cursor-pointer"
                >
                  Dispatch Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
