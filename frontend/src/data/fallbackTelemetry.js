// Comprehensive Fallback & Simulation Telemetry for NIVORA (Network for Intelligent Virtual Operations and Remote Analytics)
// Provides realistic operational data for Maitri and Bharati stations

export const FALLBACK_STATIONS = [
  {
    id: "maitri",
    name: "Maitri Research Station",
    shortName: "Maitri",
    code: "IN-MAI",
    location: {
      latitude: -70.7644,
      longitude: 11.7342
    },
    region: "Schirmacher Oasis, Queen Maud Land",
    elevation: 50,
    established: "1989",
    mainBuildingCapacity: 25,
    summerCapacity: 65,
    winterCapacity: 25,
    communication: "Dedicated Ku-band Satellite & Inmarsat",
    power: "Tri-generator diesel array + 15kW Solar PV array",
    heating: "Automated glycol heat recovery & electric radiators",
    status: "OPERATIONAL",
    subsystems: [
      { id: "habitat", name: "Main Living & Science Habitat", health: 98, status: "Optimal", powerKw: 24.2, tempC: 21.5 },
      { id: "solar", name: "Solar PV Farm (Schirmacher)", health: 94, status: "Active", powerKw: 12.8, efficiency: 89 },
      { id: "wind", name: "Polar Wind Turbines", health: 91, status: "Active", powerKw: 18.5, rpm: 210 },
      { id: "fuel", name: "Jet A-1 / ATF Fuel Depot", health: 100, status: "Secured", capacityLiters: 120000, currentLiters: 92400 },
      { id: "radome", name: "Ku-Band Tracking Radome", health: 96, status: "Locked", latencyMs: 245, snrDb: 14.8 },
      { id: "weather", name: "Met Mast & Atmospheric Lidar", health: 97, status: "Transmitting", sampleRateHz: 10 }
    ]
  },
  {
    id: "bharati",
    name: "Bharati Research Station",
    shortName: "Bharati",
    code: "IN-BHA",
    location: {
      latitude: -69.4068,
      longitude: 76.1953
    },
    region: "Larsemann Hills, Stornes Peninsula",
    elevation: 35,
    established: "2012",
    mainBuildingCapacity: 47,
    summerCapacity: 72,
    winterCapacity: 40,
    communication: "High-throughput Ka/Ku Dual Satellite Uplink",
    power: "Multi-redundant CHP generation + Rooftop bifacial PV",
    heating: "High-efficiency HVAC heat pump & recovery ventilation",
    status: "OPERATIONAL",
    subsystems: [
      { id: "habitat", name: "Modular Aerodynamic Complex", health: 99, status: "Optimal", powerKw: 38.5, tempC: 22.0 },
      { id: "solar", name: "Bifacial Microgrid Solar", health: 96, status: "Active", powerKw: 22.4, efficiency: 94 },
      { id: "wind", name: "High-wind Vertical Axis Turbines", health: 95, status: "Active", powerKw: 26.1, rpm: 290 },
      { id: "fuel", name: "Main Cryo-Insulated Tank Farm", health: 98, status: "Secured", capacityLiters: 250000, currentLiters: 198500 },
      { id: "radome", name: "ISRO Ground Station & Radome", health: 99, status: "Tracking", latencyMs: 190, snrDb: 17.2 },
      { id: "weather", name: "Ocean-Atmosphere Boundary Mast", health: 98, status: "Transmitting", sampleRateHz: 20 }
    ]
  }
];

export const FALLBACK_ENVIRONMENT = {
  maitri: {
    temperature: -18.4,
    apparentTemperature: -28.6,
    humidity: 61,
    pressure: 982.5,
    windSpeed: 21.2,
    windDirection: "SW",
    windGust: 34.0,
    uvIndex: 1.2,
    visibilityKm: 35.0,
    solarRadiation: 145,
    blizzardRisk: "LOW",
    auroraActivity: "MODERATE (Kp 4.2)",
    history: [
      { time: "00:00", temperature: -21.2, windSpeed: 16.5, pressure: 984 },
      { time: "04:00", temperature: -20.1, windSpeed: 17.8, pressure: 983 },
      { time: "08:00", temperature: -18.8, windSpeed: 19.2, pressure: 982 },
      { time: "12:00", temperature: -16.4, windSpeed: 22.5, pressure: 981 },
      { time: "16:00", temperature: -17.5, windSpeed: 21.0, pressure: 982 },
      { time: "20:00", temperature: -18.4, windSpeed: 21.2, pressure: 982.5 }
    ]
  },
  bharati: {
    temperature: -12.1,
    apparentTemperature: -22.4,
    humidity: 68,
    pressure: 976.2,
    windSpeed: 28.6,
    windDirection: "NW",
    windGust: 42.1,
    uvIndex: 1.8,
    visibilityKm: 28.0,
    solarRadiation: 210,
    blizzardRisk: "MODERATE",
    auroraActivity: "HIGH (Kp 5.8)",
    history: [
      { time: "00:00", temperature: -15.1, windSpeed: 22.0, pressure: 978 },
      { time: "04:00", temperature: -14.2, windSpeed: 24.5, pressure: 977 },
      { time: "08:00", temperature: -12.8, windSpeed: 26.8, pressure: 976 },
      { time: "12:00", temperature: -10.4, windSpeed: 30.1, pressure: 975 },
      { time: "16:00", temperature: -11.6, windSpeed: 28.4, pressure: 976 },
      { time: "20:00", temperature: -12.1, windSpeed: 28.6, pressure: 976.2 }
    ]
  }
};

export const FALLBACK_ENERGY = {
  maitri: {
    totalGenerationKw: 72.5,
    consumptionKw: 58.4,
    batterySocPercent: 86.4,
    batteryHealthPercent: 94.0,
    dieselOutputKw: 41.2,
    solarOutputKw: 12.8,
    windOutputKw: 18.5,
    gridFrequencyHz: 50.08,
    gridVoltageV: 400.2,
    history: [
      { time: "00:00", generation: 68, consumption: 54, battery: 88 },
      { time: "04:00", generation: 67, consumption: 52, battery: 87 },
      { time: "08:00", generation: 74, consumption: 59, battery: 86 },
      { time: "12:00", generation: 82, consumption: 64, battery: 89 },
      { time: "16:00", generation: 76, consumption: 61, battery: 88 },
      { time: "20:00", generation: 72, consumption: 58, battery: 86 }
    ]
  },
  bharati: {
    totalGenerationKw: 118.2,
    consumptionKw: 92.6,
    batterySocPercent: 91.2,
    batteryHealthPercent: 98.2,
    dieselOutputKw: 69.7,
    solarOutputKw: 22.4,
    windOutputKw: 26.1,
    gridFrequencyHz: 50.02,
    gridVoltageV: 401.1,
    history: [
      { time: "00:00", generation: 105, consumption: 86, battery: 92 },
      { time: "04:00", generation: 102, consumption: 84, battery: 91 },
      { time: "08:00", generation: 114, consumption: 92, battery: 90 },
      { time: "12:00", generation: 128, consumption: 98, battery: 94 },
      { time: "16:00", generation: 120, consumption: 95, battery: 93 },
      { time: "20:00", generation: 118, consumption: 92, battery: 91 }
    ]
  }
};

export const FALLBACK_INVENTORY = {
  maitri: {
    fuelDaysRemaining: 184,
    fuelLiters: 92400,
    foodDaysRemaining: 210,
    waterLiters: 34500,
    medicalSuppliesPercent: 88,
    criticalSparePartsPercent: 92,
    items: [
      { name: "Jet A-1 Fuel (ATF)", stock: "92,400 L", status: "Adequate", days: 184, minThreshold: "25,000 L" },
      { name: "Fresh Potable Water", stock: "34,500 L", status: "Normal", days: 140, minThreshold: "10,000 L" },
      { name: "Freeze-Dried Rations", stock: "210 Days", status: "Optimal", days: 210, minThreshold: "60 Days" },
      { name: "Medical Trauma Kits", stock: "14 Units", status: "Optimal", days: 360, minThreshold: "5 Units" },
      { name: "Generator Spares (Filters & Injectors)", stock: "42 Units", status: "Good", days: 240, minThreshold: "12 Units" },
      { name: "Snow Vehicle Tracks & Lubricant", stock: "6 Sets", status: "Attention", days: 95, minThreshold: "4 Sets" }
    ]
  },
  bharati: {
    fuelDaysRemaining: 240,
    fuelLiters: 198500,
    foodDaysRemaining: 260,
    waterLiters: 58000,
    medicalSuppliesPercent: 95,
    criticalSparePartsPercent: 96,
    items: [
      { name: "Polar Diesel & ATF", stock: "198,500 L", status: "Optimal", days: 240, minThreshold: "40,000 L" },
      { name: "Meltwater Reservoir", stock: "58,000 L", status: "Optimal", days: 190, minThreshold: "15,000 L" },
      { name: "Expedition Provisions", stock: "260 Days", status: "Optimal", days: 260, minThreshold: "90 Days" },
      { name: "Surgical & Telemedicine Spares", stock: "28 Kits", status: "Optimal", days: 400, minThreshold: "8 Kits" },
      { name: "HVAC Glycol Pumps & Redundant Valves", stock: "18 Units", status: "Optimal", days: 310, minThreshold: "6 Units" },
      { name: "Heavy PistenBully Tread Sets", stock: "8 Sets", status: "Optimal", days: 180, minThreshold: "4 Sets" }
    ]
  }
};

export const FALLBACK_LOGISTICS = {
  maitri: {
    nextResupplyVessel: "MV Vasiliy Golovnin (Expedition 44)",
    etaDays: 54,
    resupplyWindowStatus: "Open (Austral Summer)",
    airdropCapability: "Restricted by Oasis wind gradient",
    seaIceThicknessMeters: 1.85,
    activeRoutes: [
      { name: "Schirmacher Ice Runway (DROMLAN)", status: "Operational", surfaceTemp: -19, condition: "Groomed Blue Ice" },
      { name: "India Bay Sea-Ice Convoy Route", status: "Active (Tracked)", lengthKm: 98, convoyEtaHours: 6 }
    ]
  },
  bharati: {
    nextResupplyVessel: "RV Bharati Resupply Icebreaker",
    etaDays: 38,
    resupplyWindowStatus: "Optimal (Prydz Bay Approach)",
    airdropCapability: "Full Support (Helipad Active)",
    seaIceThicknessMeters: 1.42,
    activeRoutes: [
      { name: "Larsemann Coastal Helo Corridor", status: "Clear", surfaceTemp: -12, condition: "Visual Flight Rules" },
      { name: "Prydz Bay Barge Disembarkation Point", status: "Open", lengthKm: 12, convoyEtaHours: 1.5 }
    ]
  }
};

export const FALLBACK_ALERTS = [
  {
    id: "alt-101",
    level: "INFO",
    title: "Solar Flare Geomagnetic Watch",
    time: "12m ago",
    station: "Bharati",
    details: "High ionospheric disturbance detected. Ku-band uplink may experience 0.8dB SNR drop."
  },
  {
    id: "alt-102",
    level: "WARNING",
    title: "Katabatic Wind Advisory (>35 knots)",
    time: "48m ago",
    station: "Maitri",
    details: "Antarctic continental drainage wind intensifying. Perimeter safety protocol initiated."
  },
  {
    id: "alt-103",
    level: "INFO",
    title: "Automated Life-Support Rebalance Complete",
    time: "2h ago",
    station: "Bharati",
    details: "HVAC thermal loop adjusted to match outdoor drop (-10.4°C to -12.1°C)."
  }
];

export const FALLBACK_SATELLITE_PASSES = [
  { sat: "GSAT-7A (Indian Military/Research)", elevationDeg: 28.4, azimuthDeg: 342, status: "LOCKED", snr: "16.8 dB", nextAos: "In Coverage" },
  { sat: "METOP-B (Polar Weather L-band)", elevationDeg: 72.1, azimuthDeg: 188, status: "ACQUIRING", snr: "14.2 dB", nextAos: "00:14:20" },
  { sat: "NOAA-20 (Atmospheric Sounding)", elevationDeg: 54.0, azimuthDeg: 215, status: "TRACKED", snr: "15.1 dB", nextAos: "00:38:10" },
{ sat: "RISAT-2B (SAR Sea-Ice Radar)", elevationDeg: 18.5, azimuthDeg: 92, status: "SCHEDULED", snr: "--", nextAos: "01:22:45" }];
